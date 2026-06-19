
export class NotificationService {
  private static instance: NotificationService;
  private nudgeTimer: any = null;

  private constructor() {}

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  scheduleNudge(hour: number, minute: number, message: string) {
    if (this.nudgeTimer) clearTimeout(this.nudgeTimer);

    const now = new Date();
    const nudgeTime = new Date();
    nudgeTime.setHours(hour, minute, 0, 0);

    if (nudgeTime <= now) {
      nudgeTime.setDate(nudgeTime.getDate() + 1);
    }

    const delay = nudgeTime.getTime() - now.getTime();
    console.log(`Scheduling nudge in ${Math.round(delay / 1000 / 60)} minutes`);

    this.nudgeTimer = setTimeout(() => {
      this.sendNotification('Ellis Nudge', message);
      this.scheduleNudge(hour, minute, message); // Reschedule for next day
    }, delay);
  }

  sendNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico', // Assuming there's an icon
      });
    }
  }

  cancelNudge() {
    if (this.nudgeTimer) {
      clearTimeout(this.nudgeTimer);
      this.nudgeTimer = null;
    }
  }
}

export const notificationService = NotificationService.getInstance();
