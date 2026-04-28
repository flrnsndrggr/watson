/** Returns today's date in YYYY-MM-DD format (Europe/Zurich timezone). */
export function getTodayDateCET(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}
