import type { LeoAlert, TrailAlert, Citation } from '@/types'
import { LEO_AGENCY_LABELS, TRAIL_ISSUE_LABELS, APP_TIME_ZONE } from '@/lib/utils'

/**
 * Plain-text list emails for user-created alerts.
 *
 * No "[MHAZ]" prefix — the Google Group prepends its own tag on the way out,
 * and doubling it would read as "[MHAZ] [MHAZ] ...".
 *
 * These are pure formatters: nothing here can send mail.
 */

/** `reporter` is the poster's email address, shown as the attribution line. */
export type AlertEmailInput =
  | { type: 'trail';    data: TrailAlert; reporter: string }
  | { type: 'leo';      data: LeoAlert;   reporter: string }
  | { type: 'citation'; data: Citation;   reporter: string }

export interface AlertEmail {
  subject: string
  text: string
}

// Rendered on Vercel, which runs UTC — without an explicit zone a 2:34 PM
// Pacific report goes out to the list stamped 9:34 PM
const when = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod')}`
}

/** Subjects stay scannable in a busy list — one line, no wrapping. */
function truncate(s: string, max = 55) {
  const clean = (s ?? '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

/** Omitted entirely when an alert has no pin, rather than showing blank fields. */
function locationBlock(lat?: number | null, long?: number | null) {
  if (lat == null || long == null) return ''
  return [
    `Location: ${lat}, ${long}`,
    `Map:      https://www.google.com/maps?q=${lat},${long}`,
    '',
  ].join('\n')
}

function photoBlock(photos?: string[] | null) {
  if (!photos?.length) return ''
  return ['Photos:', ...photos.map(p => `  ${p}`), ''].join('\n')
}

const FOOTER = '--\nPosted from the MHAZ app'

/**
 * Joins sections, keeping deliberate blank lines but collapsing the gaps left
 * by omitted blocks (no pin, no photos) so the body never has a hole in it.
 */
function assemble(parts: string[]) {
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

export function buildAlertEmail(input: AlertEmailInput): AlertEmail {
  const { reporter } = input

  if (input.type === 'trail') {
    const a = input.data
    const issue = TRAIL_ISSUE_LABELS[a.issue_type]
    return {
      subject: `Trail Issue: ${issue} — ${truncate(a.description)}`,
      text: assemble([
        `TRAIL ISSUE — ${issue}`,
        `Reported by ${reporter} · ${when(a.created_at)}`,
        '',
        a.description || '(no description provided)',
        '',
        locationBlock(a.lat, a.long),
        photoBlock(a.photos),
        FOOTER,
      ]),
    }
  }

  if (input.type === 'leo') {
    const a = input.data
    const agency = LEO_AGENCY_LABELS[a.agency]
    return {
      subject: `LEO Alert: ${agency} — ${truncate(a.description)}`,
      text: assemble([
        `LEO SIGHTING — ${agency}`,
        `Reported by ${reporter} · ${when(a.created_at)}`,
        '',
        a.description || '(no description provided)',
        '',
        locationBlock(a.lat, a.long),
        FOOTER,
      ]),
    }
  }

  const a = input.data
  const agency = LEO_AGENCY_LABELS[a.agency]
  return {
    subject: `Citation: ${agency} — ${truncate(a.description)}`,
    text: assemble([
      `CITATION REPORT — ${agency}`,
      // Incident and report times often differ by a day; conflating them misleads
      `Incident:    ${when(a.incident_date)}`,
      `Reported by: ${reporter} · ${when(a.created_at)}`,
      '',
      a.description || '(no description provided)',
      '',
      locationBlock(a.lat, a.long),
      FOOTER,
    ]),
  }
}
