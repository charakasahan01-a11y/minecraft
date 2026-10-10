/**
 * GameEngine - Central orchestrator for the 3D Minecraft scene
 * Manages Three.js renderer, player physics, world update,
 * animal herds (pigs, cows, sheep), interactive village, campfire cooking,
 * game station archery challenge, inventory hotbar, and health/hunger.
 */
import * as THREE from 'three';
import { MinecraftWorld } from './world';
import { MinecraftPlayer } from './player';
import { ThirdPersonCamera, CameraPerspective } from './camera';
import { InputManager } from './controls';
import { sound } from './sound';
import { MinecraftVillage } from './village';
import { Animal, DroppedItem, AnimalType } from './entities/Animal';
import { CookingManager } from './cooking';
import { GameStationManager } from './minigame';
import { ITEMS, InventorySlot } from './items';

export type { CameraPerspective };

export interface GameTelemetry {
  fps: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  isGrounded: boolean;
  isSprinting: boolean;
  perspective: CameraPerspective;
  isLocked: boolean;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  hotbar: (InventorySlot | null)[];
  selectedSlot: number;
  interactionPrompt: string | null;
  activeDialogue: { name: string; text: string } | null;
  cookingProgress: { isCooking: boolean; progress: number; rawItem: string; resultItem: string } | null;
  gameStation: {
    isActive: boolean;
    score: number;
    highScore: number;
    timeLeft: number;
    combo: number;
    emeralds: number;
  };
}

export interface GameEngineOptions {
  onTelemetry?: (telemetry: GameTelemetry) => void;
  onLockChange?: (locked: boolean) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private world: MinecraftWorld;
  private village: MinecraftVillage;
  private player: MinecraftPlayer;
  private cameraController: ThirdPersonCamera;
  private input: InputManager;

  // Subsystems
  public cooking: CookingManager;
  public gameStation: GameStationManager;

  // Entities
  private animals: Animal[] = [];
  private droppedItems: DroppedItem[] = [];

  // Player state
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private isGrounded: boolean = true;
  private wasGrounded: boolean = true;

  public health: number = 20;
  public maxHealth: number = 20;
  public hunger: number = 18;
  public maxHunger: number = 20;

  // Hotbar (9 slots)
  public hotbar: (InventorySlot | null)[] = [
    { item: ITEMS.wooden_sword, count: 1 },
    { item: ITEMS.bow, count: 1 },
    { item: ITEMS.apple, count: 4 },
    { item: ITEMS.cooked_steak, count: 2 },
    { item: ITEMS.wood_planks, count: 16 },
    null,
    null,
    null,
    null,
  ];
  public selectedSlot: number = 0;

  // UI state
  private interactionPrompt: string | null = null;
  private activeDialogue: { name: string; text: string } | null = null;
  private dialogueTimer: number = 0;

  // Physics constants
  private readonly GRAVITY = 26;
  private readonly JUMP_FORCE = 8.6;
  private readonly WALK_SPEED = 4.4;
  private readonly SPRINT_SPEED = 7.4;
  private readonly ACCELERATION = 28;
  private readonly DECELERATION = 32;

  // Loop & metrics
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;

  private onTelemetry?: (telemetry: GameTelemetry) => void;

  constructor(container: HTMLElement, options: GameEngineOptions = {}) {
    this.container = container;
    this.onTelemetry = options.onTelemetry;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 3. Camera Controller
    this.cameraController = new ThirdPersonCamera(width / height);

    // 4. World
    this.world = new MinecraftWorld(this.scene);

    // 5. Village
    this.village = new MinecraftVillage(this.scene);

    // 6. Subsystems
    this.cooking = new CookingManager();
    this.gameStation = new GameStationManager();

    // 7. Player
    this.player = new MinecraftPlayer();
    this.player.group.position.copy(this.playerPos);
    this.scene.add(this.player.group);
    this.updateHeldItemVisual();

    // 8. Spawn Animals
    this.spawnAnimals();

    // 9. Controls
    this.input = new InputManager();
    this.input.attach(this.renderer.domElement);
    this.input.onLockChange = (locked) => {
      if (options.onLockChange) {
        options.onLockChange(locked);
      }
    };

    window.addEventListener('resize', this.onResize);
  }

  private spawnAnimals() {
    // Herd of pigs
    const pigCoords = [
      [-6, -14],
      [-9, -18],
      [8, -12],
      [12, -15],
      [-14, -36],
      [6, -30],
    ];
    pigCoords.forEach(([x, z]) => {
      const pig = new Animal('pig', new THREE.Vector3(x, 0, z));
      this.animals.push(pig);
      this.scene.add(pig.group);
    });

    // Herd of cows
    const cowCoords = [
      [10, -22],
      [14, -26],
      [-18, -20],
      [24, -38],
    ];
    cowCoords.forEach(([x, z]) => {
      const cow = new Animal('cow', new THREE.Vector3(x, 0, z));
      this.animals.push(cow);
      this.scene.add(cow.group);
    });

    // Herd of sheep
    const sheepCoords = [
      [-5, -28],
      [-10, -32],
      [-3, -56],
      [7, -54],
    ];
    sheepCoords.forEach(([x, z]) => {
      const sheep = new Animal('sheep', new THREE.Vector3(x, 0, z));
      this.animals.push(sheep);
      this.scene.add(sheep.group);
    });
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.cameraController.setAspect(width / height);
    this.renderer.setSize(width, height);
  };

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public requestPointerLock() {
    this.input.requestPointerLock();
  }

  public exitPointerLock() {
    this.input.exitPointerLock();
  }

  public getIsLocked(): boolean {
    return this.input.getIsLocked();
  }

  public cyclePerspective(): CameraPerspective {
    const p = this.cameraController.cyclePerspective();
    this.player.group.visible = p !== 'first_person';
    return p;
  }

  public setPerspective(p: CameraPerspective) {
    this.cameraController.setPerspective(p);
    this.player.group.visible = p !== 'first_person';
  }

  public setSensitivity(val: number) {
    this.input.sensitivity = val;
  }

  public setInvertY(invert: boolean) {
    this.input.invertY = invert;
  }

  public setFov(fov: number) {
    this.cameraController.baseFov = fov;
  }

  public setCameraDistance(dist: number) {
    this.cameraController.distance = dist;
  }

  public respawn() {
    this.playerPos.set(0, 0, 0);
    this.playerVelocity.set(0, 0, 0);
    this.player.group.position.copy(this.playerPos);
    this.cameraController.yaw = 0;
    this.cameraController.pitch = -0.15;
  }

  public selectHotbarSlot(index: number) {
    if (index >= 0 && index < 9) {
      this.selectedSlot = index;
      this.updateHeldItemVisual();
      sound.playClick();
    }
  }

  private updateHeldItemVisual() {
    const slot = this.hotbar[this.selectedSlot];
    const itemId = slot ? slot.item.id : null;
    this.player.setHeldItem(itemId);
  }

  /**
   * Add item to inventory hotbar
   */
  public addItem(itemId: string, count = 1) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return;

    // First try stacking in existing slot
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i];
      if (slot && slot.item.id === itemId && slot.count < itemDef.maxStack) {
        slot.count += count;
        this.updateHeldItemVisual();
        sound.playItemPop();
        return;
      }
    }

    // Otherwise find empty slot
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { item: itemDef, count };
        this.updateHeldItemVisual();
        sound.playItemPop();
        return;
      }
    }
  }

  /**
   * Consume / eat food item
   */
  public eatHeldItem(): boolean {
    const slot = this.hotbar[this.selectedSlot];
    if (!slot) return false;

    if (slot.item.category === 'food' || slot.item.category === 'raw_food') {
      const restore = slot.item.foodValue || 2;
      this.health = Math.min(this.maxHealth, this.health + restore);
      this.hunger = Math.min(this.maxHunger, this.hunger + restore * 2);

      sound.playEat();

      slot.count -= 1;
      if (slot.count <= 0) {
        this.hotbar[this.selectedSlot] = null;
      }
      this.updateHeldItemVisual();
      return true;
    }
    return false;
  }

  /**
   * Spawn 3D dropped item mesh when animal is defeated
   */
  private spawnDroppedItem(itemId: string, pos: THREE.Vector3) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return;

    const group = new THREE.Group();
    const isMeat = itemId.includes('porkchop') || itemId.includes('beef') || itemId.includes('mutton');
    const color = isMeat ? 0xf06292 : 0x4caf50;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    mesh.castShadow = true;
    group.add(mesh);
    group.position.set(pos.x, 0.3, pos.z);

    this.scene.add(group);
    this.droppedItems.push({
      id: itemId,
      count: 1,
      mesh: group as unknown as THREE.Mesh,
      position: group.position,
      spawnTime: performance.now(),
    });
  }

  /**
   * Attack action (Left click or F key)
   */
  public handleAttack() {
    this.player.triggerAttack();
    sound.playAttackSwing();

    const heldItem = this.hotbar[this.selectedSlot]?.item;
    const damage = heldItem?.damage || 2; // wooden sword = 4, bare hands = 2

    // Check if hitting Game Station targets
    let hitAnyTarget = false;
    for (const target of this.village.targets) {
      const dist = this.playerPos.distanceTo(target.position);
      // If holding bow, range is longer (up to 25m), otherwise 5.5m
      const maxRange = heldItem?.id === 'bow' ? 24 : 5.5;

      if (dist <= maxRange) {
        // Forward alignment check
        const dirToTarget = new THREE.Vector3()
          .subVectors(target.position, this.playerPos)
          .normalize();
        const lookDir = new THREE.Vector3(
          -Math.sin(this.cameraController.yaw),
          0,
          -Math.cos(this.cameraController.yaw)
        );

        if (dirToTarget.dot(lookDir) > 0.8) {
          const points = this.village.hitTarget(target.id);
          const { newEmerald } = this.gameStation.registerHit(points);
          if (newEmerald) {
            this.addItem('emerald', 1);
          }
          hitAnyTarget = true;
          break;
        }
      }
    }

    if (heldItem?.id === 'bow') {
      sound.playBowShoot();
      if (!hitAnyTarget) {
        this.gameStation.registerMiss();
      }
      return;
    }

    // Check if hitting animals (within 3.2m in front)
    for (const animal of this.animals) {
      if (animal.isDead) continue;
      const dist = this.playerPos.distanceTo(animal.position);
      if (dist <= 3.2) {
        const result = animal.takeDamage(damage, this.playerPos);
        if (result.isKilled && result.dropItem) {
          this.spawnDroppedItem(result.dropItem, animal.position);
        }
        break;
      }
    }
  }

  /**
   * Interact action (Right click or E key)
   */
  public handleInteract() {
    // 1. Check if near campfire to cook raw food
    if (this.cooking.isNearCampfire(this.playerPos)) {
      const currentSlot = this.hotbar[this.selectedSlot];
      if (currentSlot && currentSlot.item.category === 'raw_food') {
        const started = this.cooking.startCooking(currentSlot.item.id);
        if (started) {
          currentSlot.count -= 1;
          if (currentSlot.count <= 0) {
            this.hotbar[this.selectedSlot] = null;
          }
          this.updateHeldItemVisual();
          return;
        }
      } else {
        // Check if any slot has raw food
        const rawSlot = this.hotbar.find((s) => s && s.item.category === 'raw_food');
        if (rawSlot) {
          const started = this.cooking.startCooking(rawSlot.item.id);
          if (started) {
            rawSlot.count -= 1;
            if (rawSlot.count <= 0) {
              const idx = this.hotbar.indexOf(rawSlot);
              this.hotbar[idx] = null;
            }
            this.updateHeldItemVisual();
            return;
          }
        }
      }
    }

    // 2. Check if near Game Station to start/toggle round
    if (this.gameStation.isNearStation(this.playerPos)) {
      if (!this.gameStation.state.isActive) {
        this.gameStation.startRound();
        return;
      }
    }

    // 3. Check if near Villager to talk
    for (const villager of this.village.villagers) {
      const dist = this.playerPos.distanceTo(villager.position);
      if (dist <= 3.5) {
        sound.playVillagerHrm();
        this.activeDialogue = {
          name: villager.name,
          text: villager.dialogue,
        };
        this.dialogueTimer = 4.5;
        return;
      }
    }

    // 4. If holding food, eat it
    const slot = this.hotbar[this.selectedSlot];
    if (slot && (slot.item.category === 'food' || slot.item.category === 'raw_food')) {
      this.eatHeldItem();
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.frameCount++;
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    this.update(deltaTime, now / 1000);
    this.render();
  };

  private update(deltaTime: number, timeSec: number) {
    const inputState = this.input.poll();

    // Toggle perspective
    if (inputState.viewToggle) {
      this.cyclePerspective();
    }

    // Hotbar selection from 1-9
    if (inputState.selectedSlotIndex !== null) {
      this.selectHotbarSlot(inputState.selectedSlotIndex);
    }

    // Attack action
    if (inputState.attack) {
      this.handleAttack();
    }

    // Interact action
    if (inputState.interact) {
      this.handleInteract();
    }

    // 1. Calculate desired horizontal movement
    const forwardX = Math.sin(this.cameraController.yaw);
    const forwardZ = Math.cos(this.cameraController.yaw);
    const rightX = Math.cos(this.cameraController.yaw);
    const rightZ = -Math.sin(this.cameraController.yaw);

    let moveX = 0;
    let moveZ = 0;

    if (inputState.forward) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    if (inputState.backward) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    if (inputState.left) {
      moveX -= rightX;
      moveZ -= rightZ;
    }
    if (inputState.right) {
      moveX += rightX;
      moveZ += rightZ;
    }

    const inputLength = Math.hypot(moveX, moveZ);
    const isMoving = inputLength > 0.001;

    let wishDirX = 0;
    let wishDirZ = 0;
    if (isMoving) {
      wishDirX = moveX / inputLength;
      wishDirZ = moveZ / inputLength;
    }

    // 2. Sprinting condition
    const canSprint = inputState.sprint && isMoving;
    const targetSpeed = canSprint ? this.SPRINT_SPEED : this.WALK_SPEED;

    // 3. Velocity acceleration & friction
    const targetVelX = isMoving ? wishDirX * targetSpeed : 0;
    const targetVelZ = isMoving ? wishDirZ * targetSpeed : 0;

    const accel = isMoving ? this.ACCELERATION : this.DECELERATION;
    const airControl = this.isGrounded ? 1.0 : 0.45;
    const lerpRate = Math.min(1, deltaTime * accel * airControl);

    this.playerVelocity.x = THREE.MathUtils.lerp(this.playerVelocity.x, targetVelX, lerpRate);
    this.playerVelocity.z = THREE.MathUtils.lerp(this.playerVelocity.z, targetVelZ, lerpRate);

    // 4. Vertical physics & Jump
    if (this.isGrounded) {
      this.playerVelocity.y = 0;
      if (inputState.jump) {
        this.playerVelocity.y = this.JUMP_FORCE;
        this.isGrounded = false;
        sound.playJump();
      }
    } else {
      this.playerVelocity.y -= this.GRAVITY * deltaTime;
    }

    // 5. Update Position
    this.playerPos.x += this.playerVelocity.x * deltaTime;
    this.playerPos.z += this.playerVelocity.z * deltaTime;
    this.playerPos.y += this.playerVelocity.y * deltaTime;

    // Ground collision
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      if (!this.wasGrounded && this.playerVelocity.y < -3.5) {
        sound.playLand();
      }
      this.isGrounded = true;
      this.playerVelocity.y = 0;
    } else {
      this.isGrounded = false;
    }
    this.wasGrounded = this.isGrounded;

    // 6. Update Player mesh position and facing orientation
    this.player.group.position.copy(this.playerPos);

    if (isMoving) {
      const facingAngle = Math.atan2(wishDirX, wishDirZ);
      this.player.setFacingAngle(facingAngle);

      if (this.isGrounded) {
        sound.playGrassStep(canSprint);
      }
    }

    const currentHorizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);

    // 7. Update player limb & body animations
    this.player.update(deltaTime, {
      isMoving: isMoving && currentHorizSpeed > 0.4,
      isSprinting: canSprint,
      isGrounded: this.isGrounded,
      verticalVelocity: this.playerVelocity.y,
      speed: currentHorizSpeed,
    });

    // 8. Update Animals
    for (let i = this.animals.length - 1; i >= 0; i--) {
      const animal = this.animals[i];
      animal.update(deltaTime);
      if (animal.isDead && animal.group.scale.x <= 0.05) {
        animal.dispose(this.scene);
        this.animals.splice(i, 1);
      }
    }

    // 9. Update Dropped Items (floating & collection)
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const drop = this.droppedItems[i];
      drop.mesh.rotation.y += deltaTime * 2.5;
      const bob = Math.sin((performance.now() - drop.spawnTime) * 0.005) * 0.1;
      drop.mesh.position.y = 0.35 + bob;

      // Collect when player is near
      const dist = this.playerPos.distanceTo(drop.position);
      if (dist <= 1.8) {
        this.addItem(drop.id, drop.count);
        this.scene.remove(drop.mesh);
        this.droppedItems.splice(i, 1);
      }
    }

    // 10. Update Cooking Station
    const cookedResult = this.cooking.update(deltaTime);
    if (cookedResult) {
      this.addItem(cookedResult, 1);
    }

    // 11. Update Game Station
    this.gameStation.update(deltaTime);

    // 12. Update Village
    this.village.update(deltaTime, timeSec);

    // 13. Update Dialogue Timer
    if (this.activeDialogue) {
      this.dialogueTimer -= deltaTime;
      if (this.dialogueTimer <= 0) {
        this.activeDialogue = null;
      }
    }

    // 14. Contextual Interaction Prompt
    if (this.cooking.isNearCampfire(this.playerPos)) {
      const hasRaw = this.hotbar.some((s) => s && s.item.category === 'raw_food');
      if (this.cooking.activeSlot) {
        this.interactionPrompt = `🔥 Roasting ${ITEMS[this.cooking.activeSlot.rawItemId]?.name}... (${Math.round(this.cooking.activeSlot.progress * 100)}%)`;
      } else if (hasRaw) {
        this.interactionPrompt = '🔥 Press [E] or Right-Click to Cook Raw Meat on the Campfire';
      } else {
        this.interactionPrompt = '🔥 Campfire Grill: Hunt animals to get raw meat to cook!';
      }
    } else if (this.gameStation.isNearStation(this.playerPos)) {
      if (this.gameStation.state.isActive) {
        this.interactionPrompt = `🎯 Archery Game Active! Score: ${this.gameStation.state.score} · Time: ${Math.ceil(this.gameStation.state.timeLeft)}s`;
      } else {
        this.interactionPrompt = '🎯 Press [E] to Start Target Archery Challenge (Earn Emeralds!)';
      }
    } else {
      // Check nearest villager
      let nearVillager: string | null = null;
      for (const v of this.village.villagers) {
        if (this.playerPos.distanceTo(v.position) <= 3.2) {
          nearVillager = v.name;
          break;
        }
      }
      if (nearVillager) {
        this.interactionPrompt = `💬 Press [E] to Talk to ${nearVillager}`;
      } else {
        this.interactionPrompt = null;
      }
    }

    // 15. Update Camera
    this.cameraController.update(
      deltaTime,
      this.playerPos,
      inputState.mouseDeltaX,
      inputState.mouseDeltaY,
      inputState.zoomDelta,
      canSprint
    );

    // 16. Update World
    this.world.update(deltaTime, this.playerPos.x, this.playerPos.z);

    // 17. Telemetry callback
    if (this.onTelemetry) {
      this.onTelemetry({
        fps: this.currentFps,
        x: this.playerPos.x,
        y: this.playerPos.y,
        z: this.playerPos.z,
        speed: currentHorizSpeed,
        isGrounded: this.isGrounded,
        isSprinting: canSprint,
        perspective: this.cameraController.perspective,
        isLocked: this.input.getIsLocked(),
        health: this.health,
        maxHealth: this.maxHealth,
        hunger: this.hunger,
        maxHunger: this.maxHunger,
        hotbar: this.hotbar,
        selectedSlot: this.selectedSlot,
        interactionPrompt: this.interactionPrompt,
        activeDialogue: this.activeDialogue,
        cookingProgress: this.cooking.activeSlot
          ? {
              isCooking: true,
              progress: this.cooking.activeSlot.progress,
              rawItem: this.cooking.activeSlot.rawItemId,
              resultItem: this.cooking.activeSlot.resultItemId,
            }
          : null,
        gameStation: {
          isActive: this.gameStation.state.isActive,
          score: this.gameStation.state.score,
          highScore: this.gameStation.state.highScore,
          timeLeft: this.gameStation.state.timeLeft,
          combo: this.gameStation.state.combo,
          emeralds: this.gameStation.state.emeraldsEarned,
        },
      });
    }
  }

  private render() {
    this.renderer.render(this.scene, this.cameraController.camera);
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.input.detach();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
