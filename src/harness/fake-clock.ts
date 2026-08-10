import type { RuntimeClock } from "../core/task-runtime/contracts.js";

export class FakeClock implements RuntimeClock {
  private current: Date;

  constructor(initialTime: string) {
    this.current = new Date(initialTime);
    if (Number.isNaN(this.current.valueOf())) {
      throw new Error(`Invalid fake clock time: ${initialTime}`);
    }
  }

  now(): Date {
    return new Date(this.current);
  }

  advance(milliseconds: number): void {
    if (milliseconds < 0) {
      throw new Error("Fake clock cannot move backwards");
    }
    this.current = new Date(this.current.valueOf() + milliseconds);
  }
}
