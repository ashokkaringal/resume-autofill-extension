// Popup script for Job Application Auto-Filler
document.addEventListener('DOMContentLoaded', function() {
  console.log('Job Application Auto-Filler: Popup loaded');
  
  // Get DOM elements
  const currentPageStatus = document.getElementById('current-page-status');
  const platformStatus = document.getElementById('platform-status');
  const formStatus = document.getElementById('form-status');
  const refreshButton = document.getElementById('refresh-status');
  const testButton = document.getElementById('test-extension');
  
  // Initialize popup
  updateStatus();
  
  // Add event listeners
  refreshButton.addEventListener('click', updateStatus);
  testButton.addEventListener('click', testExtension);
  
  // Update status when popup opens
  function updateStatus() {
    console.log('Job Application Auto-Filler: Updating popup status...');
    
    // Get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        const currentTab = tabs[0];
        
        // Update current page status
        if (currentTab.url) {
          try {
            const url = new URL(currentTab.url);
            currentPageStatus.textContent = url.hostname;
            currentPageStatus.className = 'status-value';
          } catch (error) {
            currentPageStatus.textContent = 'Invalid URL';
            currentPageStatus.className = 'status-value error';
          }
        } else {
          currentPageStatus.textContent = 'No URL';
          currentPageStatus.className = 'status-value error';
        }
        
        // Detect platform
        if (currentTab.url) {
          const platform = detectPlatform(currentTab.url);
          platformStatus.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
          
          if (platform !== 'unknown') {
            platformStatus.className = 'status-value success';
          } else {
            platformStatus.className = 'status-value error';
          }
        } else {
          platformStatus.textContent = 'Unknown';
          platformStatus.className = 'status-value error';
        }
        
        // Check form detection
        checkFormDetection(currentTab.id);
      }
    });
  }
  
  // Detect platform from URL
  function detectPlatform(url) {
    if (!url) return 'unknown';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('linkedin.com')) {
      if (urlLower.includes('jobs') || urlLower.includes('apply') || urlLower.includes('application') || 
          urlLower.includes('easy-apply') || urlLower.includes('job') || urlLower.includes('careers')) {
        return 'linkedin';
      }
      if (urlLower.includes('linkedin.com/jobs/view/') || urlLower.includes('linkedin.com/jobs/collections/')) {
        return 'linkedin';
      }
    }
    
    if (urlLower.includes('greenhouse.io') || urlLower.includes('boards.greenhouse.io') || urlLower.includes('app.greenhouse.io')) {
      return 'greenhouse';
    }
    
    if (urlLower.includes('workday.com') || urlLower.includes('myworkdayjobs.com')) {
      return 'workday';
    }
    
    if (urlLower.includes('lever.co') || urlLower.includes('jobs.lever.co')) {
      return 'lever';
    }
    
    if (urlLower.includes('bamboohr.com')) {
      return 'bamboohr';
    }
    
    if (urlLower.includes('icims.com')) {
      return 'icims';
    }
    
    if (urlLower.includes('apply') || urlLower.includes('application') || urlLower.includes('careers')) {
      return 'generic';
    }
    
    return 'unknown';
  }
  
  // Check if forms are detected on the page
  function checkFormDetection(tabId) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: function() {
        const forms = document.querySelectorAll('form, input, textarea, select');
        const formCount = forms.length;
        
        if (formCount > 0) {
          return { detected: true, count: formCount };
        } else {
          return { detected: false, count: 0 };
        }
      }
    }, function(results) {
      if (chrome.runtime.lastError) {
        formStatus.textContent = 'Error checking';
        formStatus.className = 'status-value error';
        return;
      }
      
      if (results && results[0] && results[0].result) {
        const result = results[0].result;
        if (result.detected) {
          formStatus.textContent = `${result.count} fields found`;
          formStatus.className = 'status-value success';
        } else {
          formStatus.textContent = 'No forms detected';
          formStatus.className = 'status-value error';
        }
      } else {
        formStatus.textContent = 'Unknown';
        formStatus.className = 'status-value error';
      }
    });
  }
  
  // Test extension functionality
  function testExtension() {
    console.log('Job Application Auto-Filler: Testing extension...');
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        const currentTab = tabs[0];
        
        // Test if content script is working
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: function() {
            // Check if the extension is initialized
            if (window.jobFormFillerInitialized) {
              return { status: 'success', message: 'Extension is working on this page' };
            } else {
              return { status: 'error', message: 'Extension not initialized on this page' };
            }
          }
        }, function(results) {
          if (chrome.runtime.lastError) {
            alert('Error testing extension: ' + chrome.runtime.lastError.message);
            return;
          }
          
          if (results && results[0] && results[0].result) {
            const result = results[0].result;
            if (result.status === 'success') {
              alert('✅ ' + result.message);
            } else {
              alert('❌ ' + result.message);
            }
          } else {
            alert('❌ Unable to test extension');
          }
        });
      }
    });
  }
});
