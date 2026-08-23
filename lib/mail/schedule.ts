/**
 * The cron fires every 5 minutes around the clock; this decides whether a
 * given tick should actually hit the mailbox.
 *
 * 6am–10pm Pacific: every 5 minutes (riding hours — alerts are time-critical)
 * Otherwise:       every 15 minutes
 *
 * Uses the IANA zone rather than a fixed offset so DST needs no maintenance.
 */
const PEAK_START_HOUR = 6
const PEAK_END_HOUR = 22 // exclusive — 10pm

export function shouldSyncNow(now = new Date()): boolean {
  const pt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const hour = Number(pt.find(p => p.type === 'hour')?.value ?? 0)
  const minute = Number(pt.find(p => p.type === 'minute')?.value ?? 0)

  const isPeak = hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR
  if (isPeak) return true

  // Off-hours: only every third tick
  return minute % 15 < 5
}
