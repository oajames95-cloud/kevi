// ─── Domain categorisation ────────────────────────────────────────────────────
// Uses substring matching so subdomains and regional variants are caught automatically
// e.g. 'linkedin.com' matches 'www.linkedin.com', 'uk.linkedin.com', 'lnkd.in' etc.

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
  { pattern: 'similarweb',         category: 'prospecting' },
  { pattern: 'companies house',     category: 'prospecting' },
  { pattern: 'companieshouse',      category: 'prospecting' },

  // ── LinkedIn — must come before generic social rules ───────────────────────
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
  { pattern: 'chili',               category: 'meetings' },
  { pattern: 'chilipiper',          category: 'meetings' },
  { pattern: 'savvycal',            category: 'meetings' },
  { pattern: 'cal.com',             category: 'meetings' },
  { pattern: 'hubspot/meetings',    category: 'meetings' },
  { pattern: 'webex',               category: 'meetings' },
  { pattern: 'gotomeeting',         category: 'meetings' },
  { pattern: 'whereby',             category: 'meetings' },
  { pattern: 'around.co',           category: 'meetings' },

  // ── Internal comms ─────────────────────────────────────────────────────────
  { pattern: 'slack.com',           category: 'comms' },
  { pattern: 'teams.microsoft',     category: 'comms' },
  { pattern: 'discord',             category: 'comms' },
  { pattern: 'web.whatsapp',        category: 'comms' },
  { pattern: 'telegram',            category: 'comms' },
  { pattern: 'intercom',            category: 'comms' },
  { pattern: 'loom',                category: 'comms' },
  { pattern: 'notion.so',           category: 'comms' },
  { pattern: 'confluence',          category: 'comms' },
  { pattern: 'basecamp',            category: 'comms' },

  // ── Research (counts as productive — understanding prospects) ─────────────
  { pattern: 'g2.com',              category: 'prospecting' },
  { pattern: 'capterra',            category: 'prospecting' },
  { pattern: 'trustpilot',          category: 'prospecting' },
  { pattern: 'glassdoor',           category: 'prospecting' },
  { pattern: 'companies-house',     category: 'prospecting' },

  // ── Downtime — explicitly non-work (anything not matched above) ────────────
  // These are here to be explicit — the fallthrough catch-all handles everything else
]

// Keyword patterns for page-title based categorisation
// Used when domain alone is ambiguous
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

  // Match domain against rules (substring match — catches subdomains automatically)
  for (const rule of CATEGORY_RULES) {
    if (d.includes(rule.pattern)) return rule.category
  }

  // If domain didn't match, try page title for common patterns
  if (t) {
    for (const rule of TITLE_RULES) {
      if (t.includes(rule.pattern)) return rule.category
    }
  }

  return 'downtime'
}

// Alias for API routes that use the old name
export const categorizeDomain = (domain: string, pageTitle?: string | null) =>
  categorise(domain, pageTitle)
