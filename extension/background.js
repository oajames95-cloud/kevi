// Kevi.io Chrome Extension - Background Service Worker
// Manages activity tracking, heartbeats, and automation detection

const HEARTBEAT_INTERVAL = 10000; // Send heartbeat every 10 seconds
const SYNC_INTERVAL = 60000; // Sync activity every 60 seconds
const API_BASE = ''; // Will be configured via popup

// Real-time tracking state
let extensionToken = '';
let currentDomain = '';
let currentCategory = '';
let focusStartTime = 0;

// Per-minute counters (reset each heartbeat)
let keystrokesLastMin = 0;
let lastKeystrokeAt = null;
let lastClickAt = null;
let untrustedClicksLastMin = 0;
let heldKeyEventsLastMin = 0;
let heldMouseEventsLastMin = 0;

// Today's rolling totals
let todayActiveSeconds = 0;
let todayKeystrokes = 0;
let todayMeetings = 0;

// Activity buffer for bulk sync
const activityBuffer = new Map();

// Initialize
chrome.storage.sync.get(['extensionToken', 'apiBase'], (stored) => {
  extensionToken = stored.extensionToken || '';
  if (extensionToken) {
    startTracking();
  }
});

function startTracking() {
  // Tab change listener
  chrome.tabs.onActivated.addListener(handleTabChange);
  chrome.webNavigation.onCommitted.addListener(handleNavigation);
  
  // Heartbeat interval
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  
  // Activity sync interval
  setInterval(syncActivityData, SYNC_INTERVAL);
}

function handleTabChange() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        
        if (domain !== currentDomain) {
          recordActivity(currentDomain);
          currentDomain = domain;
          currentCategory = categorizeUrl(domain);
          focusStartTime = Date.now();
        }
      } catch (e) {
        // Invalid URL
      }
    }
  });
}

function handleNavigation() {
  focusStartTime = Date.now();
}

function categorizeUrl(url) {
  const urlStr = url.toLowerCase();
  
  if (urlStr.includes('salesforce') || urlStr.includes('hubspot') || urlStr.includes('pipedrive')) return 'crm';
  if (urlStr.includes('gmail') || urlStr.includes('outlook') || urlStr.includes('mail')) return 'email';
  if (urlStr.includes('calendar') || urlStr.includes('calendly')) return 'calendar';
  if (urlStr.includes('linkedin')) return 'linkedin';
  if (urlStr.includes('docs.google') || urlStr.includes('notion') || urlStr.includes('confluence')) return 'docs';
  if (urlStr.includes('slack') || urlStr.includes('teams')) return 'slack';
  if (urlStr.includes('zoom') || urlStr.includes('meet.google')) return 'meeting';
  
  return 'other';
}

function recordActivity(domain) {
  if (!domain) return;
  
  const focusSeconds = Math.floor((Date.now() - focusStartTime) / 1000);
  if (focusSeconds < 1) return;
  
  const key = `${domain}-${new Date().toISOString().split('T')[0]}`;
  const existing = activityBuffer.get(key) || { domain, category: categorizeUrl(domain), focus_seconds: 0, keystrokes: 0 };
  
  existing.focus_seconds += focusSeconds;
  existing.keystrokes += keystrokesLastMin;
  existing.recorded_at = new Date().toISOString();
  
  activityBuffer.set(key, existing);
  
  // Update today's totals
  todayActiveSeconds += focusSeconds;
}

async function sendHeartbeat() {
  if (!extensionToken) return;
  
  try {
    const response = await fetch(`${getApiBase()}/api/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${extensionToken}`,
      },
      body: JSON.stringify({
        current_domain: currentDomain,
        current_category: currentCategory,
        keystrokes_last_min: keystrokesLastMin,
        last_keystroke_at: lastKeystrokeAt,
        last_click_at: lastClickAt,
        untrusted_clicks_last_min: untrustedClicksLastMin,
        held_key_events_last_min: heldKeyEventsLastMin,
        held_mouse_events_last_min: heldMouseEventsLastMin,
        today_active_seconds: todayActiveSeconds,
        today_keystrokes: todayKeystrokes,
        today_meetings: todayMeetings,
      }),
    });
    
    if (response.ok) {
      // Reset per-minute counters
      keystrokesLastMin = 0;
      untrustedClicksLastMin = 0;
      heldKeyEventsLastMin = 0;
      heldMouseEventsLastMin = 0;
    }
  } catch (error) {
    console.error('[Kevi] Heartbeat failed:', error);
  }
}

async function syncActivityData() {
  if (!extensionToken || activityBuffer.size === 0) return;
  
  try {
    const activities = Array.from(activityBuffer.values());
    
    const response = await fetch(`${getApiBase()}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${extensionToken}`,
      },
      body: JSON.stringify({ activities }),
    });
    
    if (response.ok) {
      activityBuffer.clear();
    }
  } catch (error) {
    console.error('[Kevi] Sync failed:', error);
  }
}

function getApiBase() {
  // In production, use the actual domain
  return 'https://kevi.io';
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'setToken':
      extensionToken = message.token;
      chrome.storage.sync.set({ extensionToken: message.token });
      startTracking();
      sendResponse({ success: true });
      break;
      
    case 'getStatus':
      sendResponse({ 
        isActive: !!extensionToken,
        currentDomain,
        todayKeystrokes,
        todayActiveSeconds
      });
      break;
      
    case 'keystroke':
      keystrokesLastMin++;
      todayKeystrokes++;
      lastKeystrokeAt = new Date().toISOString();
      if (message.isHeldKey) {
        heldKeyEventsLastMin++;
      }
      break;
      
    case 'click':
      lastClickAt = new Date().toISOString();
      if (!message.isTrusted) {
        untrustedClicksLastMin++;
      }
      break;
      
    case 'heldMouse':
      heldMouseEventsLastMin++;
      break;
  }
  
  return true; // Keep channel open for async response
});
