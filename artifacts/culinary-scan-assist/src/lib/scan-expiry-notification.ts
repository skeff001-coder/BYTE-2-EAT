import { LocalNotifications } from "@capacitor/local-notifications";

const NOTIF_ID = 1001;
const DAYS_BEFORE = 3;

export async function cancelExpiryNotification(): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
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

    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });

    const expiryMs = new Date(expiryIso).getTime();
    const fireAtMs = expiryMs - DAYS_BEFORE * 24 * 60 * 60 * 1000;

    if (fireAtMs <= Date.now()) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIF_ID,
          title: "Your scans are expiring soon",
          body: "Your scans expire in 3 days — don't let them go to waste!",
          schedule: { at: new Date(fireAtMs) },
          smallIcon: "ic_stat_icon_config_sample",
          iconColor: "#4CAF50",
        },
      ],
    });
  } catch {
  }
}
