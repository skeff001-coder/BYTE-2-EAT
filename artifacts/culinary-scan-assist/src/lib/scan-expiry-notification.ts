import { LocalNotifications } from "@capacitor/local-notifications";

const NOTIF_ID_WARNING = 1001;
const NOTIF_ID_EXPIRED = 1002;
const DAYS_BEFORE = 3;

export async function cancelExpiryNotification(): Promise<void> {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIF_ID_WARNING }, { id: NOTIF_ID_EXPIRED }],
    });
  } catch {
  }
}

export async function scheduleExpiryNotification(
  expiryIso: string
): Promise<void> {
  try {
    const { display } = await LocalNotifications.checkPermissions();

    if (display === "prompt" || display === "prompt-with-rationale") {
      const { display: granted } = await LocalNotifications.requestPermissions();
      if (granted !== "granted") return;
    } else if (display !== "granted") {
      return;
    }

    await LocalNotifications.cancel({
      notifications: [{ id: NOTIF_ID_WARNING }, { id: NOTIF_ID_EXPIRED }],
    });

    const expiryMs = new Date(expiryIso).getTime();
    const warningFireAtMs = expiryMs - DAYS_BEFORE * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const notifications = [];

    if (warningFireAtMs > now) {
      notifications.push({
        id: NOTIF_ID_WARNING,
        title: "Your scans are expiring soon",
        body: "Your scans expire in 3 days — don't let them go to waste!",
        schedule: { at: new Date(warningFireAtMs) },
        smallIcon: "ic_stat_icon_config_sample",
        iconColor: "#4CAF50",
      });
    }

    if (expiryMs > now) {
      notifications.push({
        id: NOTIF_ID_EXPIRED,
        title: "Your scans have expired",
        body: "Your scan credits just expired — grab a new pack to keep scanning!",
        schedule: { at: new Date(expiryMs) },
        smallIcon: "ic_stat_icon_config_sample",
        iconColor: "#4CAF50",
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
  }
}
