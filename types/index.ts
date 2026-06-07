// ─── Enums ───────────────────────────────────────────────────────────────────

export type AlertSource = 'user' | 'mhaz'
export type AlertType = 'leo' | 'trail' | 'citation' | 'lost_found'

export type LeoAgency =
  | 'Marin County Sheriff'
  | 'MMWD'
  | 'CA State Parks'
  | 'Marin Open Space & Parks (MCOSD)'
  | 'National Park Service (NPS)'
  | 'California Highway Patrol (CHP)'
  | 'Local PD'
  | 'Other'

export type TrailIssueType =
  | 'downed_tree'
  | 'washout'
  | 'closure'
  | 'maintenance'
  | 'hazard'
  | 'other'

export type TrailIssueStatus = 'active' | 'resolved'

export type CitationInfractionType =
  | 'hiking_trail'
  | 'unpermitted_trail'
  | 'night_riding'
  | 'ebike'
  | 'other'

export type LostFoundType = 'lost' | 'found'
export type LostFoundStatus = 'open' | 'resolved'

export type MhazClassification = 'leo' | 'trail_issue' | 'citation' | 'unclassified'
export type DmStatus = 'sent' | 'read'

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  handle: string
  email: string
  bio: string | null
  created_at: string
  updated_at: string
  is_admin?: boolean
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface LeoAlert {
  id: string
  user_id: string
  lat: number
  long: number
  agency: LeoAgency
  description: string
  source: AlertSource
  mhaz_email_id: string | null
  created_at: string
  updated_at: string
  expires_at: string
  // Joined
  user?: Pick<UserProfile, 'handle'>
}

export interface TrailAlert {
  id: string
  user_id: string
  lat: number
  long: number
  issue_type: TrailIssueType
  description: string
  status: TrailIssueStatus
  photos: string[]
  source: AlertSource
  mhaz_email_id: string | null
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  map_expires_at: string
  // Joined
  user?: Pick<UserProfile, 'handle'>
  resolver?: Pick<UserProfile, 'handle'>
}

export interface Citation {
  id: string
  user_id: string
  lat: number
  long: number
  agency: LeoAgency
  incident_date: string
  infraction_type: CitationInfractionType
  description: string
  source: AlertSource
  mhaz_email_id: string | null
  created_at: string
  updated_at: string
  // Joined
  user?: Pick<UserProfile, 'handle'>
}

export interface LostFoundPost {
  id: string
  user_id: string
  type: LostFoundType
  description: string
  location_text: string | null
  lat: number | null
  long: number | null
  photos: string[]
  status: LostFoundStatus
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  // Joined
  user?: Pick<UserProfile, 'handle'>
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string
  user_id: string
  alert_type: AlertType
  alert_id: string
  body: string
  created_at: string
  updated_at: string
  user?: Pick<UserProfile, 'handle'>
}

// ─── Follows ─────────────────────────────────────────────────────────────────

export interface AlertFollow {
  id: string
  user_id: string
  alert_type: AlertType
  alert_id: string
  created_at: string
}

// ─── Direct Messages ─────────────────────────────────────────────────────────

export interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  status: DmStatus
  created_at: string
  read_at: string | null
  sender?: Pick<UserProfile, 'handle'>
  recipient?: Pick<UserProfile, 'handle'>
}

// ─── MHAZ Queue ──────────────────────────────────────────────────────────────

export interface MhazQueueItem {
  id: string
  raw_email_body: string
  subject: string
  sender: string
  received_at: string
  classification: MhazClassification
  confidence: number
  reviewed_by: string | null
  reviewed_at: string | null
  approved: boolean | null
  created_at: string
}

// ─── Temporal filters ────────────────────────────────────────────────────────

export type TimeRange = '24h' | '7d' | '14d' | '30d' | '90d' | '1y'

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '24h': 'Last 24h',
  '7d': '7d',
  '14d': '14d',
  '30d': '30d',
  '90d': '90d',
  '1y': 'Last 12 mo',
}

export const DEFAULT_TIME_RANGES: Record<AlertType, TimeRange> = {
  leo: '24h',
  trail: '90d',
  citation: '30d',
  lost_found: '90d',
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export interface MapPin {
  id: string
  lat: number
  lng: number
  type: AlertType
  data: LeoAlert | TrailAlert | Citation | LostFoundPost
}

// ─── UI state ────────────────────────────────────────────────────────────────

export interface SelectedAlert {
  type: AlertType
  data: LeoAlert | TrailAlert | Citation | LostFoundPost
}

export type ActiveTab = AlertType

// ─── MHAZ Email Feed ──────────────────────────────────────────────────────────

export interface MhazEmail {
  id: string
  gmail_message_id: string
  subject: string
  sender_name: string
  sender_email: string
  body: string
  received_at: string
  created_at: string
}
