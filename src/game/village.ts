/**
 * Minecraft Village Architecture & Game Station
 * Generates an authentic blocky village ahead of spawn:
 * - Cobblestone and oak houses with pitched roofs and glass windows
 * - Village central well with water
 * - Fenced golden wheat farms
 * - Interactive Campfire Cooking Station with smoke & flame
 * - Interactive Game Station with archery / shooting bullseye targets
 * - Walking friendly villagers with speech dialogues
 */
import * as THREE from 'three';
import {
  createCobblestoneTexture,
  createOakPlanksTexture,
  createOakLogTexture,
  createGlassTexture,
  createCampfireTexture,
  createWheatTexture,
  createTargetTexture,
  createVillagerFaceTexture,
  createVillagerRobeTexture,
} from './textures';
import { sound } from './sound';

export interface GameTarget {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  points: number;
  hitTimer: number;
  baseY: number;
  isMoving: boolean;
  moveSpeed: number;
  moveRange: number;
  initialX: number;
}

export interface VillagerEntity {
  group: THREE.Group;
  position: THREE.Vector3;
  name: string;
  dialogue: string;
  targetAngle: number;
  currentAngle: number;
  moveTimer: number;
  moveSpeed: number;
}

export class MinecraftVillage {
  public group: THREE.Group;
  public campfirePos: THREE.Vector3 = new THREE.Vector3(0, 0, -45);
  public gameStationPos: THREE.Vector3 = new THREE.Vector3(16, 0, -48);
  public targets: GameTarget[] = [];
  public villagers: VillagerEntity[] = [];

  // Particle systems
  private campfireParticles!: THREE.Points;
  private particlePositions!: Float32Array;
  private particleVelocities!: Float32Array;
  private particleCount = 45;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'MinecraftVillage';

    // Materials
    const cobbleTex = createCobblestoneTexture();
    cobbleTex.wrapS = THREE.RepeatWrapping;
    cobbleTex.wrapT = THREE.RepeatWrapping;

    const woodTex = createOakPlanksTexture();
    woodTex.wrapS = THREE.RepeatWrapping;
    woodTex.wrapT = THREE.RepeatWrapping;

    const logTex = createOakLogTexture();
    const glassTex = createGlassTexture();

    const cobbleMat = new THREE.MeshStandardMaterial({ map: cobbleTex, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
    const logMat = new THREE.MeshStandardMaterial({ map: logTex, roughness: 0.85 });
    const glassMat = new THREE.MeshStandardMaterial({
      map: glassTex,
      transparent: true,
      opacity: 0.75,
      roughness: 0.3,
    });

    // 1. Village Path (Gravel/dirt roadway connecting spawn to village)
    this.createPathways();

    // 2. Central Well (at x = 0, z = -35)
    this.createVillageWell(cobbleMat, woodMat, logMat);

    // 3. House 1: Blacksmith / Main Cottage (x = -15, z = -45)
    this.createHouse(-15, -45, 7, 5, 8, cobbleMat, woodMat, logMat, glassMat, 'Oak House');

    // 4. House 2: Library / Longhouse (x = -16, z = -25)
    this.createHouse(-16, -25, 6, 6, 9, cobbleMat, woodMat, logMat, glassMat, 'Town Library');

    // 5. House 3: Villager Hut (x = 18, z = -28)
    this.createHouse(18, -28, 6, 4.5, 6, cobbleMat, woodMat, logMat, glassMat, 'Cozy Hut');

    // 6. Wheat Farm Field (x = -8, z = -60)
    this.createWheatFarm(-8, -60, woodMat, logMat);

    // 7. Campfire Cooking Station (x = 0, z = -48)
    this.createCampfireCookingStation(cobbleMat, woodMat, logMat);

    // 8. Game Station & Archery Range (x = 18, z = -50)
    this.createGameStation(woodMat, logMat);

    // 9. Friendly Villagers
    this.spawnVillagers();

    scene.add(this.group);
  }

  private createPathways() {
    // Dirt / gravel road
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x937854,
      roughness: 0.95,
    });
    // Main north-south road
    const mainPathGeo = new THREE.PlaneGeometry(3.6, 65);
    const mainPath = new THREE.Mesh(mainPathGeo, pathMat);
    mainPath.rotation.x = -Math.PI / 2;
    mainPath.position.set(0, 0.015, -42);
    mainPath.receiveShadow = true;
    this.group.add(mainPath);

    // Cross east-west road
    const crossPathGeo = new THREE.PlaneGeometry(45, 3.2);
    const crossPath = new THREE.Mesh(crossPathGeo, pathMat);
    crossPath.rotation.x = -Math.PI / 2;
    crossPath.position.set(0, 0.018, -35);
    crossPath.receiveShadow = true;
    this.group.add(crossPath);

    // Side road to Game Station
    const gamePathGeo = new THREE.PlaneGeometry(20, 2.8);
    const gamePath = new THREE.Mesh(gamePathGeo, pathMat);
    gamePath.rotation.x = -Math.PI / 2;
    gamePath.position.set(10, 0.018, -48);
    gamePath.receiveShadow = true;
    this.group.add(gamePath);
  }

  private createVillageWell(
    cobbleMat: THREE.Material,
    woodMat: THREE.Material,
    logMat: THREE.Material
  ) {
    const well = new THREE.Group();
    well.position.set(0, 0, -35);

    // Stone perimeter rim (3.4 x 3.4)
    const rimGeo = new THREE.BoxGeometry(3.6, 0.8, 3.6);
    const rim = new THREE.Mesh(rimGeo, cobbleMat);
    rim.position.y = 0.4;
    rim.castShadow = true;
    rim.receiveShadow = true;
    well.add(rim);

    // Water plane inside
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2979ff,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const waterGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.65;
    well.add(water);

    // 4 Corner Wooden Pillars
    const pillarGeo = new THREE.BoxGeometry(0.35, 2.6, 0.35);
    const pillarOffsets = [
      [-1.4, 1.7, -1.4],
      [1.4, 1.7, -1.4],
      [-1.4, 1.7, 1.4],
      [1.4, 1.7, 1.4],
    ];
    pillarOffsets.forEach(([px, py, pz]) => {
      const p = new THREE.Mesh(pillarGeo, logMat);
      p.position.set(px, py, pz);
      p.castShadow = true;
      well.add(p);
    });

    // Well Roof
    const roofGeo = new THREE.BoxGeometry(3.8, 0.4, 3.8);
    const roof = new THREE.Mesh(roofGeo, woodMat);
    roof.position.y = 3.1;
    roof.castShadow = true;
    well.add(roof);

    this.group.add(well);
  }

  private createHouse(
    x: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    cobbleMat: THREE.Material,
    woodMat: THREE.Material,
    logMat: THREE.Material,
    glassMat: THREE.Material,
    _title: string
  ) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);

    // 1. Cobblestone Foundation
    const foundGeo = new THREE.BoxGeometry(width, 1.0, depth);
    const foundation = new THREE.Mesh(foundGeo, cobbleMat);
    foundation.position.y = 0.5;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    house.add(foundation);

    // 2. Oak Planks Main Walls
    const wallGeo = new THREE.BoxGeometry(width - 0.2, height - 1.0, depth - 0.2);
    const walls = new THREE.Mesh(wallGeo, woodMat);
    walls.position.y = 0.5 + height / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // 3. Oak Log Corner Pillars
    const cornerGeo = new THREE.BoxGeometry(0.8, height + 0.2, 0.8);
    const cx = width / 2 - 0.1;
    const cz = depth / 2 - 0.1;
    const corners = [
      [-cx, -cz],
      [cx, -cz],
      [-cx, cz],
      [cx, cz],
    ];
    corners.forEach(([corX, corZ]) => {
      const c = new THREE.Mesh(cornerGeo, logMat);
      c.position.set(corX, (height + 0.2) / 2, corZ);
      c.castShadow = true;
      house.add(c);
    });

    // 4. Overhanging Pitched Roof
    const roofBaseGeo = new THREE.BoxGeometry(width + 1.2, 0.5, depth + 1.2);
    const roofBase = new THREE.Mesh(roofBaseGeo, cobbleMat);
    roofBase.position.y = height + 0.2;
    roofBase.castShadow = true;
    house.add(roofBase);

    const roofMidGeo = new THREE.BoxGeometry(width + 0.4, 0.6, depth + 0.4);
    const roofMid = new THREE.Mesh(roofMidGeo, woodMat);
    roofMid.position.y = height + 0.7;
    roofMid.castShadow = true;
    house.add(roofMid);

    const roofTopGeo = new THREE.BoxGeometry(width - 1.2, 0.6, depth - 1.2);
    const roofTop = new THREE.Mesh(roofTopGeo, woodMat);
    roofTop.position.y = height + 1.25;
    roofTop.castShadow = true;
    house.add(roofTop);

    // 5. Windows
    const winGeo = new THREE.BoxGeometry(1.4, 1.2, 0.3);
    const win1 = new THREE.Mesh(winGeo, glassMat);
    win1.position.set(0, 2.2, depth / 2 + 0.05);
    house.add(win1);

    // Doorway opening frame
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x3e2413 });
    const doorGeo = new THREE.BoxGeometry(1.2, 2.0, 0.15);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.5, -depth / 2 - 0.05);
    door.castShadow = true;
    house.add(door);

    this.group.add(house);
  }

  private createWheatFarm(x: number, z: number, woodMat: THREE.Material, _logMat: THREE.Material) {
    const farm = new THREE.Group();
    farm.position.set(x, 0, z);

    // Farmland soil bed
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x4a321a, // rich moist farmland
      roughness: 0.95,
    });
    const bedGeo = new THREE.BoxGeometry(12, 0.3, 8);
    const bed = new THREE.Mesh(bedGeo, soilMat);
    bed.position.y = 0.15;
    bed.receiveShadow = true;
    farm.add(bed);

    // Water canal in center
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e88e5,
      transparent: true,
      opacity: 0.8,
    });
    const waterCanal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 7.6), waterMat);
    waterCanal.position.set(0, 0.16, 0);
    farm.add(waterCanal);

    // Wheat crop rows
    const wheatTex = createWheatTexture();
    const wheatMat = new THREE.MeshStandardMaterial({
      map: wheatTex,
      transparent: true,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    const cropGeo = new THREE.PlaneGeometry(0.8, 0.9);
    for (let rz = -3; rz <= 3; rz += 1.2) {
      for (const rx of [-4.5, -3.2, -1.8, 1.8, 3.2, 4.5]) {
        const crop = new THREE.Mesh(cropGeo, wheatMat);
        crop.position.set(rx, 0.65, rz);
        crop.castShadow = true;
        farm.add(crop);

        const cropCross = new THREE.Mesh(cropGeo, wheatMat);
        cropCross.rotation.y = Math.PI / 2;
        cropCross.position.set(rx, 0.65, rz);
        farm.add(cropCross);
      }
    }

    // Fences around perimeter
    const fenceMat = woodMat;
    const postGeo = new THREE.BoxGeometry(0.18, 1.1, 0.18);
    for (let fx = -6; fx <= 6; fx += 2) {
      const p1 = new THREE.Mesh(postGeo, fenceMat);
      p1.position.set(fx, 0.55, -4);
      farm.add(p1);

      const p2 = new THREE.Mesh(postGeo, fenceMat);
      p2.position.set(fx, 0.55, 4);
      farm.add(p2);
    }

    this.group.add(farm);
  }

  private createCampfireCookingStation(
    cobbleMat: THREE.Material,
    woodMat: THREE.Material,
    _logMat: THREE.Material
  ) {
    const station = new THREE.Group();
    station.position.copy(this.campfirePos);

    // Stone hearth ring
    const ringGeo = new THREE.BoxGeometry(3.2, 0.4, 3.2);
    const ring = new THREE.Mesh(ringGeo, cobbleMat);
    ring.position.y = 0.2;
    ring.castShadow = true;
    station.add(ring);

    // Campfire coals & crossed logs
    const fireTex = createCampfireTexture();
    const fireMat = new THREE.MeshStandardMaterial({
      map: fireTex,
      roughness: 0.8,
      emissive: 0xff4500,
      emissiveIntensity: 0.8,
    });
    const log1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 2.2), fireMat);
    log1.position.y = 0.45;
    log1.rotation.y = Math.PI / 4;
    station.add(log1);

    const log2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 2.2), fireMat);
    log2.position.y = 0.45;
    log2.rotation.y = -Math.PI / 4;
    station.add(log2);

    // Iron cooking spit / grill rack above fire
    const spitMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const spitMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.2), spitMat);
    spitMesh.position.y = 1.05;
    spitMesh.castShadow = true;
    station.add(spitMesh);

    // Spit legs
    const legGeo = new THREE.BoxGeometry(0.08, 1.1, 0.08);
    const leg1 = new THREE.Mesh(legGeo, spitMat);
    leg1.position.set(-0.8, 0.55, 0);
    station.add(leg1);
    const leg2 = new THREE.Mesh(legGeo, spitMat);
    leg2.position.set(0.8, 0.55, 0);
    station.add(leg2);

    // Warm fire light glow
    const fireLight = new THREE.PointLight(0xff7700, 2.2, 14);
    fireLight.position.set(0, 1.2, 0);
    station.add(fireLight);

    // Campfire Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.7), woodMat);
    bench.position.set(0, 0.22, 2.2);
    bench.castShadow = true;
    station.add(bench);

    // Particle system for Fire Sparkles and Smoke
    const pGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleVelocities = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      this.particlePositions[i * 3] = (Math.random() - 0.5) * 1.0;
      this.particlePositions[i * 3 + 1] = 0.4 + Math.random() * 2.5;
      this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;

      this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
      this.particleVelocities[i * 3 + 1] = 0.8 + Math.random() * 0.8;
      this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.18,
      transparent: true,
      opacity: 0.8,
    });

    this.campfireParticles = new THREE.Points(pGeo, pMat);
    station.add(this.campfireParticles);

    this.group.add(station);
  }

  private createGameStation(woodMat: THREE.Material, logMat: THREE.Material) {
    const station = new THREE.Group();
    station.position.copy(this.gameStationPos);

    // 1. Arcade Booth Platform
    const boothFloor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 6), woodMat);
    boothFloor.position.y = 0.2;
    boothFloor.receiveShadow = true;
    station.add(boothFloor);

    // 2. Canopy Pillars
    const pillarGeo = new THREE.BoxGeometry(0.35, 3.2, 0.35);
    const corners = [
      [-4.6, 2.6],
      [4.6, 2.6],
      [-4.6, -2.6],
      [4.6, -2.6],
    ];
    corners.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, logMat);
      p.position.set(px, 1.8, pz);
      p.castShadow = true;
      station.add(p);
    });

    // 3. Striped Festive Awning Roof (Red & White wool canopy)
    const roofRed = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.8 });
    const roofWhite = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });

    for (let i = -4.5; i <= 4.5; i += 1.5) {
      const mat = Math.round(i) % 2 === 0 ? roofRed : roofWhite;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 6.2), mat);
      stripe.position.set(i, 3.5, 0);
      stripe.castShadow = true;
      station.add(stripe);
    }

    // 4. Counter Desk
    const counter = new THREE.Mesh(new THREE.BoxGeometry(8, 1.0, 1.2), woodMat);
    counter.position.set(0, 0.7, 1.8);
    counter.castShadow = true;
    station.add(counter);

    // 5. Shooting Targets (Array of Bullseye Targets ahead on archery stands)
    const targetTex = createTargetTexture();
    const targetMat = new THREE.MeshStandardMaterial({
      map: targetTex,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });

    const targetConfigs = [
      { id: 'target_center', x: 0, y: 1.8, z: -8, points: 100, isMoving: false },
      { id: 'target_left', x: -4, y: 2.2, z: -11, points: 150, isMoving: true, speed: 1.8, range: 2.5 },
      { id: 'target_right', x: 4, y: 2.0, z: -12, points: 150, isMoving: true, speed: 2.2, range: 2.8 },
      { id: 'target_far', x: 0, y: 3.2, z: -16, points: 300, isMoving: true, speed: 3.0, range: 4.0 },
    ];

    targetConfigs.forEach((cfg) => {
      const targetGroup = new THREE.Group();
      targetGroup.position.set(
        station.position.x + cfg.x,
        cfg.y,
        station.position.z + cfg.z
      );

      // Hay Bale / Wood Stand Base
      const standMat = new THREE.MeshStandardMaterial({ color: 0xa8844f });
      const standPole = new THREE.Mesh(new THREE.BoxGeometry(0.18, cfg.y, 0.18), standMat);
      standPole.position.y = -cfg.y / 2;
      standPole.castShadow = true;
      targetGroup.add(standPole);

      // Round / Box Target board
      const boardGeo = new THREE.BoxGeometry(1.4, 1.4, 0.15);
      const boardMesh = new THREE.Mesh(boardGeo, targetMat);
      boardMesh.castShadow = true;
      boardMesh.receiveShadow = true;
      targetGroup.add(boardMesh);

      this.group.add(targetGroup);

      this.targets.push({
        id: cfg.id,
        mesh: targetGroup,
        position: targetGroup.position,
        points: cfg.points,
        hitTimer: 0,
        baseY: cfg.y,
        isMoving: cfg.isMoving,
        moveSpeed: cfg.speed || 1.5,
        moveRange: cfg.range || 2,
        initialX: targetGroup.position.x,
      });
    });

    this.group.add(station);
  }

  private spawnVillagers() {
    const faceTex = createVillagerFaceTexture();
    const robeTex = createVillagerRobeTexture();

    const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.85 });
    const robeMat = new THREE.MeshStandardMaterial({ map: robeTex, roughness: 0.85 });

    const villagerConfigs = [
      {
        name: 'Farmer Bob',
        pos: new THREE.Vector3(-6, 0, -52),
        dialogue: 'Hrrrm! Wheat harvest looks plentiful today. Watch out for hungry sheep!',
      },
      {
        name: 'Chef Steve',
        pos: new THREE.Vector3(2.5, 0, -46),
        dialogue: 'Hrrrm! Put your raw porkchop and beef on the campfire grill to cook delicious steaks!',
      },
      {
        name: 'Carnival Duke',
        pos: new THREE.Vector3(16, 0, -47),
        dialogue: 'Welcome to the Game Station! Click or shoot the moving bullseye targets to earn Emeralds!',
      },
      {
        name: 'Elder Gregory',
        pos: new THREE.Vector3(0, 0, -32),
        dialogue: 'Hrrrm! Peaceful day on the prairie. Explore the village and rest near the well.',
      },
    ];

    villagerConfigs.forEach((cfg) => {
      const vGroup = new THREE.Group();
      vGroup.position.copy(cfg.pos);

      // Body (Robe)
      const bodyGeo = new THREE.BoxGeometry(0.55, 0.85, 0.35);
      const body = new THREE.Mesh(bodyGeo, robeMat);
      body.position.y = 0.85;
      body.castShadow = true;
      vGroup.add(body);

      // Arms crossed together
      const armFoldGeo = new THREE.BoxGeometry(0.65, 0.32, 0.38);
      const armFold = new THREE.Mesh(armFoldGeo, robeMat);
      armFold.position.set(0, 0.78, 0.08);
      armFold.castShadow = true;
      vGroup.add(armFold);

      // Head with nose
      const headMaterials = [
        robeMat, robeMat, robeMat, robeMat,
        faceMat,
        robeMat,
      ];
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.58, 0.5), headMaterials);
      head.position.y = 1.55;
      head.castShadow = true;
      vGroup.add(head);

      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
      const legGeo = new THREE.BoxGeometry(0.2, 0.45, 0.2);
      const l1 = new THREE.Mesh(legGeo, legMat);
      l1.position.set(-0.13, 0.22, 0);
      vGroup.add(l1);
      const l2 = new THREE.Mesh(legGeo, legMat);
      l2.position.set(0.13, 0.22, 0);
      vGroup.add(l2);

      this.group.add(vGroup);

      this.villagers.push({
        group: vGroup,
        position: cfg.pos,
        name: cfg.name,
        dialogue: cfg.dialogue,
        targetAngle: Math.random() * Math.PI * 2,
        currentAngle: 0,
        moveTimer: 2 + Math.random() * 4,
        moveSpeed: 0,
      });
    });
  }

  /**
   * Check if player shot or clicked a target in the Game Station
   */
  public hitTarget(targetId: string): number {
    const target = this.targets.find((t) => t.id === targetId);
    if (!target) return 0;

    target.hitTimer = 0.3; // wobble / spin animation
    sound.playTargetDing(target.points >= 200);
    return target.points;
  }

  /**
   * Update village animations: campfire smoke, moving targets, villager wandering
   */
  public update(deltaTime: number, time: number) {
    // 1. Campfire smoke particles
    if (this.particlePositions) {
      for (let i = 0; i < this.particleCount; i++) {
        this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * deltaTime;
        this.particlePositions[i * 3] += this.particleVelocities[i * 3] * deltaTime;
        this.particlePositions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * deltaTime;

        // Reset if reached top
        if (this.particlePositions[i * 3 + 1] > 3.8) {
          this.particlePositions[i * 3] = (Math.random() - 0.5) * 0.8;
          this.particlePositions[i * 3 + 1] = 0.45;
          this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        }
      }
      this.campfireParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Moving Game Station Targets
    this.targets.forEach((t) => {
      if (t.isMoving) {
        t.position.x = t.initialX + Math.sin(time * t.moveSpeed) * t.moveRange;
        t.mesh.position.x = t.position.x;
      }

      // Wobble if hit
      if (t.hitTimer > 0) {
        t.hitTimer -= deltaTime;
        t.mesh.rotation.y += deltaTime * 16;
      } else {
        t.mesh.rotation.y = 0;
      }
    });

    // 3. Villager subtle wandering & idle
    this.villagers.forEach((v) => {
      v.moveTimer -= deltaTime;
      if (v.moveTimer <= 0) {
        v.moveTimer = 3 + Math.random() * 5;
        if (Math.random() > 0.6) {
          v.targetAngle = Math.random() * Math.PI * 2;
          v.moveSpeed = 0.8;
        } else {
          v.moveSpeed = 0;
        }
      }

      // Smooth angle
      let diff = v.targetAngle - v.currentAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      v.currentAngle += diff * Math.min(1, deltaTime * 3);
      v.group.rotation.y = v.currentAngle;

      if (v.moveSpeed > 0) {
        v.position.x += Math.sin(v.currentAngle) * v.moveSpeed * deltaTime;
        v.position.z += Math.cos(v.currentAngle) * v.moveSpeed * deltaTime;
        v.group.position.copy(v.position);
      }
    });
  }
}
