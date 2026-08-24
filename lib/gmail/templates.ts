import { format } from 'date-fns'
import type { LeoAlert, TrailAlert, Citation } from '@/types'
import { LEO_AGENCY_LABELS, TRAIL_ISSUE_LABELS } from '@/lib/utils'

/**
 * Plain-text list emails for user-created alerts.
 *
 * No "[MHAZ]" prefix — the Google Group prepends its own tag on the way out,
 * and doubling it would read as "[MHAZ] [MHAZ] ...".
 *
 * These are pure formatters: nothing here can send mail.
 */

export type AlertEmailInput =
  | { type: 'trail';    data: TrailAlert; handle: string }
  | { type: 'leo';      data: LeoAlert;   handle: string }
  | { type: 'citation'; data: Citation;   handle: string }

export interface AlertEmail {
  subject: string
  text: string
}

const when = (iso: string) => format(new Date(iso), "MMM d, yyyy 'at' h:mm a")

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
  const { handle } = input

  if (input.type === 'trail') {
    const a = input.data
    const issue = TRAIL_ISSUE_LABELS[a.issue_type]
    return {
      subject: `Trail Issue: ${issue} — ${truncate(a.description)}`,
      text: assemble([
        `TRAIL ISSUE — ${issue}`,
        `Reported by @${handle} · ${when(a.created_at)}`,
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
        `Reported by @${handle} · ${when(a.created_at)}`,
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
      `Reported by: @${handle} · ${when(a.created_at)}`,
      '',
      a.description || '(no description provided)',
      '',
      locationBlock(a.lat, a.long),
      FOOTER,
    ]),
  }
}
