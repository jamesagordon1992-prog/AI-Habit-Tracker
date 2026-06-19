/**
 * Retro Sound Service
 * Generates 8-bit style sound effects using the Web Audio API.
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createOscillator(type: OscillatorType, freq: number, startTime: number, duration: number, volume: number) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Short blip for UI interactions
   */
  playInteraction() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.createOscillator('square', 880, now, 0.1, 0.1);
  }

  /**
   * Rising arpeggio for success/completion
   */
  playSuccess() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.createOscillator('square', 523.25, now, 0.1, 0.1); // C5
    this.createOscillator('square', 659.25, now + 0.1, 0.1, 0.1); // E5
    this.createOscillator('square', 783.99, now + 0.2, 0.3, 0.1); // G5
  }

  /**
   * Two-tone alert for notifications
   */
  playNotification() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.createOscillator('triangle', 440, now, 0.15, 0.1); // A4
    this.createOscillator('triangle', 880, now + 0.15, 0.2, 0.1); // A5
  }

  /**
   * Celebratory sound for milestones
   */
  playMilestone() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.createOscillator('square', freq, now + (i * 0.1), 0.2, 0.05);
    });
  }

  /**
   * Low tone for toggling off/negative actions
   */
  playToggleOff() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.createOscillator('square', 220, now, 0.1, 0.1);
    this.createOscillator('square', 110, now + 0.1, 0.2, 0.1);
  }
}

export const soundService = new SoundService();
