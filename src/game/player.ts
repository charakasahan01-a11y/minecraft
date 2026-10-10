/**
 * Minecraft-style Character Model and Animation Controller
 * Accurate proportions, hierarchical pivots (shoulders, hips, neck),
 * authentic pixel-art textures, shadows, held items, and attack swing animations.
 */
import * as THREE from 'three';
import {
  createHeadFrontTexture,
  createHeadSideTexture,
  createHeadBackTexture,
  createHeadTopTexture,
  createTorsoFrontTexture,
  createTorsoBackTexture,
  createArmTexture,
  createLegTexture,
} from './textures';

export interface PlayerAnimationState {
  isMoving: boolean;
  isSprinting: boolean;
  isGrounded: boolean;
  verticalVelocity: number;
  speed: number;
}

export class MinecraftPlayer {
  public group: THREE.Group;
  public headPivot: THREE.Group;
  public bodyGroup: THREE.Group;
  public leftArmPivot: THREE.Group;
  public rightArmPivot: THREE.Group;
  public leftLegPivot: THREE.Group;
  public rightLegPivot: THREE.Group;

  // Meshes
  public headMesh: THREE.Mesh;
  public torsoMesh: THREE.Mesh;
  public leftArmMesh: THREE.Mesh;
  public rightArmMesh: THREE.Mesh;
  public leftLegMesh: THREE.Mesh;
  public rightLegMesh: THREE.Mesh;

  // Held item container
  public heldItemGroup: THREE.Group;
  private currentHeldType: string = 'wooden_sword';

  // Animation variables
  private walkTime: number = 0;
  private currentMoveAngle: number = 0;
  private targetMoveAngle: number = 0;
  private attackSwingTimer: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'MinecraftPlayer';

    const headFrontTex = createHeadFrontTexture();
    const headSideTex = createHeadSideTexture();
    const headBackTex = createHeadBackTexture();
    const headTopTex = createHeadTopTexture();

    const torsoFrontTex = createTorsoFrontTexture();
    const torsoBackTex = createTorsoBackTexture();
    const armTex = createArmTexture();
    const legTex = createLegTexture();

    const skinColorMat = new THREE.MeshStandardMaterial({
      color: 0xd99f7d,
      roughness: 0.9,
      metalness: 0.05,
    });

    const createMat = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.85,
        metalness: 0.05,
      });

    // 1. Head
    const headMaterials = [
      createMat(headSideTex),
      createMat(headSideTex),
      createMat(headTopTex),
      skinColorMat,
      createMat(headFrontTex),
      createMat(headBackTex),
    ];
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.headMesh = new THREE.Mesh(headGeo, headMaterials);
    this.headMesh.castShadow = true;
    this.headMesh.receiveShadow = true;
    this.headMesh.position.set(0, 0.25, 0);

    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 1.35, 0);
    this.headPivot.add(this.headMesh);

    // 2. Torso
    const torsoMaterials = [
      createMat(torsoBackTex),
      createMat(torsoBackTex),
      createMat(torsoBackTex),
      createMat(torsoBackTex),
      createMat(torsoFrontTex),
      createMat(torsoBackTex),
    ];
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.25);
    this.torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterials);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.torsoMesh.position.set(0, 0.325, 0);

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0.7, 0);
    this.bodyGroup.add(this.torsoMesh);

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.22, 0.65, 0.22);
    const armMat = createMat(armTex);

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.36, 1.3, 0);
    this.leftArmMesh = new THREE.Mesh(armGeo, armMat);
    this.leftArmMesh.castShadow = true;
    this.leftArmMesh.receiveShadow = true;
    this.leftArmMesh.position.set(0, -0.325, 0);
    this.leftArmPivot.add(this.leftArmMesh);

    // Right Arm Pivot
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.36, 1.3, 0);
    this.rightArmMesh = new THREE.Mesh(armGeo, armMat);
    this.rightArmMesh.castShadow = true;
    this.rightArmMesh.receiveShadow = true;
    this.rightArmMesh.position.set(0, -0.325, 0);
    this.rightArmPivot.add(this.rightArmMesh);

    // Held item container attached to right hand
    this.heldItemGroup = new THREE.Group();
    this.heldItemGroup.position.set(0, -0.65, 0.15); // bottom of right arm
    this.rightArmPivot.add(this.heldItemGroup);
    this.setHeldItem('wooden_sword');

    // 4. Legs
    const legGeo = new THREE.BoxGeometry(0.23, 0.7, 0.23);
    const legMat = createMat(legTex);

    // Left Leg Pivot
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.125, 0.7, 0);
    this.leftLegMesh = new THREE.Mesh(legGeo, legMat);
    this.leftLegMesh.castShadow = true;
    this.leftLegMesh.receiveShadow = true;
    this.leftLegMesh.position.set(0, -0.35, 0);
    this.leftLegPivot.add(this.leftLegMesh);

    // Right Leg Pivot
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.125, 0.7, 0);
    this.rightLegMesh = new THREE.Mesh(legGeo, legMat);
    this.rightLegMesh.castShadow = true;
    this.rightLegMesh.receiveShadow = true;
    this.rightLegMesh.position.set(0, -0.35, 0);
    this.rightLegPivot.add(this.rightLegMesh);

    // Assemble character hierarchy
    this.group.add(this.bodyGroup);
    this.group.add(this.headPivot);
    this.group.add(this.leftArmPivot);
    this.group.add(this.rightArmPivot);
    this.group.add(this.leftLegPivot);
    this.group.add(this.rightLegPivot);
  }

  /**
   * Update the 3D model of the item held in the right hand
   */
  public setHeldItem(itemId: string | null) {
    this.currentHeldType = itemId || '';
    // Clear previous held item
    while (this.heldItemGroup.children.length > 0) {
      this.heldItemGroup.remove(this.heldItemGroup.children[0]);
    }

    if (!itemId) return;

    if (itemId === 'wooden_sword') {
      const sword = new THREE.Group();
      // Handle
      const hiltMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), hiltMat);
      hilt.position.y = 0.05;
      sword.add(hilt);
      // Guard
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.08), hiltMat);
      guard.position.y = 0.16;
      sword.add(guard);
      // Blade
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xb8905b, roughness: 0.7 });
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.04), bladeMat);
      blade.position.y = 0.44;
      sword.add(blade);

      sword.rotation.x = Math.PI / 2.5;
      sword.rotation.z = -Math.PI / 12;
      this.heldItemGroup.add(sword);
    } else if (itemId === 'bow') {
      const bow = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
      const bowBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.06), woodMat);
      bow.add(bowBar);
      const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const bowString = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.62, 0.02), stringMat);
      bowString.position.z = -0.06;
      bow.add(bowString);
      bow.rotation.x = Math.PI / 3;
      this.heldItemGroup.add(bow);
    } else if (itemId.includes('porkchop') || itemId.includes('beef') || itemId.includes('mutton') || itemId === 'apple') {
      // Meat / food item block
      const isCooked = itemId.startsWith('cooked');
      const isApple = itemId === 'apple';
      const foodColor = isApple ? 0xd32f2f : isCooked ? 0x8d5b4c : 0xf48fb1;
      const foodMat = new THREE.MeshStandardMaterial({ color: foodColor, roughness: 0.8 });
      const food = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), foodMat);
      food.position.set(0, 0.05, 0);
      this.heldItemGroup.add(food);
    } else if (itemId === 'emerald') {
      const gemMat = new THREE.MeshStandardMaterial({ color: 0x00e676, roughness: 0.3, metalness: 0.2 });
      const gem = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.12), gemMat);
      this.heldItemGroup.add(gem);
    } else if (itemId === 'wood_planks') {
      const blockMat = new THREE.MeshStandardMaterial({ color: 0xa8844f, roughness: 0.8 });
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), blockMat);
      this.heldItemGroup.add(block);
    }
  }

  /**
   * Triggers a combat attack swing / punch
   */
  public triggerAttack() {
    this.attackSwingTimer = 0.25; // 250ms swing
  }

  public setFacingAngle(angle: number) {
    this.targetMoveAngle = angle;
  }

  public update(deltaTime: number, state: PlayerAnimationState) {
    // 1. Smoothly interpolate facing rotation
    if (state.isMoving) {
      let diff = this.targetMoveAngle - this.currentMoveAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.currentMoveAngle += diff * Math.min(1, deltaTime * 14);
    }
    this.group.rotation.y = this.currentMoveAngle;

    // 2. Animate limbs and body
    const walkSpeedMultiplier = state.isSprinting ? 14 : 9.5;

    if (state.isMoving && state.isGrounded) {
      this.walkTime += deltaTime * walkSpeedMultiplier;
    } else if (!state.isGrounded) {
      this.walkTime += deltaTime * 2;
    } else {
      this.walkTime += deltaTime * 1.5;
    }

    const sin = Math.sin(this.walkTime);

    let targetLeftLegX = 0;
    let targetRightLegX = 0;
    let targetLeftArmX = 0;
    let targetRightArmX = 0;
    let targetTorsoTilt = 0;
    let targetTorsoBob = 0;
    let targetHeadBob = 0;

    if (!state.isGrounded) {
      targetLeftLegX = 0.35;
      targetRightLegX = -0.35;
      targetLeftArmX = -0.7;
      targetRightArmX = -0.7;
      targetTorsoTilt = 0.08;
    } else if (state.isMoving) {
      const amplitude = state.isSprinting ? 0.8 : 0.55;
      targetLeftLegX = sin * amplitude;
      targetRightLegX = -sin * amplitude;
      targetLeftArmX = -sin * amplitude;
      targetRightArmX = sin * amplitude;

      targetTorsoBob = Math.abs(sin) * (state.isSprinting ? 0.045 : 0.025);
      targetHeadBob = targetTorsoBob;
      targetTorsoTilt = state.isSprinting ? 0.16 : 0.05;
    } else {
      const breath = Math.sin(this.walkTime * 0.8);
      targetTorsoBob = breath * 0.012;
      targetHeadBob = breath * 0.015;
      targetLeftArmX = breath * 0.04;
      targetRightArmX = -breath * 0.04;
    }

    // Attack swing overrides right arm forward
    if (this.attackSwingTimer > 0) {
      this.attackSwingTimer -= deltaTime;
      const swingT = (0.25 - this.attackSwingTimer) / 0.25; // 0 -> 1
      const swingAngle = -Math.sin(swingT * Math.PI) * 1.4;
      targetRightArmX = swingAngle;
    }

    const lerpFactor = Math.min(1, deltaTime * 16);

    this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, targetLeftLegX, lerpFactor);
    this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, targetRightLegX, lerpFactor);
    this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, targetLeftArmX, lerpFactor);
    this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, targetRightArmX, lerpFactor);

    const armZFlare = state.isSprinting ? 0.12 : 0.05;
    this.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.leftArmPivot.rotation.z, -armZFlare, lerpFactor);
    this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, armZFlare, lerpFactor);

    this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, targetTorsoTilt, lerpFactor);
    this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, 0.7 + targetTorsoBob, lerpFactor);
    this.headPivot.position.y = THREE.MathUtils.lerp(this.headPivot.position.y, 1.35 + targetHeadBob, lerpFactor);
  }
}
