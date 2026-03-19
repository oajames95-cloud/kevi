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
// Uses substring matching so subdomains and regional variants are caught automatically

const CATEGORY_RULES: Array<{ pattern: string; category: string }> = [

  // ── Prospecting tools ──────────────────────────────────────────────────────
  { pattern: 'apollo.io',           category: 'prospecting' },
  { pattern: 'app.apollo',          category: 'prospecting' },
  { pattern: 'salesnav',            category: 'prospecting' },
  { pattern: 'sales-nav',           category: 'prospecting' },
  { pattern: 'seamless.ai',         category: 'prospecting' },
  { pattern: 'zoominfo',            category: 'prospecting' },
  { pattern: 'lusha',               category: 'prospecting' },
  { pattern: 'hunter.io',           category: 'prospecting' },
  { pattern: 'clearbit',            category: 'prospecting' },
  { pattern: 'cognism',             category: 'prospecting' },
  { pattern: 'leadiq',              category: 'prospecting' },
  { pattern: 'uplead',              category: 'prospecting' },
  { pattern: 'snovio',              category: 'prospecting' },
  { pattern: 'rocketreach',         category: 'prospecting' },
  { pattern: 'contactout',          category: 'prospecting' },
  { pattern: 'getprospect',         category: 'prospecting' },
  { pattern: 'findthatlead',        category: 'prospecting' },
  { pattern: 'snov.io',             category: 'prospecting' },
  { pattern: 'reply.io',            category: 'prospecting' },
  { pattern: 'outreach.io',         category: 'prospecting' },
  { pattern: 'salesloft',           category: 'prospecting' },
  { pattern: 'yesware',             category: 'prospecting' },
  { pattern: 'groove.co',           category: 'prospecting' },
  { pattern: 'mixmax',              category: 'prospecting' },
  { pattern: 'mailshake',           category: 'prospecting' },
  { pattern: 'lemlist',             category: 'prospecting' },
  { pattern: 'woodpecker',          category: 'prospecting' },
  { pattern: 'klenty',              category: 'prospecting' },
  { pattern: 'overloop',            category: 'prospecting' },
  { pattern: 'waalaxy',             category: 'prospecting' },
  { pattern: 'dux-soup',            category: 'prospecting' },
  { pattern: 'phantombuster',       category: 'prospecting' },
  { pattern: 'expandi',             category: 'prospecting' },
  { pattern: 'sales.rocks',         category: 'prospecting' },
  { pattern: 'crunchbase',          category: 'prospecting' },
  { pattern: 'angellist',           category: 'prospecting' },
  { pattern: 'builtwith',           category: 'prospecting' },
  { pattern: 'similarweb',          category: 'prospecting' },
  { pattern: 'companieshouse',      category: 'prospecting' },
  { pattern: 'companies-house',     category: 'prospecting' },
  { pattern: 'g2.com',              category: 'prospecting' },
  { pattern: 'capterra',            category: 'prospecting' },
  { pattern: 'trustpilot',          category: 'prospecting' },
  { pattern: 'glassdoor',           category: 'prospecting' },

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  { pattern: 'linkedin.com',        category: 'outreach' },
  { pattern: 'lnkd.in',            category: 'outreach' },

  // ── Email ──────────────────────────────────────────────────────────────────
  { pattern: 'mail.google',         category: 'outreach' },
  { pattern: 'gmail',               category: 'outreach' },
  { pattern: 'outlook.live',        category: 'outreach' },
  { pattern: 'outlook.office',      category: 'outreach' },
  { pattern: 'office365',           category: 'outreach' },
  { pattern: 'mail.yahoo',          category: 'outreach' },
  { pattern: 'fastmail',            category: 'outreach' },
  { pattern: 'superhuman',          category: 'outreach' },
  { pattern: 'front.app',           category: 'outreach' },
  { pattern: 'missiveapp',          category: 'outreach' },
  { pattern: 'hey.com',             category: 'outreach' },

  // ── CRM ────────────────────────────────────────────────────────────────────
  { pattern: 'hubspot',             category: 'crm' },
  { pattern: 'salesforce',          category: 'crm' },
  { pattern: 'lightning.force',     category: 'crm' },
  { pattern: 'pipedrive',           category: 'crm' },
  { pattern: 'close.com',           category: 'crm' },
  { pattern: 'closecrm',            category: 'crm' },
  { pattern: 'zoho.com/crm',        category: 'crm' },
  { pattern: 'monday.com',          category: 'crm' },
  { pattern: 'attio',               category: 'crm' },
  { pattern: 'copper',              category: 'crm' },
  { pattern: 'nutshell',            category: 'crm' },
  { pattern: 'freshsales',          category: 'crm' },
  { pattern: 'streak',              category: 'crm' },

  // ── Meetings ───────────────────────────────────────────────────────────────
  { pattern: 'zoom.us',             category: 'meetings' },
  { pattern: 'meet.google',         category: 'meetings' },
  { pattern: 'calendar.google',     category: 'meetings' },
  { pattern: 'teams.microsoft',     category: 'meetings' },
  { pattern: 'calendly',            category: 'meetings' },
  { pattern: 'chilipiper',          category: 'meetings' },
  { pattern: 'savvycal',            category: 'meetings' },
  { pattern: 'cal.com',             category: 'meetings' },
  { pattern: 'webex',               category: 'meetings' },
  { pattern: 'gotomeeting',         category: 'meetings' },
  { pattern: 'whereby',             category: 'meetings' },
  { pattern: 'around.co',           category: 'meetings' },

  // ── Internal comms ─────────────────────────────────────────────────────────
  { pattern: 'slack.com',           category: 'comms' },
  { pattern: 'discord',             category: 'comms' },
  { pattern: 'web.whatsapp',        category: 'comms' },
  { pattern: 'telegram',            category: 'comms' },
  { pattern: 'intercom',            category: 'comms' },
  { pattern: 'loom',                category: 'comms' },
  { pattern: 'notion.so',           category: 'comms' },
  { pattern: 'confluence',          category: 'comms' },
  { pattern: 'basecamp',            category: 'comms' },
]

const TITLE_RULES: Array<{ pattern: string; category: string }> = [
  { pattern: 'inbox',         category: 'outreach' },
  { pattern: 'compose',       category: 'outreach' },
  { pattern: 'sequences',     category: 'prospecting' },
  { pattern: 'prospects',     category: 'prospecting' },
  { pattern: 'people search', category: 'prospecting' },
  { pattern: 'sales nav',     category: 'prospecting' },
  { pattern: 'pipeline',      category: 'crm' },
  { pattern: 'deal',          category: 'crm' },
  { pattern: 'contact',       category: 'crm' },
  { pattern: 'meeting',       category: 'meetings' },
  { pattern: 'calendar',      category: 'meetings' },
  { pattern: 'schedule',      category: 'meetings' },
]

export function categorise(domain: string, pageTitle?: string | null): string {
  const d = (domain ?? '').toLowerCase()
  const t = (pageTitle ?? '').toLowerCase()

  for (const rule of CATEGORY_RULES) {
    if (d.includes(rule.pattern)) return rule.category
  }

  if (t) {
    for (const rule of TITLE_RULES) {
      if (t.includes(rule.pattern)) return rule.category
    }
  }

  return 'downtime'
}

export const categorizeDomain = (domain: string, pageTitle?: string | null) =>
  categorise(domain, pageTitle)

// Keep old DOMAIN_CATEGORIES for any legacy references
export const DOMAIN_CATEGORIES: Record<string, string> = {
  'app.apollo.io': 'prospecting',
  'apollo.io': 'prospecting',
  'linkedin.com': 'outreach',
  'mail.google.com': 'outreach',
  'outlook.live.com': 'outreach',
  'outlook.office.com': 'outreach',
  'app.hubspot.com': 'crm',
  'salesforce.com': 'crm',
  'zoom.us': 'meetings',
  'meet.google.com': 'meetings',
  'slack.com': 'comms',
  'teams.microsoft.com': 'comms',
}

// ─── Period date helpers ──────────────────────────────────────────────────────

export type Period = '1d' | '7d' | '30d' | '180d'

export function getPeriodDates(period: Period | string): { since: string; label: string } {
  const days: Record<string, number> = {
    '1d': 1, '7d': 7, '30d': 30, '180d': 180,
  }
  const labels: Record<string, string> = {
    '1d': 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days', '180d': 'Last 6 months',
  }
  const since = new Date(Date.now() - (days[period] ?? 7) * 86400000).toISOString()
  return { since, label: labels[period] ?? 'Last 7 days' }
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
  outreach:    { label: 'Outreach',    color: '#8b5cf6', tailwind: 'bg-violet-400',  light: 'bg-violet-50',  text: 'text-violet-700' },
  crm:         { label: 'CRM admin',   color: '#3b82f6', tailwind: 'bg-blue-400',    light: 'bg-blue-50',    text: 'text-blue-700' },
  meetings:    { label: 'Meetings',    color: '#f472b6', tailwind: 'bg-pink-400',    light: 'bg-pink-50',    text: 'text-pink-700' },
  comms:       { label: 'Internal',    color: '#fb923c', tailwind: 'bg-orange-400',  light: 'bg-orange-50',  text: 'text-orange-700' },
  downtime:    { label: 'Downtime',    color: '#d1d5db', tailwind: 'bg-gray-300',    light: 'bg-gray-50',    text: 'text-gray-500' },
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

// ─── Daily scorecard calculation ──────────────────────────────────────────────

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
  const activeScore     = Math.min(totalActiveSecs / 21600, 1) * 100
  const prospectScore   = totalActiveSecs > 0 ? Math.min((prospectingSecs / totalActiveSecs) / 0.35, 1) * 100 : 0
  const focusScore      = Math.min(longestBlockMins / 45, 1) * 100
  const intensityScore  = Math.min(keystrokesPerHour / 800, 1) * 100

  return {
    score: Math.round(activeScore * 0.35 + prospectScore * 0.25 + focusScore * 0.2 + intensityScore * 0.2),
    components: {
      activeScore:      Math.round(activeScore),
      prospectingScore: Math.round(prospectScore),
      focusScore:       Math.round(focusScore),
      keystrokeScore:   Math.round(intensityScore),
    },
  }
}

// ─── Flag detection ───────────────────────────────────────────────────────────

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

  if (lastWeek.totalSecs > 0 && thisWeek.totalSecs / lastWeek.totalSecs < 0.6) {
    flags.push({
      type: 'ACTIVITY_CLIFF',
      severity: 'red',
      description: `Active time dropped ${Math.round((1 - thisWeek.totalSecs / lastWeek.totalSecs) * 100)}% vs last week`,
    })
  }

  const salesToolPct = (thisWeek.prospectingSecs + thisWeek.outreachSecs) / (thisWeek.totalSecs || 1)
  if (salesToolPct < 0.1) {
    flags.push({
      type: 'WRONG_TOOLS',
      severity: 'red',
      description: `Only ${Math.round(salesToolPct * 100)}% of time in prospecting/outreach tools`,
    })
  }

  const keysPerMin = thisWeek.totalKeystrokes / ((thisWeek.totalSecs || 1) / 60)
  if (keysPerMin < 3 && thisWeek.totalSecs > 7200) {
    flags.push({
      type: 'PASSIVE_BROWSING',
      severity: 'red',
      description: `Active ${fmtTime(thisWeek.totalSecs)} but only ${Math.round(keysPerMin)} keystrokes/min — passive browsing`,
    })
  }

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
