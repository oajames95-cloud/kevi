// ─── Time formatting ──────────────────────────────────────────────────────────

export function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const formatDuration = fmtTime

// ─── Currency formatting ──────────────────────────────────────────────────────

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n)
}

export const formatCurrency = fmtCurrency

// ─── Domain categorisation ────────────────────────────────────────────────────

export const DOMAIN_CATEGORIES: Record<string, string> = {
  'app.apollo.io': 'prospecting',
  'apollo.io': 'prospecting',
  'salesnav.linkedin.com': 'prospecting',
  'linkedin.com': 'outreach',
  'mail.google.com': 'outreach',
  'outlook.live.com': 'outreach',
  'outlook.office.com': 'outreach',
  'app.hubspot.com': 'crm',
  'salesforce.com': 'crm',
  'lightning.force.com': 'crm',
  'zoom.us': 'meetings',
  'meet.google.com': 'meetings',
  'calendar.google.com': 'meetings',
  'slack.com': 'comms',
  'teams.microsoft.com': 'comms',
}

export function categorise(domain: string): string {
  for (const [key, cat] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domain.includes(key)) return cat
  }
  return 'downtime'
}

export const categorizeDomain = categorise

// ─── Period date helpers ──────────────────────────────────────────────────────

export type Period = '1d' | '7d' | '30d' | '180d'

export function getPeriodDates(period: Period): { since: string; label: string } {
  const days: Record<Period, number> = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '180d': 180,
  }
  const labels: Record<Period, string> = {
    '1d': 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '180d': 'Last 6 months',
  }
  const since = new Date(Date.now() - days[period] * 86400000).toISOString()
  return { since, label: labels[period] }
}

// ─── Productivity score ───────────────────────────────────────────────────────

const IDEAL_WEIGHTS: Record<string, number> = {
  prospecting: 0.35,
  outreach: 0.25,
  crm: 0.15,
  meetings: 0.15,
  comms: 0.05,
}

export function calcProductivityScore(
  byCategory: Record<string, { seconds: number }>,
  totalSecs: number
): number {
  if (!totalSecs) return 0
  let score = 0
  for (const [cat, weight] of Object.entries(IDEAL_WEIGHTS)) {
    const actual = (byCategory[cat]?.seconds ?? 0) / totalSecs
    score += Math.min(actual / weight, 1) * weight
  }
  return Math.round(score * 100)
}

// ─── Automation signal ────────────────────────────────────────────────────────

export function automationPct(prospectingSecs: number, prospectingKeys: number): number {
  if (!prospectingSecs) return 0
  const keysPerMin = (prospectingKeys / prospectingSecs) * 60
  return Math.max(0, Math.round(100 - Math.min(keysPerMin / 2, 100)))
}

// ─── Coaching flags ───────────────────────────────────────────────────────────

export function coachingFlags(
  byCategory: Record<string, { seconds: number; keystrokes: number }>,
  totalSecs: number,
  meetings: number,
  prevWeekDowntimePct?: number
): string[] {
  const flags: string[] = []
  const prospectingPct = ((byCategory.prospecting?.seconds ?? 0) / (totalSecs || 1)) * 100
  const downtimePct = ((byCategory.downtime?.seconds ?? 0) / (totalSecs || 1)) * 100
  const ap = automationPct(
    byCategory.prospecting?.seconds ?? 0,
    byCategory.prospecting?.keystrokes ?? 0
  )
  if (prospectingPct > 30 && meetings === 0)
    flags.push('High Apollo time but no meetings booked — review sequence quality or targeting.')
  if (ap < 30)
    flags.push('High keystroke rate in Apollo suggests mostly manual outreach — consider building sequences.')
  if (downtimePct > 30)
    flags.push('Over 30% of active time is unclassified — check if key tools are being tracked.')
  if (prevWeekDowntimePct !== undefined && downtimePct > prevWeekDowntimePct * 1.4)
    flags.push('Downtime up 40%+ vs last week — worth a check-in.')
  if ((byCategory.outreach?.seconds ?? 0) > 0 && meetings === 0)
    flags.push('Strong email/LinkedIn time but zero meetings — response rate may need attention.')
  return flags
}

// ─── Bucket display config ────────────────────────────────────────────────────

export const BUCKETS: Record<string, {
  label: string
  color: string
  tailwind: string
  light: string
  text: string
}> = {
  prospecting: { label: 'Prospecting', color: '#10b981', tailwind: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700' },
  outreach: { label: 'Outreach', color: '#8b5cf6', tailwind: 'bg-violet-400', light: 'bg-violet-50', text: 'text-violet-700' },
  crm: { label: 'CRM admin', color: '#3b82f6', tailwind: 'bg-blue-400', light: 'bg-blue-50', text: 'text-blue-700' },
  meetings: { label: 'Meetings', color: '#f472b6', tailwind: 'bg-pink-400', light: 'bg-pink-50', text: 'text-pink-700' },
  comms: { label: 'Internal', color: '#fb923c', tailwind: 'bg-orange-400', light: 'bg-orange-50', text: 'text-orange-700' },
  downtime: { label: 'Downtime', color: '#d1d5db', tailwind: 'bg-gray-300', light: 'bg-gray-50', text: 'text-gray-500' },
}

export function formatTimeAgo(date: string | null): string {
  if (!date) return 'Never'
  const secs = Math.round((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

// ─── Focus blocks ─────────────────────────────────────────────────────────────

export interface FocusBlock {
  domain: string
  category: string
  startTime: string
  endTime: string
  durationSecs: number
}

export function calcFocusBlocks(events: any[]): FocusBlock[] {
  const blocks: FocusBlock[] = []
  if (!events.length) return blocks

  let current = { ...events[0], startTime: events[0].recorded_at }

  for (let i = 1; i < events.length; i++) {
    const e = events[i]
    const gapSecs = (new Date(e.recorded_at).getTime() - new Date(events[i - 1].recorded_at).getTime()) / 1000
    const domainChanged = e.domain !== current.domain

    if (domainChanged || gapSecs > 300) {
      blocks.push({
        domain: current.domain,
        category: current.category,
        startTime: current.startTime,
        endTime: events[i - 1].recorded_at,
        durationSecs: (new Date(events[i - 1].recorded_at).getTime() - new Date(current.startTime).getTime()) / 1000,
      })
      current = { ...e, startTime: e.recorded_at }
    }
  }

  // Don't forget the last block
  if (current) {
    blocks.push({
      domain: current.domain,
      category: current.category,
      startTime: current.startTime,
      endTime: events[events.length - 1].recorded_at,
      durationSecs: (new Date(events[events.length - 1].recorded_at).getTime() - new Date(current.startTime).getTime()) / 1000,
    })
  }

  return blocks
}

// ─── Daily scorecard calculation ───────────────────────────────────────────────

export interface ScorecardComponents {
  activeScore: number
  prospectingScore: number
  focusScore: number
  keystrokeScore: number
}

export function calcDailyScore(
  totalActiveSecs: number,
  prospectingSecs: number,
  longestBlockMins: number,
  keystrokesPerHour: number
): { score: number; components: ScorecardComponents } {
  const activeScore = Math.min(totalActiveSecs / 21600, 1) * 100
  const prospectScore = totalActiveSecs > 0 ? Math.min((prospectingSecs / totalActiveSecs) / 0.35, 1) * 100 : 0
  const focusScore = Math.min(longestBlockMins / 45, 1) * 100
  const intensityScore = Math.min(keystrokesPerHour / 800, 1) * 100

  return {
    score: Math.round(activeScore * 0.35 + prospectScore * 0.25 + focusScore * 0.2 + intensityScore * 0.2),
    components: {
      activeScore: Math.round(activeScore),
      prospectingScore: Math.round(prospectScore),
      focusScore: Math.round(focusScore),
      keystrokeScore: Math.round(intensityScore),
    },
  }
}

// ─── Coaching flags detection ──────────────────────────────────────────────────

export interface CoachingFlag {
  type: string
  severity: 'red' | 'amber' | 'green'
  description: string
}

export interface WeekStats {
  totalSecs: number
  prospectingSecs: number
  outreachSecs: number
  totalKeystrokes: number
}

export interface DayPattern {
  date: string
  firstActivityHour: number
}

export function detectFlags(
  thisWeek: WeekStats,
  lastWeek: WeekStats,
  dailyPatterns: DayPattern[]
): CoachingFlag[] {
  const flags: CoachingFlag[] = []

  // Activity cliff (Red)
  if (lastWeek.totalSecs > 0 && thisWeek.totalSecs / lastWeek.totalSecs < 0.6) {
    flags.push({
      type: 'ACTIVITY_CLIFF',
      severity: 'red',
      description: `Active time dropped ${Math.round((1 - thisWeek.totalSecs / lastWeek.totalSecs) * 100)}% vs last week`,
    })
  }

  // Wrong tools (Red)
  const salesToolPct = (thisWeek.prospectingSecs + thisWeek.outreachSecs) / (thisWeek.totalSecs || 1)
  if (salesToolPct < 0.1) {
    flags.push({
      type: 'WRONG_TOOLS',
      severity: 'red',
      description: `Only ${Math.round(salesToolPct * 100)}% of time in prospecting/outreach tools`,
    })
  }

  // Passive browsing (Red)
  const keysPerMin = thisWeek.totalKeystrokes / ((thisWeek.totalSecs || 1) / 60)
  if (keysPerMin < 3 && thisWeek.totalSecs > 7200) {
    flags.push({
      type: 'PASSIVE_BROWSING',
      severity: 'red',
      description: `Active ${fmtTime(thisWeek.totalSecs)} but only ${Math.round(keysPerMin)} keystrokes/min — passive browsing`,
    })
  }

  // Late starts (Amber)
  const lateStartDays = dailyPatterns.filter((d) => d.firstActivityHour > 10).length
  if (lateStartDays >= 3) {
    flags.push({
      type: 'LATE_STARTS',
      severity: 'amber',
      description: `Inactive before 10am on ${lateStartDays} of the last 5 working days`,
    })
  }

  return flags
}
