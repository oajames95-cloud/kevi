// Kevi.io Chrome Extension - Content Script
// Runs on every page to capture input events with automation detection

let lastKeyUpTime = 0;
let heldKeyStart = null;

// Track keydown with held-key detection
document.addEventListener('keydown', (e) => {
  const now = Date.now();
  
  // Detect held keys (repeat without keyup)
  const isHeldKey = e.repeat || (heldKeyStart && now - heldKeyStart > 500);
  
  if (!heldKeyStart) {
    heldKeyStart = now;
  }
  
  chrome.runtime.sendMessage({ 
    action: 'keystroke',
    timestamp: now,
    isHeldKey
  });
}, true);

document.addEventListener('keyup', () => {
  lastKeyUpTime = Date.now();
  heldKeyStart = null;
}, true);

// Track clicks with isTrusted detection
let mouseDownTime = null;

document.addEventListener('mousedown', (e) => {
  mouseDownTime = Date.now();
  
  chrome.runtime.sendMessage({
    action: 'click',
    timestamp: mouseDownTime,
    isTrusted: e.isTrusted
  });
}, true);

document.addEventListener('mouseup', () => {
  if (mouseDownTime) {
    const holdDuration = Date.now() - mouseDownTime;
    if (holdDuration > 500) {
      chrome.runtime.sendMessage({
        action: 'heldMouse',
        duration: holdDuration
      });
    }
  }
  mouseDownTime = null;
}, true);
