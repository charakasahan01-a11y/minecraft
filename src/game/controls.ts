/**
 * Input & Keyboard/Mouse Controls System
 * Manages Pointer Lock, key states, mouse clicks for attack/interact,
 * hotbar slots 1-9, mouse sensitivity, and camera zooming
 */

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  zoomDelta: number;
  viewToggle: boolean;
  attack: boolean;
  interact: boolean;
  selectedSlotIndex: number | null;
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private zoomDelta: number = 0;
  private viewToggleRequested: boolean = false;
  private attackRequested: boolean = false;
  private interactRequested: boolean = false;
  private slotSelected: number | null = null;

  private isLocked: boolean = false;
  private domElement: HTMLElement | null = null;

  public sensitivity: number = 0.0022;
  public invertY: boolean = false;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseDownBound: (e: MouseEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onPointerLockChangeBound: () => void;

  public onLockChange?: (locked: boolean) => void;

  constructor() {
    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);
    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onMouseDownBound = this.onMouseDown.bind(this);
    this.onWheelBound = this.onWheel.bind(this);
    this.onPointerLockChangeBound = this.onPointerLockChange.bind(this);
  }

  public attach(element: HTMLElement) {
    this.domElement = element;
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mousedown', this.onMouseDownBound);
    element.addEventListener('wheel', this.onWheelBound, { passive: false });
    document.addEventListener('pointerlockchange', this.onPointerLockChangeBound);
  }

  public detach() {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mousedown', this.onMouseDownBound);
    if (this.domElement) {
      this.domElement.removeEventListener('wheel', this.onWheelBound);
    }
    document.removeEventListener('pointerlockchange', this.onPointerLockChangeBound);
    this.domElement = null;
  }

  public requestPointerLock() {
    if (this.domElement && document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock();
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  private onPointerLockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
    if (this.onLockChange) {
      this.onLockChange(this.isLocked);
    }
  }

  private onMouseDown(e: MouseEvent) {
    if (!this.isLocked) return;

    if (e.button === 0) {
      // Left click = attack / punch / shoot
      this.attackRequested = true;
    } else if (e.button === 2) {
      // Right click = interact / eat / cook
      this.interactRequested = true;
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;

    // View toggle key (V or F5)
    if (e.code === 'KeyV' || e.code === 'F5') {
      e.preventDefault();
      this.viewToggleRequested = true;
    }

    // Attack key alternate (F or Space)
    if (e.code === 'KeyF') {
      this.attackRequested = true;
    }

    // Interact key alternate (E)
    if (e.code === 'KeyE') {
      this.interactRequested = true;
    }

    // Hotbar slots 1-9 (Digit1 - Digit9)
    if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= 9) {
        this.slotSelected = num - 1;
      }
    }

    // Prevent default scroll behavior for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isLocked) return;
    this.mouseDeltaX += e.movementX;
    this.mouseDeltaY += e.movementY;
  }

  private onWheel(e: WheelEvent) {
    if (!this.isLocked) return;
    e.preventDefault();
    this.zoomDelta += Math.sign(e.deltaY);
  }

  /**
   * Reads input frame state and resets frame triggers
   */
  public poll(): InputState {
    const forward = !!(this.keys['KeyW'] || this.keys['ArrowUp']);
    const backward = !!(this.keys['KeyS'] || this.keys['ArrowDown']);
    const left = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
    const right = !!(this.keys['KeyD'] || this.keys['ArrowRight']);
    const jump = !!this.keys['Space'];
    const sprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    const deltaX = this.mouseDeltaX * this.sensitivity;
    const deltaY = this.mouseDeltaY * this.sensitivity * (this.invertY ? -1 : 1);
    const zoom = this.zoomDelta;
    const viewToggle = this.viewToggleRequested;
    const attack = this.attackRequested;
    const interact = this.interactRequested;
    const selectedSlotIndex = this.slotSelected;

    // Reset frame triggers
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.zoomDelta = 0;
    this.viewToggleRequested = false;
    this.attackRequested = false;
    this.interactRequested = false;
    this.slotSelected = null;

    return {
      forward,
      backward,
      left,
      right,
      jump,
      sprint,
      mouseDeltaX: deltaX,
      mouseDeltaY: deltaY,
      zoomDelta: zoom,
      viewToggle,
      attack,
      interact,
      selectedSlotIndex,
    };
  }
}
