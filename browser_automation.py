#!/usr/bin/env python3
"""
Browser Automation Module
Uses Selenium and Playwright for form filling and navigation
"""

import time
import logging
from typing import Dict, Any, List, Optional, Union
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from playwright.sync_api import sync_playwright, Page, Browser
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FormField:
    """Represents a form field with identification and filling logic."""
    
    def __init__(self, field_type: str, selectors: List[str], value: Any, 
                 required: bool = True, validation: Optional[str] = None):
        self.field_type = field_type  # text, select, checkbox, radio, textarea
        self.selectors = selectors  # Multiple selectors to try
        self.value = value
        self.required = required
        self.validation = validation
        self.filled = False
        self.error = None


class BrowserAutomation:
    """Handle browser automation for job application forms."""
    
    def __init__(self, browser_type: str = "selenium", headless: bool = False):
        """
        Initialize browser automation.
        
        Args:
            browser_type: "selenium" or "playwright"
            headless: Run browser in headless mode
        """
        self.browser_type = browser_type
        self.headless = headless
        self.driver = None
        self.page = None
        self.browser = None
        self.playwright = None
        
        if browser_type == "selenium":
            self._setup_selenium()
        elif browser_type == "playwright":
            self._setup_playwright()
        else:
            raise ValueError(f"Unsupported browser type: {browser_type}")
    
    def _setup_selenium(self):
        """Setup Selenium WebDriver."""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            # Auto-download and setup ChromeDriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            logger.info("Selenium WebDriver initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Selenium: {e}")
            raise
    
    def _setup_playwright(self):
        """Setup Playwright browser."""
        try:
            self.playwright = sync_playwright().start()
            
            if self.headless:
                self.browser = self.playwright.chromium.launch(headless=True)
            else:
                self.browser = self.playwright.chromium.launch(headless=False)
            
            self.page = self.browser.new_page()
            logger.info("Playwright browser initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Playwright: {e}")
            raise
    
    def navigate_to(self, url: str) -> bool:
        """
        Navigate to a specific URL.
        
        Args:
            url: URL to navigate to
            
        Returns:
            True if navigation successful
        """
        try:
            if self.browser_type == "selenium":
                self.driver.get(url)
                # Wait for page to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            else:
                self.page.goto(url)
                self.page.wait_for_load_state("networkidle")
            
            logger.info(f"Successfully navigated to: {url}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {e}")
            return False
    
    def detect_platform(self) -> str:
        """
        Detect the job application platform based on current URL.
        
        Returns:
            Platform identifier
        """
        try:
            if self.browser_type == "selenium":
                current_url = self.driver.current_url
            else:
                current_url = self.page.url
            
            # Platform detection patterns
            if "linkedin.com" in current_url:
                return "linkedin"
            elif "greenhouse.io" in current_url:
                return "greenhouse"
            elif "workday.com" in current_url:
                return "workday"
            elif "lever.co" in current_url:
                return "lever"
            elif "bamboohr.com" in current_url:
                return "bamboohr"
            elif "icims.com" in current_url:
                return "icims"
            else:
                return "generic"
                
        except Exception as e:
            logger.error(f"Failed to detect platform: {e}")
            return "unknown"
    
    def find_form_fields(self, platform: str) -> List[FormField]:
        """
        Find form fields based on platform-specific patterns.
        
        Args:
            platform: Job application platform
            
        Returns:
            List of detected form fields
        """
        fields = []
        
        try:
            if platform == "linkedin":
                fields = self._find_linkedin_fields()
            elif platform == "greenhouse":
                fields = self._find_greenhouse_fields()
            elif platform == "workday":
                fields = self._find_workday_fields()
            elif platform == "lever":
                fields = self._find_lever_fields()
            else:
                fields = self._find_generic_fields()
            
            logger.info(f"Found {len(fields)} form fields for platform: {platform}")
            return fields
            
        except Exception as e:
            logger.error(f"Failed to find form fields: {e}")
            return []
    
    def _find_linkedin_fields(self) -> List[FormField]:
        """Find LinkedIn-specific form fields."""
        fields = []
        
        # Common LinkedIn field patterns
        field_patterns = [
            ("firstName", ["input[name='firstName']", "input[placeholder*='First name']"]),
            ("lastName", ["input[name='lastName']", "input[placeholder*='Last name']"]),
            ("email", ["input[name='email']", "input[type='email']"]),
            ("phone", ["input[name='phone']", "input[type='tel']"]),
            ("address", ["input[name='address']", "textarea[name='address']"]),
            ("city", ["input[name='city']", "input[placeholder*='City']"]),
            ("state", ["select[name='state']", "input[name='state']"]),
            ("zip", ["input[name='zip']", "input[name='postalCode']"]),
            ("country", ["select[name='country']", "input[name='country']"]),
        ]
        
        for field_name, selectors in field_patterns:
            field = self._create_field_from_selectors(field_name, selectors)
            if field:
                fields.append(field)
        
        return fields
    
    def _find_greenhouse_fields(self) -> List[FormField]:
        """Find Greenhouse-specific form fields."""
        fields = []
        
        # Greenhouse field patterns
        field_patterns = [
            ("firstName", ["input[name='first_name']", "input[id*='first_name']"]),
            ("lastName", ["input[name='last_name']", "input[id*='last_name']"]),
            ("email", ["input[name='email']", "input[type='email']"]),
            ("phone", ["input[name='phone']", "input[type='tel']"]),
            ("address", ["textarea[name='address']", "input[name='address']"]),
            ("city", ["input[name='city']", "input[id*='city']"]),
            ("state", ["select[name='state']", "input[name='state']"]),
            ("zip", ["input[name='zip']", "input[name='postal_code']"]),
            ("country", ["select[name='country']", "input[name='country']"]),
        ]
        
        for field_name, selectors in field_patterns:
            field = self._create_field_from_selectors(field_name, selectors)
            if field:
                fields.append(field)
        
        return fields
    
    def _find_workday_fields(self) -> List[FormField]:
        """Find Workday-specific form fields."""
        fields = []
        
        # Workday field patterns (often use complex IDs)
        field_patterns = [
            ("firstName", ["input[id*='firstName']", "input[name*='firstName']"]),
            ("lastName", ["input[id*='lastName']", "input[name*='lastName']"]),
            ("email", ["input[type='email']", "input[id*='email']"]),
            ("phone", ["input[type='tel']", "input[id*='phone']"]),
            ("address", ["textarea[id*='address']", "input[id*='address']"]),
        ]
        
        for field_name, selectors in field_patterns:
            field = self._create_field_from_selectors(field_name, selectors)
            if field:
                fields.append(field)
        
        return fields
    
    def _find_lever_fields(self) -> List[FormField]:
        """Find Lever-specific form fields."""
        fields = []
        
        # Lever field patterns
        field_patterns = [
            ("firstName", ["input[name='name']", "input[placeholder*='First']"]),
            ("lastName", ["input[name='name']", "input[placeholder*='Last']"]),
            ("email", ["input[name='email']", "input[type='email']"]),
            ("phone", ["input[name='phone']", "input[type='tel']"]),
            ("address", ["textarea[name='address']", "input[name='address']"]),
        ]
        
        for field_name, selectors in field_patterns:
            field = self._create_field_from_selectors(field_name, selectors)
            if field:
                fields.append(field)
        
        return fields
    
    def _find_generic_fields(self) -> List[FormField]:
        """Find generic form fields using common patterns."""
        fields = []
        
        # Generic field patterns
        field_patterns = [
            ("firstName", ["input[name*='first']", "input[id*='first']", "input[placeholder*='First']"]),
            ("lastName", ["input[name*='last']", "input[id*='last']", "input[placeholder*='Last']"]),
            ("email", ["input[type='email']", "input[name*='email']", "input[id*='email']"]),
            ("phone", ["input[type='tel']", "input[name*='phone']", "input[id*='phone']"]),
            ("address", ["textarea[name*='address']", "input[name*='address']", "textarea[id*='address']"]),
            ("city", ["input[name*='city']", "input[id*='city']"]),
            ("state", ["select[name*='state']", "input[name*='state']"]),
            ("zip", ["input[name*='zip']", "input[name*='postal']", "input[id*='zip']"]),
            ("country", ["select[name*='country']", "input[name*='country']"]),
        ]
        
        for field_name, selectors in field_patterns:
            field = self._create_field_from_selectors(field_name, selectors)
            if field:
                fields.append(field)
        
        return fields
    
    def _create_field_from_selectors(self, field_name: str, selectors: List[str]) -> Optional[FormField]:
        """Create a FormField object if any selector matches."""
        for selector in selectors:
            try:
                if self.browser_type == "selenium":
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                else:
                    element = self.page.query_selector(selector)
                
                if element:
                    # Determine field type
                    field_type = self._determine_field_type(element)
                    
                    # Create field with default value
                    field = FormField(
                        field_type=field_type,
                        selectors=[selector],
                        value="",  # Will be filled later
                        required=True
                    )
                    
                    logger.debug(f"Found field: {field_name} with selector: {selector}")
                    return field
                    
            except (NoSuchElementException, Exception):
                continue
        
        return None
    
    def _determine_field_type(self, element) -> str:
        """Determine the type of form field."""
        try:
            if self.browser_type == "selenium":
                tag_name = element.tag_name.lower()
                input_type = element.get_attribute("type")
            else:
                tag_name = element.tag_name.lower()
                input_type = element.get_attribute("type")
            
            if tag_name == "select":
                return "select"
            elif tag_name == "textarea":
                return "textarea"
            elif input_type == "checkbox":
                return "checkbox"
            elif input_type == "radio":
                return "radio"
            else:
                return "text"
                
        except Exception:
            return "text"
    
    def fill_form_fields(self, fields: List[FormField], resume_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fill form fields with resume data.
        
        Args:
            fields: List of form fields to fill
            resume_data: Structured resume data
            
        Returns:
            Dictionary with filling results
        """
        results = {
            'filled': 0,
            'failed': 0,
            'errors': [],
            'field_results': {}
        }
        
        # Map resume data to field names
        field_mapping = self._create_field_mapping(resume_data)
        
        for field in fields:
            try:
                success = self._fill_single_field(field, field_mapping)
                
                if success:
                    results['filled'] += 1
                    results['field_results'][field.field_type] = 'success'
                else:
                    results['failed'] += 1
                    results['field_results'][field.field_type] = 'failed'
                    results['errors'].append(f"Failed to fill {field.field_type}")
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error filling {field.field_type}: {str(e)}")
                logger.error(f"Error filling field {field.field_type}: {e}")
        
        logger.info(f"Form filling completed: {results['filled']} filled, {results['failed']} failed")
        return results
    
    def _create_field_mapping(self, resume_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create mapping between field names and resume data."""
        mapping = {}
        
        # Contact information
        if 'contact' in resume_data:
            contact = resume_data['contact']
            mapping.update({
                'firstName': contact.get('firstName', ''),
                'lastName': contact.get('lastName', ''),
                'email': contact.get('email', ''),
                'phone': contact.get('phone', ''),
                'address': contact.get('address', ''),
                'city': contact.get('city', ''),
                'state': contact.get('state', ''),
                'zip': contact.get('zip', ''),
                'country': contact.get('country', ''),
            })
        
        # Experience
        if 'experience' in resume_data and resume_data['experience']:
            latest_exp = resume_data['experience'][0]
            mapping.update({
                'company': latest_exp.get('company', ''),
                'title': latest_exp.get('title', ''),
                'experience': latest_exp.get('description', ''),
            })
        
        # Skills
        if 'skills' in resume_data:
            skills = resume_data['skills']
            if skills.get('technical'):
                mapping['skills'] = ', '.join(skills['technical'])
            elif skills.get('programming'):
                mapping['skills'] = ', '.join(skills['programming'])
        
        return mapping
    
    def _fill_single_field(self, field: FormField, field_mapping: Dict[str, Any]) -> bool:
        """Fill a single form field."""
        try:
            # Find the element
            element = None
            for selector in field.selectors:
                try:
                    if self.browser_type == "selenium":
                        element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    else:
                        element = self.page.query_selector(selector)
                    
                    if element:
                        break
                except:
                    continue
            
            if not element:
                logger.warning(f"Could not find element for field: {field.field_type}")
                return False
            
            # Get the value to fill
            value = self._get_field_value(field.field_type, field_mapping)
            
            if not value:
                logger.debug(f"No value to fill for field: {field.field_type}")
                return False
            
            # Fill the field based on type
            if field.field_type == "text":
                return self._fill_text_field(element, value)
            elif field.field_type == "select":
                return self._fill_select_field(element, value)
            elif field.field_type == "textarea":
                return self._fill_textarea_field(element, value)
            elif field.field_type == "checkbox":
                return self._fill_checkbox_field(element, value)
            else:
                return self._fill_text_field(element, value)
                
        except Exception as e:
            logger.error(f"Error filling field {field.field_type}: {e}")
            return False
    
    def _get_field_value(self, field_type: str, field_mapping: Dict[str, Any]) -> Any:
        """Get the appropriate value for a field type."""
        # Simple mapping - could be enhanced with more sophisticated logic
        field_name = field_type.lower()
        
        for key, value in field_mapping.items():
            if field_name in key.lower() or key.lower() in field_name:
                return value
        
        return None
    
    def _fill_text_field(self, element, value: str) -> bool:
        """Fill a text input field."""
        try:
            if self.browser_type == "selenium":
                element.clear()
                element.send_keys(value)
            else:
                element.fill(value)
            
            time.sleep(0.1)  # Small delay for stability
            return True
            
        except Exception as e:
            logger.error(f"Error filling text field: {e}")
            return False
    
    def _fill_select_field(self, element, value: str) -> bool:
        """Fill a select dropdown field."""
        try:
            if self.browser_type == "selenium":
                select = Select(element)
                # Try to find option by text
                for option in select.options:
                    if value.lower() in option.text.lower():
                        select.select_by_visible_text(option.text)
                        return True
                
                # Fallback to first option
                select.select_by_index(0)
            else:
                # Playwright select handling
                element.select_option(label=value)
            
            return True
            
        except Exception as e:
            logger.error(f"Error filling select field: {e}")
            return False
    
    def _fill_textarea_field(self, element, value: str) -> bool:
        """Fill a textarea field."""
        return self._fill_text_field(element, value)
    
    def _fill_checkbox_field(self, element, value: Any) -> bool:
        """Fill a checkbox field."""
        try:
            if self.browser_type == "selenium":
                if value and not element.is_selected():
                    element.click()
                elif not value and element.is_selected():
                    element.click()
            else:
                if value:
                    element.check()
                else:
                    element.uncheck()
            
            return True
            
        except Exception as e:
            logger.error(f"Error filling checkbox field: {e}")
            return False
    
    def wait_for_page_load(self, timeout: int = 10) -> bool:
        """Wait for page to fully load."""
        try:
            if self.browser_type == "selenium":
                WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            else:
                self.page.wait_for_load_state("networkidle", timeout=timeout * 1000)
            
            return True
            
        except TimeoutException:
            logger.warning(f"Page load timeout after {timeout} seconds")
            return False
    
    def take_screenshot(self, filename: str = None) -> str:
        """Take a screenshot of the current page."""
        if not filename:
            timestamp = int(time.time())
            filename = f"screenshot_{timestamp}.png"
        
        try:
            if self.browser_type == "selenium":
                self.driver.save_screenshot(filename)
            else:
                self.page.screenshot(path=filename)
            
            logger.info(f"Screenshot saved: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"Failed to take screenshot: {e}")
            return ""
    
    def close(self):
        """Close browser and cleanup."""
        try:
            if self.browser_type == "selenium":
                if self.driver:
                    self.driver.quit()
            else:
                if self.browser:
                    self.browser.close()
                if self.playwright:
                    self.playwright.stop()
            
            logger.info("Browser automation closed successfully")
            
        except Exception as e:
            logger.error(f"Error closing browser: {e}")


def main():
    """Test the browser automation."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test browser automation')
    parser.add_argument('--url', required=True, help='URL to navigate to')
    parser.add_argument('--browser', choices=['selenium', 'playwright'], default='selenium',
                       help='Browser automation type')
    parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    parser.add_argument('--screenshot', help='Take screenshot with specified filename')
    
    args = parser.parse_args()
    
    automation = None
    try:
        automation = BrowserAutomation(browser_type=args.browser, headless=args.headless)
        
        # Navigate to URL
        if automation.navigate_to(args.url):
            print(f"Successfully navigated to: {args.url}")
            
            # Detect platform
            platform = automation.detect_platform()
            print(f"Detected platform: {platform}")
            
            # Find form fields
            fields = automation.find_form_fields(platform)
            print(f"Found {len(fields)} form fields")
            
            # Wait for page load
            automation.wait_for_page_load()
            
            # Take screenshot if requested
            if args.screenshot:
                screenshot_path = automation.take_screenshot(args.screenshot)
                if screenshot_path:
                    print(f"Screenshot saved: {screenshot_path}")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    finally:
        if automation:
            automation.close()
    
    return 0


if __name__ == '__main__':
    exit(main())

