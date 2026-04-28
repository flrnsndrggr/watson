import { useState } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  getNotificationPrefs,
  enableNotifications,
  disableNotifications,
  updateReminderTime,
} from '@/lib/notifications';
import { showToast } from './Toast';
import { trackNotificationOptIn } from '@/lib/analytics';

const TIME_OPTIONS = [
  { value: '07:00', label: '07:00' },
  { value: '08:00', label: '08:00' },
  { value: '09:00', label: '09:00' },
  { value: '10:00', label: '10:00' },
  { value: '12:00', label: '12:00' },
  { value: '18:00', label: '18:00' },
  { value: '20:00', label: '20:00' },
];

export function NotificationSettings() {
  const prefs = getNotificationPrefs();
  const [enabled, setEnabled] = useState(prefs.enabled);
  const [time, setTime] = useState(prefs.reminderTime);
  const [enabling, setEnabling] = useState(false);

  if (!isNotificationSupported()) return null;

  const browserDenied = getNotificationPermission() === 'denied';

  async function handleToggle() {
    if (enabled) {
      setEnabling(true);
      await disableNotifications();
      setEnabling(false);
      setEnabled(false);
      showToast('Erinnerung deaktiviert');
    } else {
      setEnabling(true);
      const success = await enableNotifications(time);
      setEnabling(false);

      if (success) {
        setEnabled(true);
        showToast('Erinnerung aktiviert!');
        trackNotificationOptIn('profile');
      } else {
        showToast('Benachrichtigungen wurden im Browser blockiert.');
      }
    }
  }

  function handleTimeChange(newTime: string) {
    setTime(newTime);
    if (enabled) {
      void updateReminderTime(newTime);
    }
  }

  return (
    <div className="rounded-lg border-2 border-[var(--color-gray-bg)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-base font-bold">
            Tägliche Erinnerung
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-gray-text)]">
            {browserDenied
              ? 'Benachrichtigungen im Browser blockiert — bitte in den Browser-Einstellungen erlauben.'
              : 'Erhalte eine tägliche Erinnerung an dein watson-Puzzle.'}
          </p>
        </div>
        <button
          onClick={() => void handleToggle()}
          disabled={enabling || browserDenied}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer disabled:opacity-40 ${
            enabled ? 'bg-[var(--color-cyan)]' : 'bg-[var(--color-gray-bg)]'
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label="Tägliche Erinnerung ein/aus"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-3 flex items-center gap-3">
          <label
            htmlFor="reminder-time"
            className="text-sm text-[var(--color-gray-text)]"
          >
            Uhrzeit:
          </label>
          <select
            id="reminder-time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="rounded border border-[var(--color-gray-bg)] bg-white px-3 py-1.5 text-sm text-[var(--color-black)] cursor-pointer"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
