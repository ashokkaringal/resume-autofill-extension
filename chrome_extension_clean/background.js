// Background script for Job Application Auto-Filler
console.log('Job Application Auto-Filler: Background script loaded');

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action, 'from tab:', sender.tab.id);
  
  if (request.action === 'detectPlatform') {
    const platform = detectPlatform(sender.tab.url);
    console.log('Platform detected:', platform, 'for URL:', sender.tab.url);
    sendResponse({ platform: platform });
    return true;
  }
  
  if (request.action === 'getUserProfile') {
    console.log('getUserProfile action received');
    getUserProfile(sendResponse);
    return true;
  }
  
  if (request.action === 'forceInject') {
    console.log('Force inject requested for tab:', sender.tab.id);
    // Force inject content script even if already injected
    injectedTabs.delete(sender.tab.id);
    
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['content.js']
    }).then(() => {
      console.log(`Force injection successful for tab ${sender.tab.id}`);
      sendResponse({ success: true });
    }).catch((error) => {
      console.log(`Force injection failed for tab ${sender.tab.id}:`, error.message);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'manualInject') {
    console.log('Manual injection requested for tab:', sender.tab.id);
    // Manually inject content script for current tab
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['content.js']
    }).then(() => {
      console.log(`Manual injection successful for tab ${sender.tab.id}`);
      injectedTabs.add(sender.tab.id);
      sendResponse({ success: true });
    }).catch((error) => {
      console.log(`Manual injection failed for tab ${sender.tab.id}:`, error.message);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Initialize default profile
async function initializeDefaultProfile() {
  try {
    console.log('initializeDefaultProfile: Starting...');
    const result = await chrome.storage.local.get(['userProfile']);
    console.log('initializeDefaultProfile: Current storage state:', result.userProfile ? 'Profile exists' : 'No profile');
    
    if (!result.userProfile) {
      console.log('initializeDefaultProfile: No user profile found, loading default profile...');
      
      const response = await fetch(chrome.runtime.getURL('userProfile.json'));
      if (!response.ok) {
        throw new Error(`Failed to fetch default profile: ${response.status}`);
      }
      
      const defaultProfile = await response.json();
      console.log('initializeDefaultProfile: Default profile loaded, structure:', Object.keys(defaultProfile));
      
      await chrome.storage.local.set({ userProfile: defaultProfile });
      console.log('initializeDefaultProfile: Default profile saved to storage');
    } else {
      console.log('initializeDefaultProfile: User profile already exists in storage');
    }
  } catch (error) {
    console.error('initializeDefaultProfile: Error initializing default profile:', error);
    
    // Create a minimal fallback profile
    const fallbackProfile = {
      personalInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@email.com",
        phone: "+1-555-123-4567",
        address: "123 Main Street, City, State 12345"
      },
      demographics: {
        gender: "Male",
        ethnicity: "White",
        veteranStatus: "No",
        disabilityStatus: "No",
        race: "White"
      },
      experience: {
        pythonProjects: "Developed multiple web applications using Django and Flask.",
        cppBackground: "5+ years of C++ development experience.",
        teamManagement: "Led development teams of 5-15 engineers.",
        yearsOfExperience: "8",
        currentRole: "Senior Software Engineer",
        previousCompanies: "Tech Corp, Startup Inc, Big Company"
      },
      preferences: {
        workAuthorization: "US Citizen",
        sponsorshipNeeded: "No",
        relocationAssistance: "Yes",
        remoteWork: "Hybrid",
        salaryExpectation: "$120,000 - $150,000"
      },
      documents: {
        resumePath: "",
        coverLetterPath: "",
        portfolioUrl: "https://github.com/johndoe",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        website: "https://johndoe.dev"
      },
      skills: {
        programmingLanguages: ["Python", "C++", "JavaScript", "Java", "Go"],
        frameworks: ["Django", "Flask", "React", "Node.js", "Spring"],
        databases: ["PostgreSQL", "MongoDB", "Redis", "MySQL"],
        tools: ["Git", "Docker", "Kubernetes", "AWS", "Jenkins"]
      },
      education: {
        degree: "Bachelor of Science in Computer Science",
        university: "University of Technology",
        graduationYear: "2015",
        gpa: "3.8"
      }
    };
    
    try {
      await chrome.storage.local.set({ userProfile: fallbackProfile });
      console.log('initializeDefaultProfile: Fallback profile saved to storage');
    } catch (fallbackError) {
      console.error('initializeDefaultProfile: Error saving fallback profile:', fallbackError);
    }
  }
}

// Get user profile from storage
async function getUserProfile(sendResponse) {
  try {
    console.log('getUserProfile: Starting profile retrieval...');
    const result = await chrome.storage.local.get(['userProfile']);
    console.log('getUserProfile: Retrieved from storage:', result.userProfile ? 'Profile found' : 'No profile');
    console.log('getUserProfile: Storage result keys:', Object.keys(result));
    
    if (result.userProfile) {
      console.log('getUserProfile: Sending existing profile, structure:', Object.keys(result.userProfile));
      sendResponse({ userProfile: result.userProfile });
    } else {
      console.log('getUserProfile: No profile in storage, initializing default...');
      await initializeDefaultProfile();
      
      // Try to get the profile again
      const retryResult = await chrome.storage.local.get(['userProfile']);
      console.log('getUserProfile: Retry result:', retryResult.userProfile ? 'Profile found' : 'No profile');
      console.log('getUserProfile: Sending initialized profile, structure:', Object.keys(retryResult.userProfile || {}));
      sendResponse({ userProfile: retryResult.userProfile });
    }
  } catch (error) {
    console.error('getUserProfile: Error getting user profile:', error);
    sendResponse({ userProfile: null });
  }
}

// Save user profile to storage
async function saveUserProfile(profile, sendResponse) {
  try {
    await chrome.storage.local.set({ userProfile: profile });
    console.log('User profile saved successfully');
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Platform detection logic
function detectPlatform(url) {
  if (!url) return 'unknown';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('linkedin.com')) {
    // LinkedIn has many different URL patterns for job applications
    if (urlLower.includes('jobs') || urlLower.includes('apply') || urlLower.includes('application') || 
        urlLower.includes('easy-apply') || urlLower.includes('job') || urlLower.includes('careers')) {
      return 'linkedin';
    }
    // Also check for LinkedIn job postings that might redirect to external forms
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
  
  // Check for common job application indicators
  if (urlLower.includes('apply') || urlLower.includes('application') || urlLower.includes('careers')) {
    return 'generic';
  }
  
  return 'unknown';
}

// Track which tabs have the content script injected
const injectedTabs = new Set();

// Handle tab updates to inject content script ONLY on actual job application forms
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = tab.url.toLowerCase();
    
    // Only inject on actual job application forms, not just job listing pages
    const isJobApplicationForm = (
      url.includes('/apply') || 
      url.includes('/application') || 
      url.includes('/easy-apply') ||
      url.includes('/submit') ||
      url.includes('/form') ||
      (url.includes('linkedin.com/jobs/view/') && url.includes('/apply')) ||
      (url.includes('greenhouse.io') && url.includes('/jobs/')) ||
      (url.includes('workday.com') && url.includes('/jobs/'))
    );
    
    console.log(`Tab ${tabId} updated - URL: ${tab.url}`);
    console.log(`Is job application form: ${isJobApplicationForm}`);
    console.log(`Already injected: ${injectedTabs.has(tabId)}`);
    
    if (isJobApplicationForm && !injectedTabs.has(tabId)) {
      // Mark this tab as injected to prevent duplicates
      injectedTabs.add(tabId);
      
      console.log(`Injecting content script for job application form in tab ${tabId}`);
      
      // Inject content script
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        console.log(`Content script injected successfully for job application form in tab ${tabId}`);
      }).catch((error) => {
        console.log(`Content script injection failed for tab ${tabId}:`, error.message);
        // Remove from injected tabs if injection failed
        injectedTabs.delete(tabId);
      });
    } else if (!isJobApplicationForm) {
      console.log(`Tab ${tabId} is not a job application form, skipping injection`);
    } else {
      console.log(`Tab ${tabId} already has content script injected`);
    }
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  console.log(`Tab ${tabId} removed from tracking`);
});

// Clean up when tabs are updated to a different URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    // URL changed, remove from injected tabs to allow re-injection
    injectedTabs.delete(tabId);
    console.log(`Tab ${tabId} URL changed, removed from tracking`);
  }
});

// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Application Auto-Filler: Extension installed');
  initializeDefaultProfile();
});
