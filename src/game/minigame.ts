/**
 * Village Game Station - Target Archery & Shooting Challenge
 * Manages rounds, score, combo multipliers, emerald awards, and high scores.
 */
import { sound } from './sound';

export interface MinigameState {
  isActive: boolean;
  score: number;
  highScore: number;
  timeLeft: number;
  combo: number;
  targetsHit: number;
  emeraldsEarned: number;
}

export class GameStationManager {
  public state: MinigameState = {
    isActive: false,
    score: 0,
    highScore: 0,
    timeLeft: 30,
    combo: 1,
    targetsHit: 0,
    emeraldsEarned: 0,
  };

  private gameStationPos = { x: 16, y: 0, z: -48 };
  public interactionRange = 6.0;

  public isNearStation(playerPos: { x: number; y: number; z: number }): boolean {
    const dx = playerPos.x - this.gameStationPos.x;
    const dy = playerPos.y - this.gameStationPos.y;
    const dz = playerPos.z - this.gameStationPos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= this.interactionRange;
  }

  public startRound() {
    this.state.isActive = true;
    this.state.score = 0;
    this.state.timeLeft = 30;
    this.state.combo = 1;
    this.state.targetsHit = 0;
    this.state.emeraldsEarned = 0;
    sound.playTargetDing(true);
  }

  public stopRound() {
    this.state.isActive = false;
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }
  }

  /**
   * Registers a target hit and computes points
   */
  public registerHit(basePoints: number): { pointsAwarded: number; newEmerald: boolean } {
    const points = basePoints * this.state.combo;
    this.state.score += points;
    this.state.targetsHit += 1;
    this.state.combo = Math.min(5, this.state.combo + 1);

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }

    // Award 1 emerald every 500 points
    const newTotalEmeralds = Math.floor(this.state.score / 500);
    let newEmerald = false;
    if (newTotalEmeralds > this.state.emeraldsEarned) {
      newEmerald = true;
      this.state.emeraldsEarned = newTotalEmeralds;
      sound.playItemPop();
    }

    return { pointsAwarded: points, newEmerald };
  }

  public registerMiss() {
    this.state.combo = 1;
  }

  public update(deltaTime: number): boolean {
    if (!this.state.isActive) return false;

    this.state.timeLeft -= deltaTime;
    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0;
      this.stopRound();
      sound.playTargetDing(true);
      return true; // round finished
    }

    return false;
  }
}
