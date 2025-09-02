#!/usr/bin/env python3
"""
Extension Integration Service
Python backend service that the Chrome extension calls for intelligent form filling
"""

import os
import json
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import tempfile
from werkzeug.utils import secure_filename

# Import our modules
from resume_parser import ResumeParser
from llm_processor import LLMProcessor
from browser_automation import BrowserAutomation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["*"], methods=["GET", "POST", "OPTIONS"])  # Enable CORS for Chrome extension

class ExtensionBackend:
    """Backend service for Chrome extension integration."""
    
    def __init__(self):
        self.resume_parser = ResumeParser()
        self.llm_processor = None
        self.browser_automation = None
        self.resume_data = None
        self.job_requirements = None
        
        # Initialize LLM processor if API key is available
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize LLM processor if API key is available."""
        try:
            # Try OpenAI first
            if os.getenv("OPENAI_API_KEY"):
                self.llm_processor = LLMProcessor(provider="openai")
                logger.info("LLM processor initialized with OpenAI")
            elif os.getenv("ANTHROPIC_API_KEY"):
                self.llm_processor = LLMProcessor(provider="anthropic")
                logger.info("LLM processor initialized with Anthropic")
            else:
                logger.warning("No LLM API key found. Using fallback mode.")
        except Exception as e:
            logger.error(f"Failed to initialize LLM processor: {e}")
    
    def process_resume_text(self, resume_text: str) -> Dict[str, Any]:
        """
        Process resume text and extract structured data.
        
        Args:
            resume_text: Raw resume text from extension
            
        Returns:
            Structured resume data
        """
        try:
            if self.llm_processor:
                # Use LLM for intelligent extraction
                logger.info("Processing resume with LLM")
                self.resume_data = self.llm_processor.extract_resume_data(resume_text)
                return {
                    'success': True,
                    'data': self.resume_data.dict(),
                    'method': 'llm'
                }
            else:
                # Fallback to basic parsing
                logger.info("Processing resume with fallback parser")
                cleaned_text = self.resume_parser.clean_text(resume_text)
                sections = self.resume_parser.extract_sections(cleaned_text)
                
                # Create basic structured data
                fallback_data = self._create_fallback_data(cleaned_text, sections)
                self.resume_data = fallback_data
                
                return {
                    'success': True,
                    'data': fallback_data,
                    'method': 'fallback'
                }
                
        except Exception as e:
            logger.error(f"Error processing resume: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'error'
            }
    
    def _create_fallback_data(self, text: str, sections: Dict[str, str]) -> Dict[str, Any]:
        """Create fallback structured data without LLM."""
        # Basic contact extraction using regex patterns
        import re
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        email = email_match.group(0) if email_match else ""
        
        # Extract phone
        phone_match = re.search(r'(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})', text)
        phone = phone_match.group(0) if phone_match else ""
        
        # Extract name (first line usually)
        lines = text.split('\n')
        name = lines[0].strip() if lines else ""
        
        # Split name into first and last
        name_parts = name.split()
        firstName = name_parts[0] if name_parts else ""
        lastName = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        return {
            'contact': {
                'firstName': firstName,
                'lastName': lastName,
                'email': email,
                'phone': phone,
                'address': sections.get('contact', ''),
                'city': '',
                'state': '',
                'zip': '',
                'country': ''
            },
            'summary': sections.get('summary', ''),
            'experience': [],
            'education': [],
            'skills': {
                'technical': [],
                'programming': [],
                'frameworks': [],
                'tools': [],
                'soft_skills': [],
                'languages': []
            },
            'certifications': [],
            'projects': []
        }
    
    def analyze_job_description(self, job_text: str) -> Dict[str, Any]:
        """
        Analyze job description and extract requirements.
        
        Args:
            job_text: Job description text
            
        Returns:
            Job requirements
        """
        try:
            if not self.llm_processor:
                return {
                    'success': False,
                    'error': 'LLM processor not available',
                    'method': 'error'
                }
            
            logger.info("Analyzing job description with LLM")
            self.job_requirements = self.llm_processor.analyze_job_description(job_text)
            
            return {
                'success': True,
                'data': self.job_requirements.dict(),
                'method': 'llm'
            }
            
        except Exception as e:
            logger.error(f"Error analyzing job description: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'error'
            }
    
    def generate_tailored_content(self, content_type: str = "cover_letter") -> Dict[str, Any]:
        """
        Generate tailored content based on resume and job requirements.
        
        Args:
            content_type: Type of content to generate
            
        Returns:
            Generated content
        """
        try:
            if not self.llm_processor:
                return {
                    'success': False,
                    'error': 'LLM processor not available',
                    'method': 'error'
                }
            
            if not self.resume_data or not self.job_requirements:
                return {
                    'success': False,
                    'error': 'Resume data and job requirements must be processed first',
                    'method': 'error'
                }
            
            logger.info(f"Generating {content_type} with LLM")
            content = self.llm_processor.generate_tailored_content(
                self.resume_data, 
                self.job_requirements, 
                content_type
            )
            
            return {
                'success': True,
                'data': content,
                'method': 'llm'
            }
            
        except Exception as e:
            logger.error(f"Error generating content: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'error'
            }
    
    def get_form_filling_data(self, platform: str) -> Dict[str, Any]:
        """
        Get structured data for form filling.
        
        Args:
            platform: Job application platform
            
        Returns:
            Form filling data
        """
        if not self.resume_data:
            return {
                'success': False,
                'error': 'Resume data not available. Process resume first.',
                'method': 'error'
            }
        
        try:
            # Create field mapping for the specific platform
            field_mapping = self._create_platform_field_mapping(platform)
            
            return {
                'success': True,
                'data': field_mapping,
                'method': 'mapping',
                'platform': platform
            }
            
        except Exception as e:
            logger.error(f"Error creating field mapping: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'error'
            }
    
    def _create_platform_field_mapping(self, platform: str) -> Dict[str, Any]:
        """Create field mapping for specific platform."""
        if not self.resume_data:
            return {}
        
        # Base mapping
        mapping = {}
        
        # Contact information
        if hasattr(self.resume_data, 'contact'):
            contact = self.resume_data.contact
            mapping.update({
                'firstName': contact.firstName if hasattr(contact, 'firstName') else '',
                'lastName': contact.lastName if hasattr(contact, 'lastName') else '',
                'email': contact.email if hasattr(contact, 'email') else '',
                'phone': contact.phone if hasattr(contact, 'phone') else '',
                'address': contact.address if hasattr(contact, 'address') else '',
                'city': contact.city if hasattr(contact, 'city') else '',
                'state': contact.state if hasattr(contact, 'state') else '',
                'zip': contact.zip if hasattr(contact, 'zip') else '',
                'country': contact.country if hasattr(contact, 'country') else '',
            })
        elif isinstance(self.resume_data, dict) and 'contact' in self.resume_data:
            contact = self.resume_data['contact']
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
        if hasattr(self.resume_data, 'experience') and self.resume_data.experience:
            latest_exp = self.resume_data.experience[0]
            mapping.update({
                'company': latest_exp.company if hasattr(latest_exp, 'company') else '',
                'title': latest_exp.title if hasattr(latest_exp, 'title') else '',
                'experience': latest_exp.description if hasattr(latest_exp, 'description') else '',
            })
        elif isinstance(self.resume_data, dict) and 'experience' in self.resume_data and self.resume_data['experience']:
            latest_exp = self.resume_data['experience'][0]
            mapping.update({
                'company': latest_exp.get('company', ''),
                'title': latest_exp.get('title', ''),
                'experience': latest_exp.get('description', ''),
            })
        
        # Skills
        if hasattr(self.resume_data, 'skills'):
            skills = self.resume_data.skills
            if hasattr(skills, 'technical') and skills.technical:
                mapping['skills'] = ', '.join(skills.technical)
            elif hasattr(skills, 'programming') and skills.programming:
                mapping['skills'] = ', '.join(skills.programming)
        elif isinstance(self.resume_data, dict) and 'skills' in self.resume_data:
            skills = self.resume_data['skills']
            if skills.get('technical'):
                mapping['skills'] = ', '.join(skills['technical'])
            elif skills.get('programming'):
                mapping['skills'] = ', '.join(skills['programming'])
        
        # Platform-specific adjustments
        if platform == "linkedin":
            # LinkedIn specific mappings
            pass
        elif platform == "greenhouse":
            # Greenhouse specific mappings
            pass
        elif platform == "workday":
            # Workday specific mappings
            pass
        
        return mapping

# Initialize backend
backend = ExtensionBackend()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'llm_available': backend.llm_processor is not None,
        'resume_processed': backend.resume_data is not None
    })

@app.route('/process_resume', methods=['POST'])
def process_resume():
    """Process resume text from extension."""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        
        if not resume_text:
            return jsonify({
                'success': False,
                'error': 'No resume text provided'
            }), 400
        
        result = backend.process_resume_text(resume_text)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in process_resume endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/analyze_job', methods=['POST'])
def analyze_job():
    """Analyze job description from extension."""
    try:
        data = request.get_json()
        job_text = data.get('job_text', '')
        
        if not job_text:
            return jsonify({
                'success': False,
                'error': 'No job description provided'
            }), 400
        
        result = backend.analyze_job_description(job_text)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in analyze_job endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/generate_content', methods=['POST'])
def generate_content():
    """Generate tailored content from extension."""
    try:
        data = request.get_json()
        content_type = data.get('content_type', 'cover_letter')
        
        result = backend.generate_tailored_content(content_type)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in generate_content endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/get_form_data', methods=['POST'])
def get_form_data():
    """Get form filling data for extension."""
    try:
        data = request.get_json()
        platform = data.get('platform', 'generic')
        
        result = backend.get_form_filling_data(platform)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_form_data endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    """Upload and process resume file from extension."""
    try:
        if 'resume' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No resume file provided'
            }), 400
        
        file = request.files['resume']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)
        
        try:
            # Parse resume
            parsed_result = backend.resume_parser.parse_resume(temp_path)
            cleaned_text = backend.resume_parser.clean_text(parsed_result['text'])
            
            # Process with backend
            result = backend.process_resume_text(cleaned_text)
            
            return jsonify(result)
            
        finally:
            # Cleanup temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
    except Exception as e:
        logger.error(f"Error in upload_resume endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Start the service
    port = int(os.getenv('EXTENSION_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting Extension Backend Service on port {port}")
    print(f"📝 LLM Available: {backend.llm_processor is not None}")
    print(f"🌐 Health check: http://localhost:{port}/health")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
