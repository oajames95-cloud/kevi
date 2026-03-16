// Kevi.io TypeScript Types

export interface Company {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Rep {
  id: string
  company_id: string
  name: string
  email: string
  role: 'admin' | 'rep'
  extension_token: string
  supabase_user_id: string | null
  last_seen_at: string | null
  created_at: string
}

export interface InviteToken {
  id: string
  company_id: string
  token: string
  email: string | null
  role: 'admin' | 'rep'
  created_by: string | null
  used_at: string | null
  expires_at: string
  created_at: string
}

export interface ActivityEvent {
  id: string
  rep_id: string
  domain: string
  category: ActivityCategory
  focus_seconds: number
  keystrokes: number
  recorded_at: string
  created_at: string
}

export interface CrmEvent {
  id: string
  rep_id: string
  source: 'hubspot' | 'salesforce'
  event_type: CrmEventType
  deal_value: number
  deal_stage: string | null
  payload: Record<string, unknown>
  occurred_at: string
  created_at: string
}

export interface DailySummary {
  id: string
  rep_id: string
  date: string
  total_active_seconds: number
  total_keystrokes: number
  by_category: Record<ActivityCategory, number>
  by_domain: Record<string, number>
  meetings_booked: number
  deals_created: number
  pipeline_value: number
}

// Live View - Real-time rep status
export interface RepStatus {
  rep_id: string
  current_domain: string | null
  current_category: string | null
  status: 'online' | 'passive' | 'offline'
  keystrokes_last_min: number
  last_keystroke_at: string | null
  last_click_at: string | null
  untrusted_clicks_last_min: number
  held_key_events_last_min: number
  held_mouse_events_last_min: number
  today_active_seconds: number
  today_keystrokes: number
  today_meetings: number
  last_heartbeat_at: string | null
  updated_at: string
}

export interface RepWithStatus extends Rep {
  status: RepStatus | null
}

export interface LiveViewData {
  reps: RepWithStatus[]
  summary: {
    online: number
    passive: number
    offline: number
    total_active_seconds: number
    flagged_count: number
  }
}

// Enums and constants
export type ActivityCategory = 
  | 'crm'
  | 'email'
  | 'calendar'
  | 'linkedin'
  | 'docs'
  | 'slack'
  | 'other'

export type CrmEventType = 
  | 'meeting_booked'
  | 'deal_created'
  | 'deal_moved'
  | 'deal_won'
  | 'deal_lost'
  | 'email_sent'
  | 'call_logged'

export const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  crm: '#10B981',      // emerald-500
  email: '#3B82F6',    // blue-500
  calendar: '#8B5CF6', // violet-500
  linkedin: '#0A66C2', // linkedin blue
  docs: '#F59E0B',     // amber-500
  slack: '#E11D48',    // rose-600
  other: '#6B7280',    // gray-500
}

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  crm: 'CRM',
  email: 'Email',
  calendar: 'Calendar',
  linkedin: 'LinkedIn',
  docs: 'Docs',
  slack: 'Slack',
  other: 'Other',
}

// Dashboard data types
export interface ProductivityTeamData {
  reps: Array<{
    id: string
    name: string
    total_active_hours: number
    by_category: Record<ActivityCategory, number>
    trend: number // percent change from previous period
  }>
  period: DatePeriod
}

export interface ProductivityIndividualData {
  rep: Rep
  daily_breakdown: Array<{
    date: string
    total_seconds: number
    by_category: Record<ActivityCategory, number>
    by_domain: Record<string, number>
  }>
  period: DatePeriod
}

export interface PerformanceTeamData {
  reps: Array<{
    id: string
    name: string
    meetings_booked: number
    deals_created: number
    pipeline_value: number
    conversion_rate: number
    trend: number
  }>
  totals: {
    meetings_booked: number
    deals_created: number
    pipeline_value: number
  }
  period: DatePeriod
}

export interface PerformanceIndividualData {
  rep: Rep
  daily_breakdown: Array<{
    date: string
    meetings_booked: number
    deals_created: number
    pipeline_value: number
  }>
  activity_vs_deals: Array<{
    date: string
    active_hours: number
    deals_created: number
  }>
  period: DatePeriod
}

export interface ConversionTeamData {
  reps: Array<{
    id: string
    name: string
    active_hours: number
    deals_created: number
    conversion_rate: number // deals per active hour
  }>
  period: DatePeriod
}

export interface ConversionIndividualData {
  rep: Rep
  funnel: Array<{
    stage: string
    count: number
    value: number
  }>
  stage_times: Array<{
    stage: string
    avg_days: number
  }>
  period: DatePeriod
}

export type DatePeriod = {
  start: string
  end: string
  label: string
}

// Scorecard types
export interface ScorecardData {
  repId: string
  name: string
  scores: Array<{
    date: string
    score: number
    components: {
      activeScore: number
      prospectingScore: number
      focusScore: number
      keystrokeScore: number
    }
  }>
}

export interface CoachingFlagData {
  repId: string
  name: string
  flags: Array<{
    type: string
    severity: 'red' | 'amber' | 'green'
    description: string
    sparklineData?: number[]
  }>
}

export interface ComparisonData {
  repA: {
    id: string
    name: string
    stats: Record<string, number>
  }
  repB: {
    id: string
    name: string
    stats: Record<string, number>
  }
  differences: Record<string, { pct: number; winner: 'A' | 'B' | 'equal' }>
  dailyScores: Array<{
    date: string
    scoreA: number
    scoreB: number
  }>
}

export interface HeatmapData {
  repId: string
  name: string
  grid: Array<{
    day: number // 0-6 Mon-Sun
    hour: number // 8-20
    seconds: number
  }>
  insights: {
    peakHour: string
    quietestPeriod: string
    mostConsistent: string
  }
}

// API request/response types
export interface ExtensionEventPayload {
  events: Array<{
    domain: string
    focus_seconds: number
    keystrokes: number
    recorded_at: string
  }>
}

export interface HubSpotWebhookPayload {
  subscriptionType: string
  objectId: string
  propertyName?: string
  propertyValue?: string
  changeSource?: string
  portalId: number
  objectType: string
}

// Component prop types
export interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
}

export interface PeriodSelectorProps {
  value: string
  onChange: (value: string) => void
}

export interface RepListItemProps {
  rep: Rep
  isActive: boolean
  onClick: () => void
}
