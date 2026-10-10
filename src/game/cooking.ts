/**
 * Campfire Cooking & Nutrition System
 * Manages cooking raw meat on the village campfire,
 * progress bar timer, sizzling audio, and food consumption.
 */
import { sound } from './sound';
import { ITEMS } from './items';

export interface CookingSlot {
  rawItemId: string;
  resultItemId: string;
  progress: number; // 0 to 1
  totalTime: number; // seconds
  isComplete: boolean;
}

export class CookingManager {
  public activeSlot: CookingSlot | null = null;
  private campfirePos = { x: 0, y: 0, z: -48 };
  public interactionRange = 4.5;

  public isNearCampfire(playerPos: { x: number; y: number; z: number }): boolean {
    const dx = playerPos.x - this.campfirePos.x;
    const dy = playerPos.y - this.campfirePos.y;
    const dz = playerPos.z - this.campfirePos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= this.interactionRange;
  }

  /**
   * Start cooking a raw item on the campfire
   */
  public startCooking(rawItemId: string): boolean {
    const itemDef = ITEMS[rawItemId];
    if (!itemDef || !itemDef.cooksInto) return false;

    this.activeSlot = {
      rawItemId,
      resultItemId: itemDef.cooksInto,
      progress: 0,
      totalTime: 3.2, // 3.2 seconds cooking time
      isComplete: false,
    };

    sound.playCookSizzle();
    return true;
  }

  /**
   * Update cooking progress
   */
  public update(deltaTime: number): string | null {
    if (!this.activeSlot || this.activeSlot.isComplete) return null;

    this.activeSlot.progress += deltaTime / this.activeSlot.totalTime;

    // Periodic sizzle sound
    if (Math.random() < deltaTime * 1.5) {
      sound.playCookSizzle();
    }

    if (this.activeSlot.progress >= 1.0) {
      this.activeSlot.progress = 1.0;
      this.activeSlot.isComplete = true;
      sound.playItemPop();
      const finished = this.activeSlot.resultItemId;
      this.activeSlot = null;
      return finished;
    }

    return null;
  }
}
