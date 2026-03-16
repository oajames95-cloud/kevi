// KEVI utility functions

export function fmtTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Alias for backward compatibility
export const formatDuration = fmtTime

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency: 'GBP', 
    maximumFractionDigits: 0 
  }).format(n)
}

// Alias used by dashboard pages
export const formatCurrency = fmtCurrency

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

// Alias used by API routes
export const categorizeDomain = categorise

// Productivity bucket config
export const BUCKETS: Record<string, { 
  label: string
  color: string
  tailwind: string
  light: string
  text: string 
}> = {
  prospecting: { 
    label: 'Prospecting',  
    color: '#10b981', 
    tailwind: 'bg-emerald-500', 
    light: 'bg-emerald-50',  
    text: 'text-emerald-700' 
  },
  outreach: { 
    label: 'Outreach',     
    color: '#8b5cf6', 
    tailwind: 'bg-violet-400',  
    light: 'bg-violet-50',   
    text: 'text-violet-700'  
  },
  crm: { 
    label: 'CRM admin',    
    color: '#3b82f6', 
    tailwind: 'bg-blue-400',    
    light: 'bg-blue-50',     
    text: 'text-blue-700'    
  },
  meetings: { 
    label: 'Meetings',     
    color: '#f472b6', 
    tailwind: 'bg-pink-400',    
    light: 'bg-pink-50',     
    text: 'text-pink-700'    
  },
  comms: { 
    label: 'Internal',     
    color: '#fb923c', 
    tailwind: 'bg-orange-400',  
    light: 'bg-orange-50',   
    text: 'text-orange-700'  
  },
  downtime: { 
    label: 'Downtime',     
    color: '#d1d5db', 
    tailwind: 'bg-gray-300',    
    light: 'bg-gray-50',     
    text: 'text-gray-500'    
  },
}

// Score: how closely does time distribution match ideal weights
const IDEAL_WEIGHTS: Record<string, number> = {
  prospecting: 0.35, 
  outreach: 0.25, 
  crm: 0.15, 
  meetings: 0.15, 
  comms: 0.05
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

// Automation proxy: low keys/min in prospecting = sequences running
export function automationPct(prospectingSecs: number, prospectingKeys: number): number {
  if (!prospectingSecs) return 0
  const keysPerMin = (prospectingKeys / prospectingSecs) * 60
  return Math.max(0, Math.round(100 - Math.min(keysPerMin / 2, 100)))
}

// Generate plain-English coaching flags
export function coachingFlags(
  byCategory: Record<string, { seconds: number; keystrokes: number }>,
  totalSecs: number,
  meetings: number,
  prevWeekDowntimePct?: number
): string[] {
  const flags: string[] = []
  const prospectingPct = ((byCategory.prospecting?.seconds ?? 0) / (totalSecs || 1)) * 100
  const downtimePct = ((byCategory.downtime?.seconds ?? 0) / (totalSecs || 1)) * 100
  const ap = automationPct(byCategory.prospecting?.seconds ?? 0, byCategory.prospecting?.keystrokes ?? 0)

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

// Period helper
export const PERIOD_DAYS: Record<string, number> = { 
  '1d': 1, 
  '7d': 7, 
  '30d': 30, 
  '180d': 180 
}

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

// Format relative time ago (e.g., "5m ago", "2h ago")
export function formatTimeAgo(date: string | Date | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return then.toLocaleDateString()
}
