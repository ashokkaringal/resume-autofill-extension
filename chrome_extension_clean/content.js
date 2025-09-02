// Content script for Job Application Auto-Filler
// Use a more robust duplicate prevention method
(function() {
  'use strict';
  
  // Check if already initialized using a more reliable method
  if (window.jobFormFillerInitialized) {
    console.log('Job Application Auto-Filler already initialized, skipping...');
    return;
  }
  
  // Mark as initialized immediately
  window.jobFormFillerInitialized = true;
  
  console.log('Job Application Auto-Filler: Starting fresh initialization...');
  
  // Use an IIFE to avoid global scope pollution
  const JobFormFiller = (function() {
    let platform = null;
    let userProfile = null;
    let isFilling = false;
    let filledFields = 0;
    let totalFields = 0;
    let initializationComplete = false;
    
    // Initialize the form filler - ENHANCED WITH CLEANUP
    async function init() {
      try {
        console.log('Job Application Auto-Filler: Initializing...');
        
        // Clean up any existing elements to prevent conflicts
        cleanupExistingElements();
        
        // Wait for page to be stable
        await waitForPageStability();
        
        // Get platform and user profile
        const platformResponse = await getMessage('detectPlatform');
        const profileResponse = await getMessage('getUserProfile');
        
        // Try to get AI-enhanced profile from Python backend
        let aiEnhancedProfile = null;
        try {
          aiEnhancedProfile = await getAIEnhancedProfile();
        } catch (error) {
          console.log('Job Application Auto-Filler: AI backend not available, using fallback profile');
        }
        
        console.log('Job Application Auto-Filler: Platform response:', platformResponse);
        console.log('Job Application Auto-Filler: Profile response:', profileResponse);
        
        // Extract platform and profile from responses
        platform = platformResponse ? platformResponse.platform : null;
        userProfile = profileResponse ? profileResponse.userProfile : null;
        
        console.log('Job Application Auto-Filler: Platform extracted:', platform);
        console.log('Job Application Auto-Filler: Profile extracted:', userProfile ? 'Yes' : 'No');
        
        if (platform && (userProfile || aiEnhancedProfile)) {
          // Use AI-enhanced profile if available, otherwise fall back to user profile
          const activeProfile = aiEnhancedProfile || userProfile;
          console.log('Job Application Auto-Filler: Profile structure:', Object.keys(activeProfile));
          console.log('Job Application Auto-Filler: Personal info keys:', activeProfile.personalInfo ? Object.keys(activeProfile.personalInfo) : 'undefined');
          
          createGoFillButton();
          // DO NOT call analyzeForm() here - only create the button
          console.log('Job Application Auto-Filler: Button created, waiting for user click...');
        } else {
          console.log('Job Application Auto-Filler: Platform or profile not available');
          if (!platform) console.log('Job Application Auto-Filler: Platform detection failed');
          if (!userProfile) console.log('Job Application Auto-Filler: Profile loading failed');
          
          // Try to create a minimal profile if none exists
          if (!userProfile) {
            console.log('Job Application Auto-Filler: Creating minimal fallback profile...');
            userProfile = {
              personalInfo: {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@email.com",
                phone: "+1-555-123-4567",
                address: "123 Main Street, City, State 12345"
              },
              experience: {
                pythonProjects: "Python development experience",
                cppBackground: "C++ development experience",
                teamManagement: "Team management experience",
                yearsOfExperience: "5"
              },
              documents: {
                linkedinUrl: "https://linkedin.com/in/johndoe",
                website: "https://johndoe.dev"
              },
              skills: {
                programmingLanguages: ["Python", "JavaScript"],
                frameworks: ["React", "Node.js"]
              }
            };
            
            console.log('Job Application Auto-Filler: Fallback profile created:', userProfile);
            createGoFillButton();
            // DO NOT call analyzeForm() here - only create the button
            console.log('Job Application Auto-Filler: Button created, waiting for user click...');
          }
        }
        
        initializationComplete = true;
        console.log('Job Application Auto-Filler: Initialization complete, waiting for user interaction...');
      } catch (error) {
        console.error('Job Application Auto-Filler initialization error:', error);
      }
    }
    
    // Clean up existing elements to prevent conflicts
    function cleanupExistingElements() {
      try {
        console.log('Job Application Auto-Filler: Cleaning up existing elements...');
        
        // Remove existing button
        const existingButton = document.getElementById('go-fill-button');
        if (existingButton) {
          existingButton.remove();
          console.log('Job Application Auto-Filler: Removed existing button');
        }
        
        // Remove existing completion message
        const existingMessage = document.getElementById('fill-completion-message');
        if (existingMessage) {
          existingMessage.remove();
          console.log('Job Application Auto-Filler: Removed existing completion message');
        }
        
        // Reset state variables
        isFilling = false;
        totalFields = 0;
        filledFields = 0;
        
        console.log('Job Application Auto-Filler: Cleanup complete');
      } catch (error) {
        console.warn('Job Application Auto-Filler: Cleanup error (non-critical):', error);
      }
    }

    // AI Backend Integration Functions
    async function getAIEnhancedProfile() {
      try {
        // Check if backend is available
        const healthCheck = await fetch('http://localhost:5001/health');
        if (!healthCheck.ok) {
          throw new Error('Backend not available');
        }
        
        // Get current page text as potential resume/job description
        const pageText = document.body.innerText;
        
        // Process with AI backend
        const response = await fetch('http://localhost:5001/process_resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resume_text: pageText.substring(0, 5000) // Limit text length
          })
        });
        
        if (!response.ok) {
          throw new Error('Backend processing failed');
        }
        
        const result = await response.json();
        if (result.success) {
          console.log('Job Application Auto-Filler: AI profile generated successfully');
          return convertAIProfileToUserProfile(result.data);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error) {
        console.log('Job Application Auto-Filler: AI backend error:', error.message);
        throw error;
      }
    }
    
    function convertAIProfileToUserProfile(aiData) {
      // Convert AI-extracted data to your existing profile format
      return {
        personalInfo: {
          firstName: aiData.contact?.firstName || '',
          lastName: aiData.contact?.lastName || '',
          email: aiData.contact?.email || '',
          phone: aiData.contact?.phone || '',
          address: aiData.contact?.address || '',
          city: aiData.contact?.city || '',
          state: aiData.contact?.state || '',
          zip: aiData.contact?.zip || '',
          country: aiData.contact?.country || ''
        },
        experience: {
          currentRole: aiData.experience?.[0]?.title || '',
          currentCompany: aiData.experience?.[0]?.company || '',
          yearsOfExperience: aiData.experience?.length?.toString() || '0',
          pythonProjects: aiData.skills?.programming?.includes('Python') ? 'Yes' : 'No',
          cppBackground: aiData.skills?.programming?.includes('C++') ? 'Yes' : 'No',
          teamManagement: aiData.experience?.some(exp => exp.title?.toLowerCase().includes('manager')) ? 'Yes' : 'No'
        },
        skills: {
          programmingLanguages: aiData.skills?.programming || [],
          frameworks: aiData.skills?.frameworks || [],
          tools: aiData.skills?.tools || []
        },
        documents: {
          linkedinUrl: aiData.contact?.linkedin || '',
          website: aiData.contact?.website || ''
        }
      };
    }

    // Detect current platform
    function detectCurrentPlatform() {
      const url = window.location.href;
      if (url.includes('linkedin.com')) return 'linkedin';
      if (url.includes('greenhouse.io')) return 'greenhouse';
      if (url.includes('workday.com')) return 'workday';
      if (url.includes('lever.co')) return 'lever';
      if (url.includes('bamboohr.com')) return 'bamboohr';
      if (url.includes('icims.com')) return 'icims';
      return 'generic';
    }
    
    // AI Job Analysis and Content Generation
    async function analyzeJobAndGenerateContent() {
      try {
        const pageText = document.body.innerText;
        const platform = detectCurrentPlatform();
        
        // Analyze job description
        const jobAnalysis = await fetch('http://localhost:5001/analyze_job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            job_text: pageText.substring(0, 5000)
          })
        });
        
        if (jobAnalysis.ok) {
          const analysis = await jobAnalysis.json();
          if (analysis.success) {
            console.log('Job Application Auto-Filler: Job analysis completed');
            
            // Generate tailored cover letter
            const coverLetter = await fetch('http://localhost:5001/generate_content', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content_type: 'cover_letter'
              })
            });
            
            if (coverLetter.ok) {
              const letter = await coverLetter.json();
              if (letter.success) {
                console.log('Job Application Auto-Filler: Cover letter generated');
                // Store for later use
                window.generatedCoverLetter = letter.data;
              }
            }
          }
        }
      } catch (error) {
        console.log('Job Application Auto-Filler: Job analysis failed:', error.message);
      }
    }

    // Wait for page to be stable before creating button
    function waitForPageStability() {
      return new Promise((resolve) => {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      });
    }

    // Create the Go Fill button
    function createGoFillButton() {
      try {
        console.log('Job Application Auto-Filler: Starting button creation...');
        
        // Remove existing button if present
        const existingButton = document.getElementById('go-fill-button');
        if (existingButton) {
          console.log('Job Application Auto-Filler: Removing existing button');
          existingButton.remove();
        }

        // Create the Go Fill button
        console.log('Job Application Auto-Filler: Creating button element...');
        const button = document.createElement('div');
        button.id = 'go-fill-button';
        button.innerHTML = `
          <div class="go-fill-content">
            <span class="go-fill-text">Go Fill</span>
            <div class="go-fill-progress" style="display: none;">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <span class="progress-text">0%</span>
            </div>
          </div>
        `;

        // Add click event
        button.addEventListener('click', async (event) => {
          console.log('Job Application Auto-Filler: Go Fill button clicked!');
          
          // First try AI analysis if backend is available
          try {
            console.log('Job Application Auto-Filler: Starting AI analysis...');
            await analyzeJobAndGenerateContent();
            console.log('Job Application Auto-Filler: AI analysis completed');
          } catch (error) {
            console.log('Job Application Auto-Filler: AI analysis skipped, proceeding with form filling');
            console.log('Job Application Auto-Filler: Error details:', error.message);
          }
          
          // Then proceed with normal form filling
          console.log('Job Application Auto-Filler: Starting form filling...');
          startFilling();
        });

        // Position the button with explicit styles
        button.style.position = 'fixed';
        button.style.top = '100px';
        button.style.right = '20px';
        button.style.zIndex = '999999';
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '50px';
        button.style.padding = '15px 30px';
        button.style.fontSize = '18px';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.minWidth = '120px';

        // Add to page
        console.log('Job Application Auto-Filler: Adding button to page...');
        document.body.appendChild(button);
        
        // Verify button was added
        const addedButton = document.getElementById('go-fill-button');
        if (addedButton) {
          console.log('Job Application Auto-Filler: Go Fill button created and verified successfully');
          console.log('Job Application Auto-Filler: Button element:', addedButton);
          console.log('Job Application Auto-Filler: Button position:', addedButton.style.position);
          console.log('Job Application Auto-Filler: Button z-index:', addedButton.style.zIndex);
          
          // Set up periodic button visibility check
          setInterval(() => {
            const currentButton = document.getElementById('go-fill-button');
            if (!currentButton || !document.body.contains(currentButton)) {
              console.log('Job Application Auto-Filler: Button disappeared, recreating...');
              createGoFillButton();
            }
          }, 5000); // Check every 5 seconds
          
        } else {
          console.error('Job Application Auto-Filler: Button creation failed - element not found after append');
        }
      } catch (error) {
        console.error('Job Application Auto-Filler: Error creating Go Fill button:', error);
        console.error('Job Application Auto-Filler: Error stack:', error.stack);
      }
    }

    // Start the form filling process - ENHANCED WITH ERROR HANDLING
    function startFilling() {
      console.log('Job Application Auto-Filler: startFilling() called - checking if this is user-initiated...');
      
      if (isFilling) {
        console.log('Job Application Auto-Filler: Already filling, skipping...');
        return;
      }
      
      if (!initializationComplete) {
        console.log('Job Application Auto-Filler: Initialization not complete, skipping...');
        return;
      }
      
      // Since this is called from the button click handler, it's always user-initiated
      console.log('Job Application Auto-Filler: User-initiated form filling, proceeding...');

      try {
        // Validate page state before proceeding
        if (!document.body || !document.body.isConnected) {
          throw new Error('Document body not accessible');
        }
        
        console.log('Job Application Auto-Filler: Starting form filling process (user-initiated)...');
        isFilling = true;
        filledFields = 0;
        totalFields = 0;

        // Show progress
        showProgress();

        // Analyze the form and fill fields
        analyzeForm();

      } catch (error) {
        console.error('Job Application Auto-Filler: Error starting form filling:', error);
        
        // Log detailed error information
        if (error instanceof DOMException) {
          console.error('Job Application Auto-Filler: DOM Exception details:', {
            name: error.name,
            message: error.message,
            code: error.code
          });
        }
        
        // Reset state and show error message
        isFilling = false;
        hideProgress();
        showErrorMessage('Form filling failed: ' + error.message);
      }
    }
    
    // Show error message to user
    function showErrorMessage(message) {
      try {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'fill-error-message';
        errorDiv.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 300px;
          ">
            ❌ ${message}
          </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove error message after 8 seconds
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 8000);
      } catch (error) {
        console.warn('Job Application Auto-Filler: Could not show error message:', error);
      }
    }

    // Analyze the form and identify fields - ENHANCED VERSION
    function analyzeForm() {
      try {
        console.log('Job Application Auto-Filler: ENHANCED analyzeForm() called - comprehensive field detection...');
        
        // Find ALL possible form elements with multiple selectors
        const selectors = [
          'input', 'textarea', 'select',
          '[contenteditable="true"]', // Rich text editors
          '[role="textbox"]', // ARIA text inputs
          '[role="combobox"]', // ARIA dropdowns
          '[role="listbox"]', // ARIA list boxes
          '.form-control', '.form-input', '.form-field', // Common form classes
          '[data-testid*="input"]', '[data-testid*="field"]', // Test IDs
          '[aria-label*="input"]', '[aria-label*="field"]' // ARIA labels
        ];
        
        const formElements = [];
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            // Only add if not already added and is visible
            if (!formElements.includes(element) && isElementVisible(element)) {
              formElements.push(element);
            }
          });
        });
        
        // Also check for hidden fields that might be important
        const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => {
          if (input.name && !formElements.includes(input)) {
            formElements.push(input);
          }
        });
        
        console.log('Job Application Auto-Filler: Enhanced form analysis found elements:', formElements.length);
        console.log('Job Application Auto-Filler: Element types:', formElements.map(el => el.tagName + (el.type ? `[${el.type}]` : '')));
        
        if (formElements.length === 0) {
          console.log('Job Application Auto-Filler: No form elements found');
          completeFilling();
          return;
        }

        totalFields = formElements.length;
        console.log('Job Application Auto-Filler: Total fields to process:', totalFields);

        // Process each field with better error handling
        let processedCount = 0;
        formElements.forEach((element, index) => {
          setTimeout(() => {
            try {
              processField(element, index);
              processedCount++;
            } catch (error) {
              console.error(`Job Application Auto-Filler: Error processing field ${index + 1}:`, error);
              processedCount++;
            }
            
            // Check if all fields are processed
            if (processedCount === totalFields) {
              completeFilling();
            }
          }, index * 150); // Slightly longer delay for stability
        });

      } catch (error) {
        console.error('Job Application Auto-Filler: Error analyzing form:', error);
        completeFilling();
      }
    }
    
    // Helper function to check if element is visible
    function isElementVisible(element) {
      if (!element) return false;
      
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return false;
        }
      
      return true;
    }

    // Process individual form field - ENHANCED VERSION
    function processField(element, index) {
      try {
        console.log('Job Application Auto-Filler: Processing field', index + 1, 'of', totalFields);
        
        // Comprehensive field analysis
        const fieldAnalysis = analyzeField(element);
        console.log('Job Application Auto-Filler: Field analysis:', fieldAnalysis);
        
        // Determine field type and fill accordingly
        const fieldType = getFieldType(element);
        const fieldValue = getFieldValue(fieldType, element);
        
        if (fieldValue) {
          fillField(element, fieldValue);
          filledFields++;
          updateProgress();
          console.log('Job Application Auto-Filler: ✅ Filled field', index + 1, 'with value:', fieldValue);
        } else {
          console.log('Job Application Auto-Filler: ❌ No value for field', index + 1, '- Field:', fieldAnalysis);
        }

      } catch (error) {
        console.error('Job Application Auto-Filler: Error processing field', index + 1, ':', error);
      }
    }
    
    // Comprehensive field analysis function
    function analyzeField(element) {
      const analysis = {
        tagName: element.tagName,
        type: element.type || 'N/A',
        name: element.name || 'N/A',
        id: element.id || 'N/A',
        placeholder: element.placeholder || 'N/A',
        'aria-label': element.getAttribute('aria-label') || 'N/A',
        'aria-describedby': element.getAttribute('aria-describedby') || 'N/A',
        title: element.getAttribute('title') || 'N/A',
        className: element.className || 'N/A',
        value: element.value || 'N/A',
        required: element.required || false,
        disabled: element.disabled || false,
        readonly: element.readOnly || false,
        visible: isElementVisible(element),
        label: getFieldLabel(element) || 'N/A',
        nearbyText: findNearbyText(element) || 'N/A'
      };
      
      return analysis;
    }

    // Get field type
    function getFieldType(element) {
      const tagName = element.tagName.toLowerCase();
      const type = element.type ? element.type.toLowerCase() : '';
      
      if (tagName === 'select') return 'select';
      if (tagName === 'textarea') return 'textarea';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'email') return 'email';
      if (type === 'tel') return 'phone';
      if (type === 'url') return 'url';
      if (type === 'number') return 'number';
      if (type === 'date') return 'date';
      
      return 'text';
    }

    // Get appropriate value for field type - COMPREHENSIVE VERSION WITH RADIO BUTTON ENHANCEMENT
    function getFieldValue(fieldType, element) {
      if (!userProfile) return null;

      // SPECIAL HANDLING FOR RADIO BUTTONS - Use question text for better matching
      if (fieldType === 'radio') {
        console.log('Job Application Auto-Filler: === RADIO BUTTON VALUE DETECTION ===');
        
        // Get the question text for this radio group
        const questionText = getQuestionText(element);
        console.log('Job Application Auto-Filler: Radio question text:', questionText);
        
        if (questionText) {
          // Try to find a context match based on the question text
          const contextMatch = findContextAwareMatch(element, [questionText.toLowerCase()]);
          if (contextMatch) {
            console.log(`Job Application Auto-Filler: Radio context match found: ${contextMatch}`);
            const profileValue = getProfileValue(contextMatch);
            console.log(`Job Application Auto-Filler: Radio profile value: ${profileValue}`);
            return profileValue;
          }
        }
        
        // Fallback: try to find match based on field identifiers
        console.log('Job Application Auto-Filler: Falling back to field identifier matching for radio');
      }

      // Get ALL possible field identifiers
      const fieldName = element.name || '';
      const fieldId = element.id || '';
      const fieldPlaceholder = element.placeholder || '';
      const fieldLabel = getFieldLabel(element);
      const fieldAriaLabel = element.getAttribute('aria-label') || '';
      const fieldTitle = element.getAttribute('title') || '';
      const fieldClass = element.className || '';
      
      // Combine all identifiers for comprehensive matching
      const allIdentifiers = [
        fieldName, fieldId, fieldPlaceholder, fieldLabel, 
        fieldAriaLabel, fieldTitle, fieldClass
      ].filter(Boolean).map(id => id.toLowerCase());
      
      console.log('Job Application Auto-Filler: Field identifiers:', allIdentifiers);
      
      // COMPREHENSIVE FIELD MAPPING - PRECISE VERSION FOR YOUR PROFILE
      const fieldMappings = {
        // Personal Information - EXACT MATCHES ONLY
        firstName: ['first_name', 'firstname', 'fname', 'given_name'],
        lastName: ['last_name', 'lastname', 'lname', 'family_name', 'surname'],
        fullName: ['full_name', 'fullname', 'complete_name'],
        email: ['email', 'e-mail', 'email_address', 'e_mail'],
        phone: ['phone', 'telephone', 'phone_number', 'mobile', 'cell'],
        address: ['address', 'street_address', 'mailing_address', 'home_address'],
        city: ['city', 'town'],
        state: ['state', 'province'],
        zip: ['zip', 'zip_code', 'postal_code', 'postcode'],
        country: ['country', 'nation'],
        
        // Professional Information
        linkedin: ['linkedin', 'linkedin_profile', 'linkedin_url'],
        website: ['website', 'personal_website', 'portfolio_url'],
        github: ['github', 'github_profile', 'github_url'],
        
        // Experience & Skills
        experience: ['years_of_experience', 'total_experience', 'work_experience'],
        skills: ['technical_skills', 'programming_skills', 'key_skills'],
        education: ['education', 'degree', 'highest_education'],
        
        // Job Specific - PRECISE MATCHES
        salary: ['salary_expectation', 'desired_salary', 'salary_range', 'compensation'],
        availability: ['start_date', 'when_can_you_start', 'earliest_start', 'availability'],
        relocation: ['willing_to_relocate', 'relocation', 'open_to_relocation'],
        
        // Additional Fields
        coverLetter: ['cover_letter', 'motivation_letter', 'personal_statement'],
        resume: ['resume', 'cv', 'resume_upload'],
        references: ['references', 'professional_references'],
        
        // New fields from your profile - PRECISE MATCHES
        preferredFirstName: ['preferred_first_name', 'preferred_name', 'nickname'],
        authorizedToWorkInUS: ['legally_authorized', 'work_authorization', 'authorized_to_work'],
        requireSponsorship: ['require_sponsorship', 'visa_sponsorship', 'need_sponsorship'],
        citizenship: ['citizenship', 'citizen_of'],
        backgroundCheckConsent: ['background_check_consent', 'consent_background_check'],
        drugTestConsent: ['drug_test_consent', 'consent_drug_test'],
        nonCompeteRestriction: ['non_compete', 'restrictive_covenant'],
        veteranStatus: ['veteran_status', 'military_service'],
        disabilityStatus: ['disability_status', 'disability_accommodation'],
        securityClearance: ['security_clearance', 'government_clearance'],
        driversLicense: ['drivers_license', 'driver_license'],
        transportationAvailable: ['transportation_available', 'own_transportation'],
        maritalStatus: ['marital_status', 'marriage_status'],
        gender: ['gender', 'sex'],
        ethnicity: ['ethnicity', 'race'],
        dateOfBirth: ['date_of_birth', 'birth_date', 'dob']
      };
      
      // Try to find a match with CONTEXT AWARENESS
      const contextMatch = findContextAwareMatch(element, allIdentifiers);
      if (contextMatch) {
        console.log(`Job Application Auto-Filler: Context-aware match found: ${contextMatch}`);
        return getProfileValue(contextMatch);
      }
      
      // Try to find a match with exact patterns
      for (const [profileKey, patterns] of Object.entries(fieldMappings)) {
        for (const pattern of patterns) {
          for (const identifier of allIdentifiers) {
            if (identifier.includes(pattern)) {
              console.log(`Job Application Auto-Filler: Field matched! Pattern: ${pattern}, Profile key: ${profileKey}`);
              return getProfileValue(profileKey);
            }
          }
        }
      }
      
      // If no direct match, try fuzzy matching
      const fuzzyMatch = findFuzzyMatch(allIdentifiers);
      if (fuzzyMatch) {
        console.log(`Job Application Auto-Filler: Fuzzy match found: ${fuzzyMatch}`);
        return getProfileValue(fuzzyMatch);
      }
      
      console.log('Job Application Auto-Filler: No field mapping found for:', allIdentifiers);
      return null;
    }
    
    // Helper function to get field label
    function getFieldLabel(element) {
      // Try to find associated label
      if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.textContent.trim();
      }
      
      // Try to find label that contains this element
      const parentLabel = element.closest('label');
      if (parentLabel) return parentLabel.textContent.trim();
      
      // Try to find nearby text that might be a label
      const nearbyText = findNearbyText(element);
      if (nearbyText) return nearbyText;
      
      return '';
    }
    
    // Helper function to find nearby text that might be a label
    function findNearbyText(element) {
      // Check previous sibling
      let sibling = element.previousElementSibling;
      if (sibling && sibling.textContent.trim()) {
        return sibling.textContent.trim();
      }
      
      // Check parent's previous sibling
      const parent = element.parentElement;
      if (parent && parent.previousElementSibling) {
        const text = parent.previousElementSibling.textContent.trim();
        if (text) return text;
      }
      
      // Check for text within 50px above the element
      const rect = element.getBoundingClientRect();
      const elementsAbove = document.elementsFromPoint(rect.left + rect.width/2, rect.top - 25);
      for (const el of elementsAbove) {
        if (el.textContent && el.textContent.trim() && el !== element) {
          return el.textContent.trim();
        }
      }
      
      return '';
    }
    
    // Helper function to get profile value - UPDATED FOR YOUR PROFILE STRUCTURE
    function getProfileValue(key) {
      const profile = userProfile;
      
      switch (key) {
        // Personal Information - EXACT MATCHES FROM YOUR PROFILE
        case 'firstName': return profile.personalInfo?.firstName || 'Ashok';
        case 'lastName': return profile.personalInfo?.lastName || 'Jayaram';
        case 'fullName': return `${profile.personalInfo?.firstName || 'Ashok'} ${profile.personalInfo?.lastName || 'Jayaram'}`;
        case 'email': return profile.personalInfo?.email || 'ashok.karingal@gmail.com';
        case 'phone': return profile.personalInfo?.phone || '+1 303-396-2388';
        case 'address': return profile.personalInfo?.address || '435 Reflections Circle, #13, San Ramon, CA, 94583';
        case 'city': return profile.personalInfo?.city || 'San Ramon';
        case 'state': return profile.personalInfo?.state || 'CA';
        case 'zip': return profile.personalInfo?.zip || '94583';
        case 'country': return profile.personalInfo?.country || 'United States';
        
        // Professional Information - UPDATED TO MATCH YOUR STRUCTURE
        case 'linkedin': return profile.personalInfo?.linkedin || 'https://www.linkedin.com/in/ashok-jayaram/';
        case 'website': return profile.personalInfo?.website || '';
        case 'github': return profile.personalInfo?.github || 'https://github.com/ashok-jayaram';
        
        // Experience & Skills - FROM YOUR ACTUAL PROFILE
        case 'experience': return profile.experience?.yearsOfExperience || '17+';
        case 'skills': return profile.skills?.primarySkills?.join(', ') || 'QA Management, Test Automation, UiPath RPA, Selenium, Appium, Java, React, Python, SQL, Agile/Scrum, CI/CD, Cloud Testing';
        case 'education': return profile.education?.degree || 'Bachelor\'s Degree';
        
        // Job Specific - FROM YOUR PROFILE
        case 'salary': return profile.salary?.expectations || 'Negotiable based on industry standards and experience';
        case 'availability': return profile.availability?.startDate || 'Within 3 weeks';
        case 'relocation': return profile.personalInfo?.willingToRelocate || 'Yes';
        
        // Additional Fields - FROM YOUR PROFILE
        case 'coverLetter': return profile.documents?.coverLetter || 'Tailored per job';
        case 'resume': return profile.documents?.resume || 'Ashok-Software-TPM-QA-Manager_AugVer1.pdf';
        case 'references': return profile.documents?.additionalDocs?.[0] || 'References available upon request';
        
        // Application Questions
        case 'automationAI': return profile.applicationQuestions?.automationAI?.answer || 'I implemented a comprehensive test automation framework using UiPath RPA and Selenium that saved the day by reducing manual regression time by 77%, boosting test coverage by 40%, and enabling faster, more confident releases across retail and supply chain platforms.';
        case 'processBuilding': return profile.applicationQuestions?.processBuilding?.answer || 'I built a complete QA process management system from scratch that solved the problem of inconsistent testing approaches across multiple global teams. It delivered standardized testing methodologies, centralized test case management, automated reporting dashboards, and measurable quality metrics.';
        case 'leadershipStyle': return profile.applicationQuestions?.leadershipStyle?.answer || 'My signature style is data-driven decision making with a focus on measurable outcomes and continuous improvement. My team would agree that I foster transparency, encourage feedback, and always keep delivery quality at the center.';
        case 'callCenterExperience': return profile.applicationQuestions?.callCenterExperience?.answer || 'No';
        case 'teamManagement': return profile.applicationQuestions?.teamManagement?.answer || 'Yes';
        case 'workLocation': return profile.applicationQuestions?.workLocation?.answer || 'California (CA)';
        case 'workLocationDetails': return profile.applicationQuestions?.workLocationDetails?.answer || '435 Reflections Circle, #13, San Ramon, CA, 94583';
        
        // Common Questions
        case 'automationExperience': return profile.commonQuestions?.automationExperience?.answer || 'I have extensive experience implementing automation and AI solutions in QA environments. I\'ve led teams in developing UiPath RPA solutions, Selenium test automation frameworks, and AI-powered test data generation tools.';
        case 'processImprovement': return profile.commonQuestions?.processImprovement?.answer || 'I approach process improvement through systematic analysis, stakeholder engagement, and data-driven decision making. I start by identifying pain points, gathering metrics, and involving team members in solution design.';
        case 'teamLeadership': return profile.commonQuestions?.teamLeadership?.answer || 'My leadership philosophy centers on servant leadership, empowerment, and results. I believe in creating an environment where team members can excel, providing clear goals and support, and recognizing achievements.';
        case 'qualityAssurance': return profile.commonQuestions?.qualityAssurance?.answer || 'I ensure quality through a multi-layered approach: comprehensive test planning, automated testing frameworks, continuous monitoring, and regular process reviews.';
        case 'innovation': return profile.commonQuestions?.innovation?.answer || 'I stay innovative by continuously learning about emerging technologies, attending industry conferences, participating in professional communities, and experimenting with new tools and methodologies.';
        
        // New fields from your profile
        case 'preferredFirstName': return profile.personalInfo?.preferredFirstName || 'Ashok';
        case 'currentLocation': return profile.personalInfo?.currentLocation || 'San Ramon, CA';
        case 'authorizedToWorkInUS': return profile.personalInfo?.authorizedToWorkInUS || 'Yes';
        case 'requireSponsorship': return profile.personalInfo?.requireSponsorship || 'No';
        case 'citizenship': return profile.personalInfo?.citizenship || 'US Citizen';
        case 'backgroundCheckConsent': return profile.personalInfo?.backgroundCheckConsent || 'Yes';
        case 'drugTestConsent': return profile.personalInfo?.drugTestConsent || 'Yes';
        case 'nonCompeteRestriction': return profile.personalInfo?.nonCompeteRestriction || 'No';
        case 'veteranStatus': return profile.personalInfo?.veteranStatus || 'No';
        case 'disabilityStatus': return profile.personalInfo?.disabilityStatus || 'No';
        case 'securityClearance': return profile.personalInfo?.securityClearance || 'No';
        case 'driversLicense': return profile.personalInfo?.driversLicense || 'Yes';
        case 'transportationAvailable': return profile.personalInfo?.transportationAvailable || 'Yes';
        case 'maritalStatus': return profile.personalInfo?.maritalStatus || 'Prefer not to answer';
        case 'gender': return profile.personalInfo?.gender || 'Prefer not to answer';
        case 'ethnicity': return profile.personalInfo?.ethnicity || 'Prefer not to answer';
        case 'dateOfBirth': return profile.personalInfo?.dateOfBirth || '1979-07-12';
        
        default: return null;
      }
    }
    
    // Context-aware matching based on question text and field context - ENHANCED FOR INDEED & APPLICATION QUESTIONS
    function findContextAwareMatch(element, identifiers) {
      // Get the question text from various sources
      const questionText = getQuestionText(element);
      const questionLower = questionText.toLowerCase();
      
      console.log('Job Application Auto-Filler: Question text:', questionText);
      
      // First, try to match against your specific application questions
      const applicationQuestionMatch = findApplicationQuestionMatch(questionText);
      if (applicationQuestionMatch) {
        console.log(`Job Application Auto-Filler: Application question match found: ${applicationQuestionMatch}`);
        return applicationQuestionMatch;
      }
      
      // Then try common question patterns
      const commonQuestionMatch = findCommonQuestionMatch(questionText);
      if (commonQuestionMatch) {
        console.log(`Job Application Auto-Filler: Common question match found: ${commonQuestionMatch}`);
        return commonQuestionMatch;
      }
      
      // Indeed-specific and general context-based matching rules
      if (questionLower.includes('relocate') || questionLower.includes('relocation') || questionLower.includes('willing to relocate')) {
        return 'relocation';
      }
      if (questionLower.includes('legally authorized') || questionLower.includes('authorized to work') || questionLower.includes('work authorization')) {
        return 'authorizedToWorkInUS';
      }
      if (questionLower.includes('sponsorship') || questionLower.includes('visa') || questionLower.includes('h-1b') || questionLower.includes('employment visa')) {
        return 'requireSponsorship';
      }
      if (questionLower.includes('available to start') || questionLower.includes('when can you start') || questionLower.includes('start date') || questionLower.includes('earliest start')) {
        return 'availability';
      }
      if (questionLower.includes('salary') || questionLower.includes('compensation') || questionLower.includes('expected salary')) {
        return 'salary';
      }
      if (questionLower.includes('experience') || questionLower.includes('years of experience') || questionLower.includes('work experience')) {
        return 'experience';
      }
      if (questionLower.includes('skills') || questionLower.includes('technical skills') || questionLower.includes('key skills')) {
        return 'skills';
      }
      if (questionLower.includes('education') || questionLower.includes('degree') || questionLower.includes('highest education')) {
        return 'education';
      }
      if (questionLower.includes('background check') || questionLower.includes('consent') || questionLower.includes('background check consent')) {
        return 'backgroundCheckConsent';
      }
      if (questionLower.includes('drug test') || questionLower.includes('drug testing') || questionLower.includes('drug test consent')) {
        return 'drugTestConsent';
      }
      if (questionLower.includes('citizenship') || questionLower.includes('citizen') || questionLower.includes('citizen of')) {
        return 'citizenship';
      }
      if (questionLower.includes('veteran') || questionLower.includes('military') || questionLower.includes('veteran status')) {
        return 'veteranStatus';
      }
      if (questionLower.includes('disability') || questionLower.includes('accommodation') || questionLower.includes('disability status')) {
        return 'disabilityStatus';
      }
      if (questionLower.includes('drivers license') || questionLower.includes('driving') || questionLower.includes('driver license')) {
        return 'driversLicense';
      }
      if (questionLower.includes('transportation') || questionLower.includes('car available') || questionLower.includes('own transportation')) {
        return 'transportationAvailable';
      }
      if (questionLower.includes('marital') || questionLower.includes('marriage') || questionLower.includes('marital status')) {
        return 'maritalStatus';
      }
      if (questionLower.includes('gender') || questionLower.includes('sex') || questionLower.includes('gender identity')) {
        return 'gender';
      }
      if (questionLower.includes('ethnicity') || questionLower.includes('race') || questionLower.includes('racial background')) {
        return 'ethnicity';
      }
      if (questionLower.includes('birth') || questionLower.includes('dob') || questionLower.includes('age') || questionLower.includes('date of birth')) {
        return 'dateOfBirth';
      }
      
      // Indeed-specific patterns
      if (questionLower.includes('indeed') || questionLower.includes('smartapply')) {
        console.log('Job Application Auto-Filler: Indeed form detected, using enhanced matching...');
        // For Indeed forms, try to match based on field attributes
        return findIndeedSpecificMatch(element, questionText);
      }
      
      return null;
    }
    
    // Match against your specific application questions - IMPROVED MATCHING FOR RADIO BUTTONS
    function findApplicationQuestionMatch(questionText) {
      if (!userProfile || !userProfile.applicationQuestions) return null;
      
      const questionLower = questionText.toLowerCase();
      console.log('Job Application Auto-Filler: Looking for application question match in:', questionLower);
      
      // More flexible matching - check for key words instead of exact phrases
      if (questionLower.includes('automation') || questionLower.includes('ai') || questionLower.includes('solution')) {
        if (questionLower.includes('biggest') || questionLower.includes('rolled out') || questionLower.includes('saved the day')) {
          console.log('Job Application Auto-Filler: Matched automation/AI question');
          return 'automationAI';
        }
      }
      
      if (questionLower.includes('process') || questionLower.includes('built') || questionLower.includes('scratch')) {
        if (questionLower.includes('problem') || questionLower.includes('solved') || questionLower.includes('deliver')) {
          console.log('Job Application Auto-Filler: Matched process building question');
          return 'processBuilding';
        }
      }
      
      if (questionLower.includes('signature style') || questionLower.includes('running a process')) {
        if (questionLower.includes('team') || questionLower.includes('agree')) {
          console.log('Job Application Auto-Filler: Matched leadership style question');
          return 'leadershipStyle';
        }
      }
      
      // ENHANCED RADIO BUTTON MATCHING - More flexible patterns
      if (questionLower.includes('call center') || questionLower.includes('contact center') || questionLower.includes('service operations') || 
          questionLower.includes('call centre') || questionLower.includes('customer service')) {
        console.log('Job Application Auto-Filler: Matched call center experience question');
        return 'callCenterExperience';
      }
      
      if (questionLower.includes('managed a team') || questionLower.includes('team management') || questionLower.includes('managed') ||
          questionLower.includes('lead a team') || questionLower.includes('supervise') || questionLower.includes('leadership')) {
        console.log('Job Application Auto-Filler: Matched team management question');
        return 'teamManagement';
      }
      
      // ENHANCED SPONSORSHIP MATCHING - More flexible patterns
      if (questionLower.includes('sponsorship') || questionLower.includes('visa') || questionLower.includes('h-1b') || 
          questionLower.includes('employment visa') || questionLower.includes('work permit') || questionLower.includes('immigration')) {
        console.log('Job Application Auto-Filler: Matched sponsorship question');
        return 'requireSponsorship';
      }
      
      if (questionLower.includes('location') && questionLower.includes('work from')) {
        if (questionLower.includes('dropdown') || questionLower.includes('select')) {
          console.log('Job Application Auto-Filler: Matched work location dropdown question');
          return 'workLocation';
        }
      }
      
      if (questionLower.includes('location not listed') || (questionLower.includes('intend to work') && questionLower.includes('text box'))) {
        console.log('Job Application Auto-Filler: Matched work location details question');
        return 'workLocationDetails';
      }
      
      return null;
    }
    
    // Match against common question patterns
    function findCommonQuestionMatch(questionText) {
      if (!userProfile || !userProfile.commonQuestions) return null;
      
      const questionLower = questionText.toLowerCase();
      
      if (questionLower.includes('automation') && questionLower.includes('experience')) {
        return 'automationExperience';
      }
      if (questionLower.includes('process improvement') || questionLower.includes('optimization')) {
        return 'processImprovement';
      }
      if (questionLower.includes('leadership') && questionLower.includes('motivate')) {
        return 'teamLeadership';
      }
      if (questionLower.includes('quality') && questionLower.includes('testing')) {
        return 'qualityAssurance';
      }
      if (questionLower.includes('innovative') || questionLower.includes('innovation')) {
        return 'innovation';
      }
      
      return null;
    }
    
    // Indeed-specific field matching
    function findIndeedSpecificMatch(element, questionText) {
      const questionLower = questionText.toLowerCase();
      
      // Check for specific Indeed question patterns
      if (questionLower.includes('sponsorship') || questionLower.includes('visa') || questionLower.includes('h-1b') || questionLower.includes('employment visa')) {
        console.log('Job Application Auto-Filler: Indeed sponsorship question detected');
        return 'requireSponsorship';
      }
      
      // Check field attributes for Indeed-specific patterns
      const fieldName = element.name || '';
      const fieldId = element.id || '';
      const fieldClass = element.className || '';
      
      console.log('Job Application Auto-Filler: Indeed field attributes:', { fieldName, fieldId, fieldClass });
      
      // Indeed often uses specific field names or IDs
      if (fieldName.includes('sponsorship') || fieldId.includes('sponsorship') || fieldClass.includes('sponsorship')) {
        return 'requireSponsorship';
      }
      if (fieldName.includes('visa') || fieldId.includes('visa') || fieldClass.includes('visa')) {
        return 'requireSponsorship';
      }
      if (fieldName.includes('authorized') || fieldId.includes('authorized') || fieldClass.includes('authorized')) {
        return 'authorizedToWorkInUS';
      }
      if (fieldName.includes('relocate') || fieldId.includes('relocate') || fieldClass.includes('relocate')) {
        return 'relocation';
      }
      
      return null;
    }
    
    // Get question text from various sources - ENHANCED FOR INDEED
    function getQuestionText(element) {
      // Try to find associated label
      let questionText = '';
      
      // Method 1: Check for associated label
      if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) questionText = label.textContent.trim();
      }
      
      // Method 2: Check if element is inside a label
      if (!questionText) {
        const parentLabel = element.closest('label');
        if (parentLabel) questionText = parentLabel.textContent.trim();
      }
      
      // Method 3: Check for aria-label or aria-describedby
      if (!questionText) {
        questionText = element.getAttribute('aria-label') || element.getAttribute('aria-describedby') || '';
      }
      
      // Method 4: Check for nearby text (within 100px) - ENHANCED FOR INDEED
      if (!questionText) {
        const rect = element.getBoundingClientRect();
        
        // Check multiple points around the element for Indeed's complex layouts
        const checkPoints = [
          [rect.left + rect.width/2, rect.top - 50],  // Above
          [rect.left + rect.width/2, rect.top - 100], // Further above
          [rect.left - 100, rect.top + rect.height/2], // Left
          [rect.left + rect.width + 100, rect.top + rect.height/2] // Right
        ];
        
        for (const [x, y] of checkPoints) {
          const nearbyElements = document.elementsFromPoint(x, y);
          for (const el of nearbyElements) {
            if (el.textContent && el.textContent.trim() && el !== element && !el.contains(element)) {
              const text = el.textContent.trim();
              // Indeed questions are often longer, so increase the length limit
              if (text.length > 5 && text.length < 500 && text.includes('?')) {
                questionText = text;
                break;
              }
            }
          }
          if (questionText) break;
        }
      }
      
      // Method 5: Check for placeholder or title
      if (!questionText) {
        questionText = element.placeholder || element.title || '';
      }
      
      // Method 6: Check for Indeed-specific question containers
      if (!questionText) {
        // Indeed often wraps questions in specific containers
        const questionContainer = element.closest('[data-testid*="question"], [class*="question"], [id*="question"]');
        if (questionContainer) {
          const questionTextElement = questionContainer.querySelector('p, div, span, h1, h2, h3, h4, h5, h6');
          if (questionTextElement) {
            questionText = questionTextElement.textContent.trim();
          }
        }
      }
      
      // Method 7: Check for text in parent containers (Indeed's nested structure)
      if (!questionText) {
        let parent = element.parentElement;
        let depth = 0;
        while (parent && depth < 5) { // Check up to 5 levels up
          if (parent.textContent && parent.textContent.trim()) {
            const text = parent.textContent.trim();
            // Look for text that contains question marks and is reasonable length
            if (text.includes('?') && text.length > 10 && text.length < 1000) {
              // Extract just the question part
              const sentences = text.split(/[.!?]/);
              for (const sentence of sentences) {
                if (sentence.includes('?') && sentence.length > 10) {
                  questionText = sentence.trim();
                  break;
                }
              }
              if (questionText) break;
            }
          }
          parent = parent.parentElement;
          depth++;
        }
      }
      
      return questionText;
    }
    
    // Fuzzy matching for fields that don't have exact matches
    function findFuzzyMatch(identifiers) {
      const fuzzyPatterns = {
        'firstName': ['name', 'given', 'first'],
        'lastName': ['name', 'family', 'last'],
        'email': ['contact', 'mail', 'email'],
        'phone': ['contact', 'tel', 'phone'],
        'address': ['location', 'address'],
        'experience': ['work', 'professional', 'background'],
        'skills': ['technical', 'programming', 'languages']
      };
      
      for (const [key, patterns] of Object.entries(fuzzyPatterns)) {
        for (const pattern of patterns) {
          for (const identifier of identifiers) {
            if (identifier.includes(pattern)) {
              return key;
            }
          }
        }
      }
      
      return null;
    }

    // Fill the field with value - ENHANCED WITH BETTER ERROR HANDLING
    function fillField(element, value) {
      try {
        // Validate element exists and is accessible
        if (!element || !element.isConnected || !document.contains(element)) {
          console.warn('Job Application Auto-Filler: Element not accessible, skipping:', element);
          return;
        }
        
        const fieldType = getFieldType(element);
        console.log('Job Application Auto-Filler: Filling field type:', fieldType, 'with value:', value);
        
        switch (fieldType) {
          case 'text':
          case 'email':
          case 'phone':
          case 'url':
          case 'number':
          case 'date':
            if (element.value !== undefined) {
              element.value = value;
              // Use safer event dispatching
              try {
                element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
              } catch (eventError) {
                console.warn('Job Application Auto-Filler: Event dispatch failed, but value set:', eventError);
              }
            }
            break;
            
          case 'textarea':
            if (element.value !== undefined) {
              element.value = value;
              try {
                element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
              } catch (eventError) {
                console.warn('Job Application Auto-Filler: Event dispatch failed, but value set:', eventError);
              }
            }
            break;
            
          case 'select':
            // Try to find matching option - ENHANCED FOR WORK LOCATION
            try {
              const options = Array.from(element.options || []);
              console.log('Job Application Auto-Filler: Filling select field with value:', value);
              console.log('Job Application Auto-Filler: Available options:', options.map(opt => opt.text));
              
              // For work location, look for "California" or "CA"
              let matchingOption = null;
              if (value === 'California (CA)' || value.includes('California')) {
                matchingOption = options.find(option => 
                  option.text.toLowerCase().includes('california') || 
                  option.text.toLowerCase().includes('ca')
                );
              } else {
                // General matching
                matchingOption = options.find(option => 
                  option.text.toLowerCase().includes(value.toLowerCase()) ||
                  option.value.toLowerCase().includes(value.toLowerCase())
                );
              }
              
              if (matchingOption) {
                console.log('Job Application Auto-Filler: Selected option:', matchingOption.text);
                element.value = matchingOption.value;
                try {
                  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                } catch (eventError) {
                  console.warn('Job Application Auto-Filler: Select change event failed:', eventError);
                }
              } else {
                console.log('Job Application Auto-Filler: No matching option found for:', value);
              }
            } catch (selectError) {
              console.warn('Job Application Auto-Filler: Select field handling failed:', selectError);
            }
            break;
            
          case 'checkbox':
            if (value && value !== 'false' && value !== '0') {
              element.checked = true;
              try {
                element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
              } catch (eventError) {
                console.warn('Job Application Auto-Filler: Checkbox change event failed:', eventError);
              }
            }
            break;
            
          case 'radio':
            // Find matching radio button - ENHANCED AND FLEXIBLE
            try {
              const radioName = element.name;
              if (!radioName) {
                console.warn('Job Application Auto-Filler: Radio button has no name attribute');
                return;
              }
              
              const radioButtons = document.querySelectorAll(`input[name="${radioName}"]`);
              console.log('Job Application Auto-Filler: === RADIO BUTTON DEBUG ===');
              console.log('Job Application Auto-Filler: Target value:', value);
              console.log('Job Application Auto-Filler: Radio name:', radioName);
              console.log('Job Application Auto-Filler: Available radio options:', Array.from(radioButtons).map(r => ({ value: r.value, text: r.textContent || r.innerText || 'N/A' })));
              
              // More flexible matching for radio buttons
              let radioMatched = false;
              radioButtons.forEach(radio => {
                if (!radio.isConnected || !document.contains(radio)) return;
                
                const radioValue = radio.value.toLowerCase();
                const radioText = (radio.textContent || radio.innerText || '').toLowerCase();
                const targetValue = value.toLowerCase();
                
                console.log('Job Application Auto-Filler: Checking radio:', { value: radio.value, text: radio.textContent || radio.innerText, checked: radio.checked });
                
                // Multiple matching strategies
                let shouldSelect = false;
                
                // Strategy 1: Exact value match
                if (radioValue === targetValue) {
                  shouldSelect = true;
                  console.log('Job Application Auto-Filler: Exact value match found');
                }
                // Strategy 2: Text content match
                else if (radioText && radioText.includes(targetValue)) {
                  shouldSelect = true;
                  console.log('Job Application Auto-Filler: Text content match found');
                }
                // Strategy 3: Value contains target
                else if (radioValue.includes(targetValue)) {
                  shouldSelect = true;
                  console.log('Job Application Auto-Filler: Value contains target');
                }
                // Strategy 4: Target contains value
                else if (targetValue.includes(radioValue)) {
                  shouldSelect = true;
                  console.log('Job Application Auto-Filler: Target contains value');
                }
                // Strategy 5: Special cases for common values
                else if ((targetValue === 'no' && (radioValue === 'false' || radioValue === '0' || radioValue === 'n')) ||
                         (targetValue === 'yes' && (radioValue === 'true' || radioValue === '1' || radioValue === 'y'))) {
                  shouldSelect = true;
                  console.log('Job Application Auto-Filler: Special case match found');
                }
                
                if (shouldSelect) {
                  console.log('Job Application Auto-Filler: Selecting radio button:', radio.value);
                  radio.checked = true;
                  radioMatched = true;
                  
                  // Try multiple event types for better compatibility
                  try {
                    radio.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    radio.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    radio.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
                  } catch (eventError) {
                    console.warn('Job Application Auto-Filler: Radio event dispatch failed:', eventError);
                  }
                  
                  // Also try setting the checked property directly
                  try {
                    radio.setAttribute('checked', 'checked');
                  } catch (attrError) {
                    console.warn('Job Application Auto-Filler: Setting checked attribute failed:', attrError);
                  }
                }
              });
              
              if (!radioMatched) {
                console.log('Job Application Auto-Filler: ❌ No matching radio option found for:', value);
                console.log('Job Application Auto-Filler: Available values:', Array.from(radioButtons).map(r => r.value));
                console.log('Job Application Auto-Filler: Available text:', Array.from(radioButtons).map(r => r.textContent || r.innerText));
              } else {
                console.log('Job Application Auto-Filler: ✅ Radio button selection successful');
              }
              
              console.log('Job Application Auto-Filler: === END RADIO DEBUG ===');
            } catch (radioError) {
              console.warn('Job Application Auto-Filler: Radio field handling failed:', radioError);
            }
            break;
        }
      } catch (error) {
        console.error('Job Application Auto-Filler: Error filling field:', error);
        // Log more details about the error
        if (error instanceof DOMException) {
          console.error('Job Application Auto-Filler: DOM Exception details:', {
            name: error.name,
            message: error.message,
            code: error.code
          });
        }
      }
    }

    // Show progress indicator
    function showProgress() {
      const button = document.getElementById('go-fill-button');
      if (button) {
        const progress = button.querySelector('.go-fill-progress');
        if (progress) {
          progress.style.display = 'block';
        }
      }
    }

    // Hide progress indicator
    function hideProgress() {
      const button = document.getElementById('go-fill-button');
      if (button) {
        const progress = button.querySelector('.go-fill-progress');
        if (progress) {
          progress.style.display = 'none';
        }
      }
    }

    // Update progress
    function updateProgress() {
      const button = document.getElementById('go-fill-button');
      if (button) {
        const progressFill = button.querySelector('.progress-fill');
        const progressText = button.querySelector('.progress-text');
        
        if (progressFill && progressText) {
          const percentage = Math.round((filledFields / totalFields) * 100);
          progressFill.style.width = percentage + '%';
          progressText.textContent = percentage + '%';
        }
      }
    }

    // Complete the filling process - ENHANCED VERSION
    function completeFilling() {
      console.log('Job Application Auto-Filler: Form filling completed!');
      console.log('Job Application Auto-Filler: Filled', filledFields, 'out of', totalFields, 'fields');
      
      // Generate comprehensive summary
      generateFillingSummary();
      
      isFilling = false;
      hideProgress();
      
      // Show completion message
      showCompletionMessage();
    }
    
    // Generate comprehensive filling summary
    function generateFillingSummary() {
      console.log('Job Application Auto-Filler: ===== COMPREHENSIVE FILLING SUMMARY =====');
      console.log('Job Application Auto-Filler: Total fields detected:', totalFields);
      console.log('Job Application Auto-Filler: Fields successfully filled:', filledFields);
      console.log('Job Application Auto-Filler: Fields not filled:', totalFields - filledFields);
      console.log('Job Application Auto-Filler: Success rate:', Math.round((filledFields / totalFields) * 100) + '%');
      
      // Analyze why fields weren't filled
      if (filledFields < totalFields) {
        console.log('Job Application Auto-Filler: === ANALYSIS OF UNFILLED FIELDS ===');
        console.log('Job Application Auto-Filler: Common reasons for unfilled fields:');
        console.log('Job Application Auto-Filler: 1. Field names not recognized by mapping system');
        console.log('Job Application Auto-Filler: 2. Fields are hidden or not visible');
        console.log('Job Application Auto-Filler: 3. Fields are disabled or read-only');
        console.log('Job Application Auto-Filler: 4. Field types not supported (file uploads, etc.)');
        console.log('Job Application Auto-Filler: 5. Custom field implementations');
        
        console.log('Job Application Auto-Filler: === RECOMMENDATIONS ===');
        console.log('Job Application Auto-Filler: 1. Check console for detailed field analysis');
        console.log('Job Application Auto-Filler: 2. Look for field names that could be added to mapping');
        console.log('Job Application Auto-Filler: 3. Verify all form elements are being detected');
        console.log('Job Application Auto-Filler: 4. Check if fields are dynamically loaded');
      }
      
      console.log('Job Application Auto-Filler: ===== END SUMMARY =====');
    }

    // Show completion message
    function showCompletionMessage() {
      const message = document.createElement('div');
      message.id = 'fill-completion-message';
      message.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px 20px;
          border-radius: 5px;
          z-index: 1000000;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        ">
          ✅ Form filled successfully! (${filledFields}/${totalFields} fields)
        </div>
      `;
      
      document.body.appendChild(message);
      
      // Remove message after 5 seconds
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 5000);
    }

    // Get message from background script
    function getMessage(action) {
      return new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ action: action }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Job Application Auto-Filler: Chrome runtime error:', chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(response);
            }
          });
        } catch (error) {
          console.error('Job Application Auto-Filler: Message sending error:', error);
          resolve(null);
        }
      });
    }

    // Return public interface
    return {
      init: init,
      createGoFillButton: createGoFillButton
    };
  })();

  // More comprehensive job page detection
  const isJobPage = () => {
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    
    // Check for common job-related patterns
    const jobPatterns = [
      'apply', 'application', 'careers', 'jobs', 'job', 'employment',
      'linkedin.com', 'greenhouse.io', 'workday.com', 'lever.co', 
      'bamboohr.com', 'icims.com', 'indeed.com', 'glassdoor.com',
      'ziprecruiter.com', 'monster.com', 'careerbuilder.com'
    ];
    
    // Check URL components
    const hasJobPattern = jobPatterns.some(pattern => 
      url.includes(pattern) || path.includes(pattern) || search.includes(pattern)
    );
    
    // Also check for form elements that suggest job applications
    const hasJobForms = document.querySelectorAll('input[name*="job"], input[name*="career"], input[name*="employment"], form').length > 0;
    
    // Check page title and content
    const title = document.title.toLowerCase();
    const hasJobTitle = title.includes('apply') || title.includes('job') || title.includes('career') || title.includes('employment');
    
    return hasJobPattern || hasJobForms || hasJobTitle;
  };
  
  // Add page refresh detection
  let pageLoadTime = Date.now();
  let refreshCount = 0;
  
  // Listen for page visibility changes (refresh indicator)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const currentTime = Date.now();
      const timeSinceLastLoad = currentTime - pageLoadTime;
      
      // If less than 5 seconds, likely a refresh
      if (timeSinceLastLoad < 5000) {
        refreshCount++;
        console.log(`Job Application Auto-Filler: Page refresh detected (count: ${refreshCount})`);
        
        // Reset any existing state
        if (typeof JobFormFiller !== 'undefined') {
          JobFormFiller.initializationComplete = false;
        }
      }
      
      pageLoadTime = currentTime;
    }
  });
  
  // Initialize if this appears to be a job page
  if (isJobPage()) {
    console.log('Job Application Auto-Filler: Job page detected, initializing...');
    console.log('Job Application Auto-Filler: URL:', window.location.href);
    console.log('Job Application Auto-Filler: Title:', document.title);
    
    // Wait a bit for the page to fully load
    setTimeout(() => {
      JobFormFiller.init();
    }, 1000);
  } else {
    console.log('Job Application Auto-Filler: Not a job page, skipping initialization...');
    console.log('Job Application Auto-Filler: URL:', window.location.href);
    console.log('Job Application Auto-Filler: Title:', document.title);
  }

  // Add manual button creation function for debugging
  window.forceCreateButton = function() {
    console.log('Job Application Auto-Filler: Manually forcing button creation...');
    if (typeof JobFormFiller !== 'undefined' && JobFormFiller.init) {
      JobFormFiller.init();
    } else {
      console.error('Job Application Auto-Filler: JobFormFiller not available');
    }
  };
  
  // Add immediate button recreation function
  window.recreateButton = function() {
    console.log('Job Application Auto-Filler: Manually recreating button...');
    const existingButton = document.getElementById('go-fill-button');
    if (existingButton) {
      existingButton.remove();
    }
    if (typeof JobFormFiller !== 'undefined' && JobFormFiller.createGoFillButton) {
      JobFormFiller.createGoFillButton();
    } else {
      console.error('Job Application Auto-Filler: createGoFillButton not available');
    }
  };

  // Add button visibility check function
  window.checkButtonStatus = function() {
    const button = document.getElementById('go-fill-button');
    if (button) {
      console.log('Job Application Auto-Filler: Button found!');
      console.log('Button styles:', {
        position: button.style.position,
        top: button.style.top,
        right: button.style.top,
        zIndex: button.style.zIndex,
        display: button.style.display,
        visibility: button.style.visibility,
        opacity: button.style.opacity
      });
      console.log('Button computed styles:', {
        position: window.getComputedStyle(button).position,
        top: window.getComputedStyle(button).top,
        right: window.getComputedStyle(button).right,
        zIndex: window.getComputedStyle(button).zIndex
      });
    } else {
      console.log('Job Application Auto-Filler: Button not found');
    }
  };

})();

// Make functions globally accessible outside the IIFE
window.testFormFilling = function() {
  console.log('Job Application Auto-Filler: Testing form filling...');
  
  // Test basic field detection
  const inputs = document.querySelectorAll('input, textarea, select');
  console.log('Job Application Auto-Filler: Found form elements:', inputs.length);
  
  // Test specific field types
  const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
  const selects = document.querySelectorAll('select');
  const textareas = document.querySelectorAll('textarea');
  
  console.log('Job Application Auto-Filler: Text inputs:', textInputs.length);
  console.log('Job Application Auto-Filler: Selects:', selects.length);
  console.log('Job Application Auto-Filler: Textareas:', textareas.length);
  
  // Test a simple field fill
  if (textInputs.length > 0) {
    const firstInput = textInputs[0];
    console.log('Job Application Auto-Filler: Testing with first input:', firstInput.name || firstInput.id);
    try {
      firstInput.value = 'TEST VALUE';
      console.log('Job Application Auto-Filler: Successfully set test value');
    } catch (error) {
      console.error('Job Application Auto-Filler: Error setting test value:', error);
    }
  }
};

window.checkButtonStatus = function() {
  const button = document.getElementById('go-fill-button');
  if (button) {
    console.log('Job Application Auto-Filler: Button found!');
    console.log('Button styles:', {
      position: button.style.position,
      top: button.style.top,
      right: button.style.right,
      zIndex: button.style.zIndex,
      display: button.style.display,
      visibility: button.style.visibility,
      opacity: button.style.opacity
    });
  } else {
    console.log('Job Application Auto-Filler: Button not found');
  }
};

window.testJobFormFillerExtension = function() {
  console.log('Job Application Auto-Filler: Testing extension...');
  return true;
};

// Add test button click function
window.testButtonClick = function() {
  console.log('Job Application Auto-Filler: Testing button click...');
  const button = document.getElementById('go-fill-button');
  if (button) {
    console.log('Job Application Auto-Filler: Simulating button click...');
    button.click();
  } else {
    console.log('Job Application Auto-Filler: Button not found, cannot test click');
  }
};

// Add comprehensive field analysis function
window.analyzeAllFields = function() {
  console.log('Job Application Auto-Filler: === COMPREHENSIVE FIELD ANALYSIS ===');
  
  // Find all form elements
  const selectors = [
    'input', 'textarea', 'select',
    '[contenteditable="true"]', '[role="textbox"]', '[role="combobox"]', '[role="listbox"]',
    '.form-control', '.form-input', '.form-field',
    '[data-testid*="input"]', '[data-testid*="field"]',
    '[aria-label*="input"]', '[aria-label*="field"]'
  ];
  
  const allFields = [];
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (!allFields.includes(element)) {
        allFields.push(element);
      }
    });
  });
  
  console.log('Job Application Auto-Filler: Total fields found:', allFields.length);
  
  allFields.forEach((field, index) => {
    console.log(`Job Application Auto-Filler: === FIELD ${index + 1} ===`);
    console.log('Job Application Auto-Filler: Element:', field);
    console.log('Job Application Auto-Filler: Tag:', field.tagName);
    console.log('Job Application Auto-Filler: Type:', field.type || 'N/A');
    console.log('Job Application Auto-Filler: Name:', field.name || 'N/A');
    console.log('Job Application Auto-Filler: ID:', field.id || 'N/A');
    console.log('Job Application Auto-Filler: Placeholder:', field.placeholder || 'N/A');
    console.log('Job Application Auto-Filler: Aria-label:', field.getAttribute('aria-label') || 'N/A');
    console.log('Job Application Auto-Filler: Title:', field.getAttribute('title') || 'N/A');
    console.log('Job Application Auto-Filler: Class:', field.className || 'N/A');
    console.log('Job Application Auto-Filler: Value:', field.value || 'N/A');
    console.log('Job Application Auto-Filler: Required:', field.required || false);
    console.log('Job Application Auto-Filler: Disabled:', field.disabled || false);
    console.log('Job Application Auto-Filler: Readonly:', field.readOnly || false);
    
    // Try to find associated label
    let label = '';
    if (field.id) {
      const labelElement = document.querySelector(`label[for="${field.id}"]`);
      if (labelElement) label = labelElement.textContent.trim();
    }
    if (!label) {
      const parentLabel = field.closest('label');
      if (parentLabel) label = parentLabel.textContent.trim();
    }
    console.log('Job Application Auto-Filler: Label:', label || 'N/A');
    
    console.log('Job Application Auto-Filler: Visible:', isElementVisible ? isElementVisible(field) : 'Function not available');
    console.log('Job Application Auto-Filler: ===================');
  });
  
  console.log('Job Application Auto-Filler: === END FIELD ANALYSIS ===');
};

// Add profile data debug function - ENHANCED WITH APPLICATION QUESTIONS
window.debugProfileData = function() {
  console.log('Job Application Auto-Filler: === PROFILE DATA DEBUG - ENHANCED ===');
  
  if (typeof JobFormFiller !== 'undefined' && JobFormFiller.userProfile) {
    const profile = JobFormFiller.userProfile;
    console.log('Job Application Auto-Filler: Profile loaded:', !!profile);
    console.log('Job Application Auto-Filler: Profile structure:', Object.keys(profile));
    
    if (profile.personalInfo) {
      console.log('Job Application Auto-Filler: Personal Info:', profile.personalInfo);
    }
    if (profile.experience) {
      console.log('Job Application Auto-Filler: Experience:', profile.experience);
    }
    if (profile.skills) {
      console.log('Job Application Auto-Filler: Skills:', profile.skills);
    }
    if (profile.documents) {
      console.log('Job Application Auto-Filler: Documents:', profile.documents);
    }
    
    // Show application questions
    if (profile.applicationQuestions) {
      console.log('Job Application Auto-Filler: === APPLICATION QUESTIONS ===');
      for (const [key, qa] of Object.entries(profile.applicationQuestions)) {
        console.log(`Job Application Auto-Filler: ${key}:`);
        console.log(`Job Application Auto-Filler:   Q: ${qa.question}`);
        console.log(`Job Application Auto-Filler:   A: ${qa.answer.substring(0, 100)}...`);
      }
    }
    
    // Show common questions
    if (profile.commonQuestions) {
      console.log('Job Application Auto-Filler: === COMMON QUESTIONS ===');
      for (const [key, qa] of Object.entries(profile.commonQuestions)) {
        console.log(`Job Application Auto-Filler: ${key}:`);
        console.log(`Job Application Auto-Filler:   Q: ${qa.question}`);
        console.log(`Job Application Auto-Filler:   A: ${qa.answer.substring(0, 100)}...`);
      }
    }
  } else {
    console.log('Job Application Auto-Filler: Profile not available or not loaded');
  }
  
  console.log('Job Application Auto-Filler: === END PROFILE DEBUG ===');
};

// Add current form analysis debug function
window.debugCurrentForm = function() {
  console.log('Job Application Auto-Filler: === CURRENT FORM ANALYSIS ===');
  
  // Analyze all form fields
  const formElements = document.querySelectorAll('input, textarea, select, [contenteditable="true"]');
  console.log('Job Application Auto-Filler: Total form elements found:', formElements.length);
  
  formElements.forEach((element, index) => {
    console.log(`Job Application Auto-Filler: === FIELD ${index + 1} ANALYSIS ===`);
    
    // Basic field info
    console.log('Job Application Auto-Filler: Tag:', element.tagName);
    console.log('Job Application Auto-Filler: Type:', element.type || 'N/A');
    console.log('Job Application Auto-Filler: Name:', element.name || 'N/A');
    console.log('Job Application Auto-Filler: ID:', element.id || 'N/A');
    console.log('Job Application Auto-Filler: Class:', element.className || 'N/A');
    console.log('Job Application Auto-Filler: Placeholder:', element.placeholder || 'N/A');
    console.log('Job Application Auto-Filler: Aria-label:', element.getAttribute('aria-label') || 'N/A');
    
    // Field analysis
    const fieldType = getFieldType(element);
    const fieldValue = getFieldValue(fieldType, element);
    const questionText = getQuestionText(element);
    
    console.log('Job Application Auto-Filler: Detected Field Type:', fieldType);
    console.log('Job Application Auto-Filler: Question Text:', questionText);
    console.log('Job Application Auto-Filler: Assigned Profile Value:', fieldValue);
    console.log('Job Application Auto-Filler: Current Field Value:', element.value || element.textContent || 'N/A');
    
    // For dropdowns, show available options
    if (fieldType === 'select') {
      const options = Array.from(element.options);
      console.log('Job Application Auto-Filler: Available options:', options.map(opt => opt.text));
    }
    
    // For radio buttons, show available choices
    if (fieldType === 'radio') {
      const radioName = element.name;
      const radioButtons = document.querySelectorAll(`input[name="${radioName}"]`);
      console.log('Job Application Auto-Filler: Available radio options:', Array.from(radioButtons).map(r => r.value));
    }
    
    console.log('Job Application Auto-Filler: ---');
  });
  
  console.log('Job Application Auto-Filler: === END FORM ANALYSIS ===');
};

// Add specific radio button debug function - ENHANCED WITH VALUE TESTING
window.debugRadioButtons = function() {
  console.log('Job Application Auto-Filler: === ENHANCED RADIO BUTTON ANALYSIS ===');
  
  const radioGroups = {};
  
  // Find all radio buttons and group them by name
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  console.log('Job Application Auto-Filler: Total radio buttons found:', radioButtons.length);
  
  radioButtons.forEach((radio, index) => {
    const name = radio.name || `unnamed_${index}`;
    if (!radioGroups[name]) {
      radioGroups[name] = [];
    }
    radioGroups[name].push(radio);
  });
  
  // Analyze each radio group
  Object.entries(radioGroups).forEach(([name, radios]) => {
    console.log(`Job Application Auto-Filler: === RADIO GROUP: ${name} ===`);
    console.log('Job Application Auto-Filler: Number of options:', radios.length);
    
    radios.forEach((radio, index) => {
      console.log(`Job Application Auto-Filler: Option ${index + 1}:`, {
        value: radio.value,
        text: radio.textContent || radio.innerText || 'N/A',
        checked: radio.checked,
        id: radio.id,
        class: radio.className,
        'aria-label': radio.getAttribute('aria-label'),
        'data-testid': radio.getAttribute('data-testid')
      });
    });
    
    // Try to find associated label or question
    const firstRadio = radios[0];
    if (firstRadio) {
      const questionText = getQuestionText(firstRadio);
      console.log('Job Application Auto-Filler: Question text:', questionText);
      
      // Try to determine what this radio group is for
      if (questionText) {
        const contextMatch = findContextAwareMatch(firstRadio, []);
        console.log('Job Application Auto-Filler: Context match would be:', contextMatch);
        
        // Test what value would be assigned
        if (contextMatch) {
          const profileValue = getProfileValue(contextMatch);
          console.log('Job Application Auto-Filler: Profile value would be:', profileValue);
          
          // Test if this value would match any radio option
          const matchingOptions = radios.filter(radio => {
            const radioValue = radio.value.toLowerCase();
            const radioText = (radio.textContent || radio.innerText || '').toLowerCase();
            const targetValue = profileValue.toLowerCase();
            
            return radioValue === targetValue || 
                   radioText.includes(targetValue) || 
                   radioValue.includes(targetValue) ||
                   targetValue.includes(radioValue);
          });
          
          console.log('Job Application Auto-Filler: Matching radio options:', matchingOptions.map(r => r.value));
        }
      }
    }
    
    console.log('Job Application Auto-Filler: ---');
  });
  
  console.log('Job Application Auto-Filler: === END ENHANCED RADIO ANALYSIS ===');
};

// Add question text debug function - ENHANCED FOR INDEED
window.debugQuestionText = function() {
  console.log('Job Application Auto-Filler: === QUESTION TEXT DEBUG - ENHANCED FOR INDEED ===');
  
  const selectors = ['input', 'textarea', 'select'];
  const allFields = document.querySelectorAll(selectors.join(', '));
  
  console.log('Job Application Auto-Filler: Total fields found:', allFields.length);
  
  allFields.forEach((field, index) => {
    console.log(`Job Application Auto-Filler: === FIELD ${index + 1} ===`);
    console.log('Job Application Auto-Filler: Element:', field);
    console.log('Job Application Auto-Filler: Type:', field.type || 'N/A');
    console.log('Job Application Auto-Filler: Name:', field.name || 'N/A');
    console.log('Job Application Auto-Filler: ID:', field.id || 'N/A');
    console.log('Job Application Auto-Filler: Class:', field.className || 'N/A');
    
    // Show field analysis
    const fieldType = getFieldType(field);
    const fieldValue = getFieldValue(field);
    console.log('Job Application Auto-Filler: Field Type (detected):', fieldType);
    console.log('Job Application Auto-Filler: Assigned Value:', fieldValue);
    console.log('Job Application Auto-Filler: Current Value:', field.value || field.textContent || 'N/A');
    
    // Get question text using the ENHANCED logic for Indeed
    let questionText = '';
    
    // Method 1: Associated label
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) questionText = label.textContent.trim();
    }
    
    // Method 2: Parent label
    if (!questionText) {
      const parentLabel = field.closest('label');
      if (parentLabel) questionText = parentLabel.textContent.trim();
    }
    
    // Method 3: Aria attributes
    if (!questionText) {
      questionText = field.getAttribute('aria-label') || field.getAttribute('aria-describedby') || '';
    }
    
    // Method 4: Enhanced nearby text detection (Indeed-specific)
    if (!questionText) {
      const rect = field.getBoundingClientRect();
      const checkPoints = [
        [rect.left + rect.width/2, rect.top - 50],
        [rect.left + rect.width/2, rect.top - 100],
        [rect.left - 100, rect.top + rect.height/2],
        [rect.left + rect.width + 100, rect.top + rect.height/2]
      ];
      
      for (const [x, y] of checkPoints) {
        const nearbyElements = document.elementsFromPoint(x, y);
        for (const el of nearbyElements) {
          if (el.textContent && el.textContent.trim() && el !== field && !el.contains(field)) {
            const text = el.textContent.trim();
            if (text.length > 5 && text.length < 500 && text.includes('?')) {
              questionText = text;
              break;
            }
          }
        }
        if (questionText) break;
      }
    }
    
    // Method 5: Placeholder/title
    if (!questionText) {
      questionText = field.placeholder || field.title || '';
    }
    
    // Method 6: Indeed-specific question containers
    if (!questionText) {
      const questionContainer = field.closest('[data-testid*="question"], [class*="question"], [id*="question"]');
      if (questionContainer) {
        const questionTextElement = questionContainer.querySelector('p, div, span, h1, h2, h3, h4, h5, h6');
        if (questionTextElement) {
          questionText = questionTextElement.textContent.trim();
        }
      }
    }
    
    // Method 7: Parent container text (Indeed's nested structure)
    if (!questionText) {
      let parent = field.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        if (parent.textContent && parent.textContent.trim()) {
          const text = parent.textContent.trim();
          if (text.includes('?') && text.length > 10 && text.length < 1000) {
            const sentences = text.split(/[.!?]/);
            for (const sentence of sentences) {
              if (sentence.includes('?') && sentence.length > 10) {
                questionText = sentence.trim();
                break;
              }
            }
            if (questionText) break;
          }
        }
        parent = parent.parentElement;
        depth++;
      }
    }
    
    console.log('Job Application Auto-Filler: Question text detected:', questionText || 'N/A');
    
    // Show what would be matched
    if (questionText) {
      const contextMatch = findContextAwareMatch ? findContextAwareMatch(field, []) : 'Function not available';
      console.log('Job Application Auto-Filler: Context match would be:', contextMatch);
    }
    
    console.log('Job Application Auto-Filler: ===================');
  });
  
  console.log('Job Application Auto-Filler: === END QUESTION DEBUG ===');
};

// Add a simple test to verify the script loaded
console.log('Job Application Auto-Filler: Content script loaded and functions defined');
console.log('Available test functions:', {
  testFormFilling: typeof window.testFormFilling,
  checkButtonStatus: typeof window.checkButtonStatus,
  testJobFormFillerExtension: typeof window.testJobFormFillerExtension,
  testButtonClick: typeof window.testButtonClick,
  forceCreateButton: typeof window.forceCreateButton,
  recreateButton: typeof window.recreateButton,
  analyzeAllFields: typeof window.analyzeAllFields,
  debugProfileData: typeof window.debugProfileData,
  debugQuestionText: typeof window.debugQuestionText,
  debugCurrentForm: typeof window.debugCurrentForm,
  debugRadioButtons: typeof window.debugRadioButtons
});
console.log('Job Application Auto-Filler: Use these functions in console for debugging:');
console.log('Job Application Auto-Filler: - window.recreateButton() - recreate the button');
console.log('Job Application Auto-Filler: - window.testButtonClick() - test button click');
console.log('Job Application Auto-Filler: - window.checkButtonStatus() - check button status');
console.log('Job Application Auto-Filler: - window.analyzeAllFields() - analyze all form fields');
console.log('Job Application Auto-Filler: - window.debugProfileData() - debug profile data being used');
console.log('Job Application Auto-Filler: - window.debugQuestionText() - debug question text detection');
console.log('Job Application Auto-Filler: - window.debugCurrentForm() - analyze current form fields in detail');
console.log('Job Application Auto-Filler: - window.debugRadioButtons() - analyze radio button groups specifically');
