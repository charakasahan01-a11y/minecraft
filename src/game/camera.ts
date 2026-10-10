/**
 * Third-Person Orbit Follow Camera
 * - Follows player smoothly with damping
 * - Full mouse rotation around player
 * - Pitch clamping and strict ground clipping prevention
 * - Dynamic FOV widening on sprint
 * - Multiple perspective modes (Third-person back, front, first-person)
 */
import * as THREE from 'three';

export type CameraPerspective = 'third_back' | 'third_front' | 'first_person';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0; // horizontal angle
  public pitch: number = -0.15; // vertical angle (radians)
  public distance: number = 4.8;
  public minDistance: number = 2.0;
  public maxDistance: number = 8.5;
  public perspective: CameraPerspective = 'third_back';

  // Damped targets
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3(0, 3, 5);
  private currentLookTarget: THREE.Vector3 = new THREE.Vector3(0, 1.3, 0);

  // Field of view
  public baseFov: number = 72;
  private currentFov: number = 72;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(72, aspect, 0.1, 1000);
    this.camera.position.set(0, 2.5, 4.8);
    this.currentCameraPos.copy(this.camera.position);
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public cyclePerspective(): CameraPerspective {
    if (this.perspective === 'third_back') {
      this.perspective = 'third_front';
    } else if (this.perspective === 'third_front') {
      this.perspective = 'first_person';
    } else {
      this.perspective = 'third_back';
    }
    return this.perspective;
  }

  public setPerspective(p: CameraPerspective) {
    this.perspective = p;
  }

  public update(
    deltaTime: number,
    playerPos: THREE.Vector3,
    mouseDeltaX: number,
    mouseDeltaY: number,
    zoomDelta: number,
    isSprinting: boolean
  ) {
    // 1. Update yaw & pitch from mouse deltas
    this.yaw -= mouseDeltaX;
    this.pitch -= mouseDeltaY;

    // Clamp pitch so camera can't flip upside down
    // Max looking down: ~ -1.25 rad (-72 deg)
    // Max looking up from grass: ~ +0.4 rad (+23 deg)
    const minPitch = -1.25;
    const maxPitch = 0.42;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

    // 2. Adjust distance with mouse wheel zoom (in 3rd person)
    if (zoomDelta !== 0 && this.perspective !== 'first_person') {
      this.distance += zoomDelta * 0.5;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }

    // 3. Dynamic sprint FOV widening
    const targetFov = isSprinting ? this.baseFov + 8 : this.baseFov;
    this.currentFov = THREE.MathUtils.lerp(this.currentFov, targetFov, Math.min(1, deltaTime * 8));
    if (Math.abs(this.camera.fov - this.currentFov) > 0.01) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }

    // 4. Calculate target focal point (Steve's chest/head)
    const focalPointY = playerPos.y + 1.25;
    const targetLook = new THREE.Vector3(playerPos.x, focalPointY, playerPos.z);

    // Smoothly damp look target
    this.currentLookTarget.lerp(targetLook, Math.min(1, deltaTime * 16));

    // 5. Calculate ideal camera position based on perspective mode
    const idealCamPos = new THREE.Vector3();

    if (this.perspective === 'first_person') {
      // Camera sits right at Steve's eye position (y = 1.62)
      idealCamPos.set(playerPos.x, playerPos.y + 1.62, playerPos.z);

      // Rotate camera directly with yaw and pitch
      this.camera.position.copy(idealCamPos);
      this.camera.rotation.set(0, 0, 0);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      return;
    }

    // Third-person perspective (back or front)
    const yawOffset = this.perspective === 'third_front' ? Math.PI : 0;
    const effectiveYaw = this.yaw + yawOffset;

    // Spherical coordinates from focal point
    const horizDist = this.distance * Math.cos(this.pitch);
    const vertDist = this.distance * Math.sin(this.pitch);

    idealCamPos.x = targetLook.x + horizDist * Math.sin(effectiveYaw);
    idealCamPos.z = targetLook.z + horizDist * Math.cos(effectiveYaw);
    idealCamPos.y = targetLook.y - vertDist;

    // 6. Ground collision prevention:
    // Never allow camera to dip below grass floor (y >= 0.35)
    const groundClearance = 0.35;
    if (idealCamPos.y < groundClearance) {
      idealCamPos.y = groundClearance;
    }

    // 7. Smoothly damp camera position towards ideal position
    const posDamp = Math.min(1, deltaTime * 14);
    this.currentCameraPos.lerp(idealCamPos, posDamp);

    // Enforce ground clearance on current pos as well
    if (this.currentCameraPos.y < groundClearance) {
      this.currentCameraPos.y = groundClearance;
    }

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookTarget);
  }
}
