/**
 * Minecraft Environment & World System
 * - Vast tiled grass field extending to the horizon
 * - Atmospheric daylight lighting and soft directional shadows
 * - Procedural drifting 3D blocky clouds
 * - Minecraft square sun
 * - Seamless fog horizon integration
 */
import * as THREE from 'three';
import { createGrassTopTexture, createSunTexture } from './textures';

export class MinecraftWorld {
  public scene: THREE.Scene;
  public groundMesh: THREE.Mesh;
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  public cloudsGroup: THREE.Group;
  public sunMesh: THREE.Mesh;

  private cloudMeshes: Array<{
    mesh: THREE.Mesh;
    baseX: number;
    baseZ: number;
    speed: number;
  }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Sky & Fog
    // Vibrant, peaceful Minecraft daytime sky color
    const skyColor = new THREE.Color(0x8bc3ff);
    this.scene.background = skyColor;
    // Linear fog creates a clear, sharp horizon where green grass naturally dissolves into the blue sky
    this.scene.fog = new THREE.Fog(0x8bc3ff, 160, 520);

    // 2. Lighting
    // Ambient light provides soft fill
    this.ambientLight = new THREE.AmbientLight(0xd6eaff, 0.6);
    this.scene.add(this.ambientLight);

    // Hemisphere light balances cool sky above and warm green bounce below
    this.hemiLight = new THREE.HemisphereLight(0xaad3ff, 0x5a9436, 0.45);
    this.scene.add(this.hemiLight);

    // Directional Sun light
    this.sunLight = new THREE.DirectionalLight(0xfffbe6, 1.25);
    this.sunLight.position.set(80, 140, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;

    // Shadow frustum focused around the player
    const shadowD = 28;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 3. Ground Grass Field
    // Massive plane of 1400x1400 units
    const groundSize = 1400;
    const grassTex = createGrassTopTexture();
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(groundSize, groundSize);

    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.95,
      metalness: 0.0,
      color: 0x9be85a, // vibrant Minecraft meadow tint on grass texture
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // 4. Minecraft Sun (Blocky square in the sky)
    const sunTex = createSunTexture();
    const sunGeo = new THREE.PlaneGeometry(24, 24);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      transparent: true,
      depthWrite: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(160, 220, 120);
    this.sunMesh.lookAt(0, 0, 0);
    this.scene.add(this.sunMesh);

    // 5. Procedural 3D Blocky Clouds
    this.cloudsGroup = new THREE.Group();
    this.cloudsGroup.name = 'Clouds';
    this.createClouds();
    this.scene.add(this.cloudsGroup);
  }

  private createClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });

    const cloudCount = 38;
    const spread = 700;
    const cloudHeight = 52; // altitude

    for (let i = 0; i < cloudCount; i++) {
      // Create a composite cloud shape with 2-4 connected flat boxes
      const cloudCluster = new THREE.Group();
      const clusterWidth = 18 + Math.random() * 24;
      const clusterLength = 24 + Math.random() * 36;
      const cloudThickness = 3.5;

      // Base slab
      const mainGeo = new THREE.BoxGeometry(clusterWidth, cloudThickness, clusterLength);
      const mainMesh = new THREE.Mesh(mainGeo, cloudMat);
      cloudCluster.add(mainMesh);

      // 1-2 overlapping side blocks to make it look authentically blocky
      if (Math.random() > 0.3) {
        const subW = clusterWidth * (0.4 + Math.random() * 0.4);
        const subL = clusterLength * (0.4 + Math.random() * 0.4);
        const subGeo = new THREE.BoxGeometry(subW, cloudThickness, subL);
        const subMesh = new THREE.Mesh(subGeo, cloudMat);
        subMesh.position.set(
          (Math.random() - 0.5) * clusterWidth * 0.6,
          0,
          (Math.random() - 0.5) * clusterLength * 0.6
        );
        cloudCluster.add(subMesh);
      }

      const baseX = (Math.random() - 0.5) * spread;
      const baseZ = (Math.random() - 0.5) * spread;
      const y = cloudHeight + (Math.random() - 0.5) * 6;

      cloudCluster.position.set(baseX, y, baseZ);
      this.cloudsGroup.add(cloudCluster);

      this.cloudMeshes.push({
        mesh: cloudCluster as unknown as THREE.Mesh,
        baseX,
        baseZ,
        speed: 1.2 + Math.random() * 0.8,
      });
    }
  }

  /**
   * Updates world: drifts clouds, follows player with shadows & infinite ground tiling
   */
  public update(deltaTime: number, playerX: number, playerZ: number) {
    // 1. Shift ground mesh to stay centered near player in integer block increments
    // This makes the flat grass world infinite without visible seam jumps!
    const snapX = Math.floor(playerX);
    const snapZ = Math.floor(playerZ);
    this.groundMesh.position.x = snapX;
    this.groundMesh.position.z = snapZ;

    // 2. Keep sun light shadow camera focused on the player
    this.sunLight.position.x = playerX + 80;
    this.sunLight.position.z = playerZ + 60;
    this.sunLight.target.position.set(playerX, 0, playerZ);
    this.sunLight.target.updateMatrixWorld();

    // 3. Drift clouds slowly along +X axis and wrap around player
    const bound = 380;
    for (const cloud of this.cloudMeshes) {
      cloud.mesh.position.x += cloud.speed * deltaTime;

      // Wrap around relative to player
      const relX = cloud.mesh.position.x - playerX;
      if (relX > bound) {
        cloud.mesh.position.x -= bound * 2;
      } else if (relX < -bound) {
        cloud.mesh.position.x += bound * 2;
      }

      const relZ = cloud.mesh.position.z - playerZ;
      if (relZ > bound) {
        cloud.mesh.position.z -= bound * 2;
      } else if (relZ < -bound) {
        cloud.mesh.position.z += bound * 2;
      }
    }
  }
}
