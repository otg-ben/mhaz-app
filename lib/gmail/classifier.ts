import type { MhazClassification } from '@/types'
import type { RawEmail } from './client'

interface ClassificationResult {
  classification: MhazClassification
  confidence: number
}

const LEO_KEYWORDS = [
  'ranger', 'sheriff', 'leo', 'law enforcement', 'officer', 'patrol',
  'mmwd', 'mcosd', 'nps', 'chp', 'state parks', 'cop', 'police',
  'stakeout', 'checkpoint', 'ticket', 'cited', 'citation', 'fine',
  'truck', 'green truck', 'brown truck', 'spotted', 'clocking',
]

const TRAIL_KEYWORDS = [
  'downed tree', 'fallen tree', 'washout', 'erosion', 'closure', 'closed',
  'trail closed', 'hazard', 'rut', 'water bar', 'blowdown', 'maintenance',
  'blocked', 'impassable', 'hike-a-bike', 'poison oak', 'fence',
]

const CITATION_KEYWORDS = [
  'got a ticket', 'got cited', 'got a citation', 'received a citation',
  'fine of', 'dollar fine', 'wrote it up', 'written up', 'infraction',
  '$', 'paid a fine',
]

function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  let hits = 0
  for (const kw of keywords) {
    if (lower.includes(kw)) hits++
  }
  return hits
}

export function classifyEmail(email: RawEmail): ClassificationResult {
  const text = `${email.subject} ${email.body}`

  const leoScore      = scoreKeywords(text, LEO_KEYWORDS)
  const trailScore    = scoreKeywords(text, TRAIL_KEYWORDS)
  const citationScore = scoreKeywords(text, CITATION_KEYWORDS)

  const max = Math.max(leoScore, trailScore, citationScore)

  if (max === 0) {
    return { classification: 'unclassified', confidence: 0 }
  }

  // Citations often also match LEO keywords — if citation score is high, prefer it
  if (citationScore >= 2 && citationScore >= leoScore - 1) {
    return {
      classification: 'citation',
      confidence: Math.min(0.95, 0.5 + citationScore * 0.1),
    }
  }

  if (leoScore === max) {
    return {
      classification: 'leo',
      confidence: Math.min(0.95, 0.4 + leoScore * 0.08),
    }
  }

  if (trailScore === max) {
    return {
      classification: 'trail_issue',
      confidence: Math.min(0.95, 0.4 + trailScore * 0.1),
    }
  }

  return { classification: 'unclassified', confidence: 0.1 }
}
