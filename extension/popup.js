// Kevi.io Chrome Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const setupView = document.getElementById('setupView')
  const activeView = document.getElementById('activeView')
  const statusText = document.getElementById('statusText')
  const tokenInput = document.getElementById('token')
  const activateBtn = document.getElementById('activateBtn')
  const deactivateBtn = document.getElementById('deactivateBtn')

  // Check current status
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response.isActive) {
      setupView.style.display = 'none'
      activeView.style.display = 'block'
      statusText.textContent = 'Active ✓'
      statusText.parentElement.parentElement.classList.remove('inactive')
    } else {
      setupView.style.display = 'block'
      activeView.style.display = 'none'
      statusText.textContent = 'Inactive'
      statusText.parentElement.parentElement.classList.add('inactive')
    }
  })

  // Activate button
  activateBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim()
    
    if (!token) {
      alert('Please paste your extension token')
      return
    }

    chrome.runtime.sendMessage(
      { action: 'setToken', token },
      (response) => {
        if (response.success) {
          setupView.style.display = 'none'
          activeView.style.display = 'block'
          statusText.textContent = 'Active ✓'
          statusText.parentElement.parentElement.classList.remove('inactive')
        }
      }
    )
  })

  // Deactivate button
  deactivateBtn.addEventListener('click', () => {
    chrome.storage.sync.remove(['extensionToken'], () => {
      setupView.style.display = 'block'
      activeView.style.display = 'none'
      statusText.textContent = 'Inactive'
      statusText.parentElement.parentElement.classList.add('inactive')
      tokenInput.value = ''
    })
  })

  // Allow Enter key to activate
  tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      activateBtn.click()
    }
  })
})
