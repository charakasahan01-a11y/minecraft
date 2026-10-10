/**
 * Minecraft Animal Mobs (Pig, Cow, Sheep)
 * Features blocky 3D models, walking limb animations, grazing idle,
 * wandering AI, combat damage flashing, panic fleeing, and item drops.
 */
import * as THREE from 'three';
import {
  createPigFaceTexture,
  createPigBodyTexture,
  createCowFaceTexture,
  createCowBodyTexture,
  createSheepFaceTexture,
  createSheepWoolTexture,
} from '../textures';
import { sound } from '../sound';

export type AnimalType = 'pig' | 'cow' | 'sheep';

export interface DroppedItem {
  id: string;
  count: number;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  spawnTime: number;
}

export class Animal {
  public group: THREE.Group;
  public type: AnimalType;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public health: number;
  public maxHealth: number;
  public isDead: boolean = false;

  // Visual parts
  private bodyMesh!: THREE.Mesh;
  private headPivot!: THREE.Group;
  private legs: THREE.Group[] = [];
  private materials: THREE.MeshStandardMaterial[] = [];

  // AI & Animation
  private wanderTimer: number = 0;
  private moveSpeed: number = 0;
  private targetAngle: number = 0;
  private currentAngle: number = 0;
  private walkCycle: number = 0;
  private isPanicking: boolean = false;
  private panicTimer: number = 0;
  private damageFlashTimer: number = 0;
  private deathTimer: number = 0;

  constructor(type: AnimalType, initialPos: THREE.Vector3) {
    this.type = type;
    this.position = initialPos.clone();
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Initial angle
    this.targetAngle = Math.random() * Math.PI * 2;
    this.currentAngle = this.targetAngle;

    if (type === 'pig') {
      this.maxHealth = 6;
      this.buildPig();
    } else if (type === 'cow') {
      this.maxHealth = 10;
      this.buildCow();
    } else {
      this.maxHealth = 8;
      this.buildSheep();
    }
    this.health = this.maxHealth;
  }

  private registerMat(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
    this.materials.push(mat);
    return mat;
  }

  private buildPig() {
    const faceTex = createPigFaceTexture();
    const bodyTex = createPigBodyTexture();

    const bodyMat = this.registerMat(
      new THREE.MeshStandardMaterial({ map: bodyTex, roughness: 0.85 })
    );
    const faceMat = this.registerMat(
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.85 })
    );

    // Pig Body (0.7 wide, 0.48 high, 0.9 long)
    const bodyGeo = new THREE.BoxGeometry(0.65, 0.48, 0.9);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.55;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Pig Head (front face with snout)
    const headMaterials = [
      bodyMat, bodyMat, bodyMat, bodyMat,
      faceMat, // +Z
      bodyMat,
    ];
    const headGeo = new THREE.BoxGeometry(0.44, 0.44, 0.44);
    const headMesh = new THREE.Mesh(headGeo, headMaterials);
    headMesh.position.set(0, 0, 0.18);
    headMesh.castShadow = true;

    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 0.68, 0.45);
    this.headPivot.add(headMesh);
    this.group.add(this.headPivot);

    // 4 short legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.38, 0.18);
    const legOffsets = [
      [-0.22, 0.4, 0.28],
      [0.22, 0.4, 0.28],
      [-0.22, 0.4, -0.28],
      [0.22, 0.4, -0.28],
    ];

    legOffsets.forEach(([lx, ly, lz]) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, ly, lz);
      const legMesh = new THREE.Mesh(legGeo, bodyMat);
      legMesh.position.set(0, -0.19, 0);
      legMesh.castShadow = true;
      legPivot.add(legMesh);
      this.legs.push(legPivot);
      this.group.add(legPivot);
    });
  }

  private buildCow() {
    const faceTex = createCowFaceTexture();
    const bodyTex = createCowBodyTexture();

    const bodyMat = this.registerMat(
      new THREE.MeshStandardMaterial({ map: bodyTex, roughness: 0.85 })
    );
    const faceMat = this.registerMat(
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.85 })
    );

    // Body (0.75 wide, 0.65 high, 1.1 long)
    const bodyGeo = new THREE.BoxGeometry(0.75, 0.65, 1.1);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.85;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Udder
    const udderMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: 0xdf8290, roughness: 0.8 })
    );
    const udderGeo = new THREE.BoxGeometry(0.3, 0.12, 0.3);
    const udderMesh = new THREE.Mesh(udderGeo, udderMat);
    udderMesh.position.set(0, 0.5, -0.15);
    this.group.add(udderMesh);

    // Head
    const headMaterials = [
      bodyMat, bodyMat, bodyMat, bodyMat,
      faceMat,
      bodyMat,
    ];
    const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const headMesh = new THREE.Mesh(headGeo, headMaterials);
    headMesh.position.set(0, 0, 0.18);
    headMesh.castShadow = true;

    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 1.05, 0.55);
    this.headPivot.add(headMesh);
    this.group.add(this.headPivot);

    // 4 legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2);
    const legOffsets = [
      [-0.26, 0.55, 0.38],
      [0.26, 0.55, 0.38],
      [-0.26, 0.55, -0.38],
      [0.26, 0.55, -0.38],
    ];

    legOffsets.forEach(([lx, ly, lz]) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, ly, lz);
      const legMesh = new THREE.Mesh(legGeo, bodyMat);
      legMesh.position.set(0, -0.27, 0);
      legMesh.castShadow = true;
      legPivot.add(legMesh);
      this.legs.push(legPivot);
      this.group.add(legPivot);
    });
  }

  private buildSheep() {
    const faceTex = createSheepFaceTexture();
    const woolTex = createSheepWoolTexture();

    const woolMat = this.registerMat(
      new THREE.MeshStandardMaterial({ map: woolTex, roughness: 0.95 })
    );
    const faceMat = this.registerMat(
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.85 })
    );
    const skinMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: 0xdbc1b0, roughness: 0.85 })
    );

    // Fluffy Wool Body
    const bodyGeo = new THREE.BoxGeometry(0.82, 0.65, 1.05);
    this.bodyMesh = new THREE.Mesh(bodyGeo, woolMat);
    this.bodyMesh.position.y = 0.8;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Head
    const headMaterials = [
      skinMat, skinMat, woolMat, skinMat,
      faceMat,
      woolMat,
    ];
    const headGeo = new THREE.BoxGeometry(0.44, 0.44, 0.46);
    const headMesh = new THREE.Mesh(headGeo, headMaterials);
    headMesh.position.set(0, 0, 0.18);
    headMesh.castShadow = true;

    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 0.95, 0.52);
    this.headPivot.add(headMesh);
    this.group.add(this.headPivot);

    // 4 legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.52, 0.18);
    const legOffsets = [
      [-0.25, 0.52, 0.35],
      [0.25, 0.52, 0.35],
      [-0.25, 0.52, -0.35],
      [0.25, 0.52, -0.35],
    ];

    legOffsets.forEach(([lx, ly, lz]) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, ly, lz);
      const legMesh = new THREE.Mesh(legGeo, skinMat);
      legMesh.position.set(0, -0.26, 0);
      legMesh.castShadow = true;
      legPivot.add(legMesh);
      this.legs.push(legPivot);
      this.group.add(legPivot);
    });
  }

  /**
   * Apply damage and knockback from player attack
   */
  public takeDamage(damage: number, attackerPos: THREE.Vector3): { isKilled: boolean; dropItem?: string } {
    if (this.isDead) return { isKilled: false };

    this.health -= damage;
    this.damageFlashTimer = 0.25; // 250ms red flash
    sound.playHit();
    sound.playAnimalSound(this.type);

    // Knockback
    const knockDir = new THREE.Vector3()
      .subVectors(this.position, attackerPos)
      .setY(0)
      .normalize();

    this.velocity.add(knockDir.multiplyScalar(6.5));
    this.velocity.y = 3.2; // slight pop in air

    // Start panic fleeing
    this.isPanicking = true;
    this.panicTimer = 3.5;
    this.targetAngle = Math.atan2(knockDir.x, knockDir.z);

    if (this.health <= 0) {
      this.isDead = true;
      this.deathTimer = 0.6;
      let dropItem = 'raw_porkchop';
      if (this.type === 'cow') dropItem = 'raw_beef';
      if (this.type === 'sheep') dropItem = 'raw_mutton';
      return { isKilled: true, dropItem };
    }

    return { isKilled: false };
  }

  public update(deltaTime: number) {
    if (this.isDead) {
      // Death tumble animation
      this.deathTimer -= deltaTime;
      this.group.rotation.z += deltaTime * 5;
      this.group.scale.subScalar(deltaTime * 1.5);
      return;
    }

    // Damage red flash
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= deltaTime;
      const flash = this.damageFlashTimer > 0;
      this.materials.forEach((m) => {
        m.color.setHex(flash ? 0xff4444 : 0xffffff);
      });
    }

    // AI Wandering & Panic
    if (this.isPanicking) {
      this.panicTimer -= deltaTime;
      this.moveSpeed = 4.2; // fast run
      if (this.panicTimer <= 0) {
        this.isPanicking = false;
      }
    } else {
      this.wanderTimer -= deltaTime;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2.5 + Math.random() * 4.5;
        // 60% chance to move, 40% chance to stand & graze
        if (Math.random() > 0.4) {
          this.targetAngle = Math.random() * Math.PI * 2;
          this.moveSpeed = 1.3 + Math.random() * 0.7;
        } else {
          this.moveSpeed = 0;
        }
      }
    }

    // Smooth rotation towards target angle
    let diff = this.targetAngle - this.currentAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentAngle += diff * Math.min(1, deltaTime * (this.isPanicking ? 8 : 4));
    this.group.rotation.y = this.currentAngle;

    // Movement velocity
    const forwardX = Math.sin(this.currentAngle);
    const forwardZ = Math.cos(this.currentAngle);

    if (this.moveSpeed > 0) {
      this.position.x += forwardX * this.moveSpeed * deltaTime;
      this.position.z += forwardZ * this.moveSpeed * deltaTime;
      this.walkCycle += deltaTime * (this.isPanicking ? 14 : 7);
    } else {
      this.walkCycle = 0;
    }

    // Apply knockback velocity damping & gravity
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    this.velocity.x *= Math.max(0, 1 - deltaTime * 8);
    this.velocity.z *= Math.max(0, 1 - deltaTime * 8);

    if (this.position.y > 0) {
      this.velocity.y -= 20 * deltaTime;
    } else {
      this.position.y = 0;
      this.velocity.y = 0;
    }

    this.group.position.copy(this.position);

    // Leg swinging animation
    const swing = Math.sin(this.walkCycle) * (this.isPanicking ? 0.7 : 0.45);
    if (this.legs.length >= 4) {
      this.legs[0].rotation.x = swing; // front-left
      this.legs[1].rotation.x = -swing; // front-right
      this.legs[2].rotation.x = -swing; // back-left
      this.legs[3].rotation.x = swing; // back-right
    }

    // Head grazing or looking
    if (this.moveSpeed === 0 && !this.isPanicking) {
      // Nibble grass
      const graze = Math.sin(this.wanderTimer * 2) * 0.25;
      this.headPivot.rotation.x = graze > 0 ? graze : 0;
    } else {
      this.headPivot.rotation.x = 0;
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.group);
  }
}
