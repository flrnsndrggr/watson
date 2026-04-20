const STORAGE_KEY = 'watson_notification_prefs';
const PROMPT_DISMISS_KEY = 'watson_notification_prompt_dismissed';

export interface NotificationPrefs {
  enabled: boolean;
  /** Reminder time in "HH:MM" 24h format (Europe/Zurich), default "08:00" */
  reminderTime: string;
  /** ISO timestamp of when permission was granted */
  grantedAt: string | null;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  reminderTime: '08:00',
  grantedAt: null,
};

/** Whether the browser supports the Notification API */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Current browser permission state */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/** Request browser notification permission. Returns the resulting state. */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  const result = await Notification.requestPermission();
  return result;
}

/** Get stored notification preferences */
export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) as Partial<NotificationPrefs> };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Save notification preferences */
export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable
  }
}

/** Enable notifications: request permission, save prefs */
export async function enableNotifications(reminderTime: string): Promise<boolean> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return false;

  saveNotificationPrefs({
    enabled: true,
    reminderTime,
    grantedAt: new Date().toISOString(),
  });
  return true;
}

/** Disable notifications */
export function disableNotifications(): void {
  saveNotificationPrefs({
    ...getNotificationPrefs(),
    enabled: false,
  });
}

/** Update the reminder time */
export function updateReminderTime(time: string): void {
  saveNotificationPrefs({
    ...getNotificationPrefs(),
    reminderTime: time,
  });
}

/** Check if the notification prompt has been dismissed */
export function isPromptDismissed(): boolean {
  try {
    return sessionStorage.getItem(PROMPT_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/** Dismiss the notification prompt for this session */
export function dismissPrompt(): void {
  try {
    sessionStorage.setItem(PROMPT_DISMISS_KEY, '1');
  } catch {
    // sessionStorage unavailable
  }
}

/** Whether the user has already enabled notifications (skip the prompt) */
export function hasEnabledNotifications(): boolean {
  return getNotificationPrefs().enabled;
}
