import { ArbitrageOpportunity, UserSettings, AlertLogItem } from '../types';

export class AlertService {
  private audioCtx: AudioContext | null = null;
  private cooldowns: Map<string, number> = new Map();
  private alertHistory: AlertLogItem[] = [];
  private onAlertCallbacks: Array<(item: AlertLogItem) => void> = [];

  constructor() {}

  onAlert(cb: (item: AlertLogItem) => void) {
    this.onAlertCallbacks.push(cb);
  }

  getHistory(): AlertLogItem[] {
    return this.alertHistory;
  }

  clearHistory() {
    this.alertHistory = [];
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return await Notification.requestPermission();
  }

  private playChime() {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12); // E6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  checkOpportunity(opp: ArbitrageOpportunity, settings: UserSettings) {
    if (!opp.isActionable) return;
    if (opp.estimatedNetSpreadPercent < settings.alertNetSpreadThreshold) return;

    const now = Date.now();
    const lastAlertTime = this.cooldowns.get(opp.symbol) || 0;
    const cooldownMs = settings.alertCooldownSeconds * 1000;

    if (now - lastAlertTime < cooldownMs) {
      return; // Still in cooldown
    }

    // Set cooldown
    this.cooldowns.set(opp.symbol, now);

    const alertItem: AlertLogItem = {
      id: `${opp.symbol}-${now}`,
      opportunityId: opp.id,
      symbol: opp.symbol,
      buyExchange: opp.buyExchange,
      sellExchange: opp.sellExchange,
      buyPrice: opp.buyAsk,
      sellPrice: opp.sellBid,
      grossSpreadPercent: opp.grossSpreadPercent,
      netSpreadPercent: opp.estimatedNetSpreadPercent,
      timestamp: now,
    };

    this.alertHistory.unshift(alertItem);
    if (this.alertHistory.length > 50) {
      this.alertHistory.pop();
    }

    // Trigger Sound
    if (settings.soundAlertsEnabled) {
      this.playChime();
    }

    // Trigger Browser Notification
    if (settings.browserNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`⚡ Arbitrage Detected: ${opp.symbol}`, {
            body: `Buy ${opp.buyExchange.toUpperCase()} @ ${opp.buyAsk.toLocaleString()} ➔ Sell ${opp.sellExchange.toUpperCase()} @ ${opp.sellBid.toLocaleString()}\nEst. Net Spread: +${opp.estimatedNetSpreadPercent.toFixed(2)}%`,
            icon: '/favicon.ico',
            tag: opp.symbol,
          });
        } catch {
          // notification creation error ignored
        }
      }
    }

    this.onAlertCallbacks.forEach(cb => cb(alertItem));
  }
}
