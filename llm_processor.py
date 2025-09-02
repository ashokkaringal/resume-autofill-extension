#!/usr/bin/env python3
"""
LLM Processor Module
Uses LLM to extract structured data from resume text and job descriptions
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import openai
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContactInfo(BaseModel):
    """Contact information extracted from resume."""
    firstName: str = Field(..., description="First name")
    lastName: str = Field(..., description="Last name")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL")
    website: Optional[str] = Field(None, description="Personal website")
    address: Optional[str] = Field(None, description="Full address")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State/Province")
    zip: Optional[str] = Field(None, description="ZIP/Postal code")
    country: Optional[str] = Field(None, description="Country")


class WorkExperience(BaseModel):
    """Work experience entry."""
    company: str = Field(..., description="Company name")
    title: str = Field(..., description="Job title")
    startDate: Optional[str] = Field(None, description="Start date (YYYY-MM or YYYY)")
    endDate: Optional[str] = Field(None, description="End date (YYYY-MM or YYYY) or 'Present'")
    duration: Optional[str] = Field(None, description="Duration in years/months")
    description: Optional[str] = Field(None, description="Job description")
    achievements: Optional[List[str]] = Field(None, description="Key achievements")
    technologies: Optional[List[str]] = Field(None, description="Technologies used")


class Education(BaseModel):
    """Education entry."""
    institution: str = Field(..., description="Institution name")
    degree: str = Field(..., description="Degree obtained")
    field: Optional[str] = Field(None, description="Field of study")
    graduationYear: Optional[str] = Field(None, description="Graduation year")
    gpa: Optional[str] = Field(None, description="GPA if available")


class Skills(BaseModel):
    """Skills and competencies."""
    technical: Optional[List[str]] = Field(None, description="Technical skills")
    programming: Optional[List[str]] = Field(None, description="Programming languages")
    frameworks: Optional[List[str]] = Field(None, description="Frameworks and libraries")
    tools: Optional[List[str]] = Field(None, description="Tools and software")
    soft_skills: Optional[List[str]] = Field(None, description="Soft skills")
    languages: Optional[List[str]] = Field(None, description="Spoken languages")


class ResumeData(BaseModel):
    """Complete structured resume data."""
    contact: ContactInfo
    summary: Optional[str] = Field(None, description="Professional summary")
    experience: List[WorkExperience] = Field(default_factory=list, description="Work experience")
    education: List[Education] = Field(default_factory=list, description="Education")
    skills: Skills
    certifications: Optional[List[str]] = Field(None, description="Certifications")
    projects: Optional[List[str]] = Field(None, description="Notable projects")


class JobRequirements(BaseModel):
    """Job requirements extracted from job description."""
    required_skills: List[str] = Field(default_factory=list, description="Required technical skills")
    preferred_skills: List[str] = Field(default_factory=list, description="Preferred skills")
    experience_level: Optional[str] = Field(None, description="Required experience level")
    education_requirements: Optional[str] = Field(None, description="Education requirements")
    responsibilities: List[str] = Field(default_factory=list, description="Key responsibilities")
    company_info: Optional[str] = Field(None, description="Company information")


class LLMProcessor:
    """Process resume text and job descriptions using LLM."""
    
    def __init__(self, provider: str = "openai"):
        """
        Initialize LLM processor.
        
        Args:
            provider: LLM provider ("openai" or "anthropic")
        """
        self.provider = provider
        self.client = None
        
        if provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")
            self.client = openai.OpenAI(api_key=api_key)
        elif provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable not set")
            self.client = anthropic.Anthropic(api_key=api_key)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def extract_resume_data(self, resume_text: str) -> ResumeData:
        """
        Extract structured resume data using LLM.
        
        Args:
            resume_text: Cleaned resume text
            
        Returns:
            Structured ResumeData object
        """
        logger.info("Extracting structured resume data using LLM")
        
        prompt = self._create_resume_extraction_prompt(resume_text)
        
        try:
            if self.provider == "openai":
                response = self._call_openai(prompt)
            else:
                response = self._call_anthropic(prompt)
            
            # Parse the response
            parsed_data = self._parse_llm_response(response)
            return ResumeData(**parsed_data)
            
        except Exception as e:
            logger.error(f"Error extracting resume data: {e}")
            raise
    
    def analyze_job_description(self, job_text: str) -> JobRequirements:
        """
        Analyze job description and extract requirements.
        
        Args:
            job_text: Job description text
            
        Returns:
            JobRequirements object
        """
        logger.info("Analyzing job description using LLM")
        
        prompt = self._create_job_analysis_prompt(job_text)
        
        try:
            if self.provider == "openai":
                response = self._call_openai(prompt)
            else:
                response = self._call_anthropic(prompt)
            
            # Parse the response
            parsed_data = self._parse_llm_response(response)
            return JobRequirements(**parsed_data)
            
        except Exception as e:
            logger.error(f"Error analyzing job description: {e}")
            raise
    
    def generate_tailored_content(self, resume_data: ResumeData, job_requirements: JobRequirements, 
                                content_type: str = "cover_letter") -> str:
        """
        Generate tailored content based on resume and job requirements.
        
        Args:
            resume_data: Structured resume data
            job_requirements: Job requirements
            content_type: Type of content to generate ("cover_letter", "answers", etc.)
            
        Returns:
            Generated content
        """
        logger.info(f"Generating tailored {content_type} using LLM")
        
        prompt = self._create_content_generation_prompt(resume_data, job_requirements, content_type)
        
        try:
            if self.provider == "openai":
                response = self._call_openai(prompt)
            else:
                response = self._call_anthropic(prompt)
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating tailored content: {e}")
            raise
    
    def _create_resume_extraction_prompt(self, resume_text: str) -> str:
        """Create prompt for resume data extraction."""
        return f"""
You are an expert resume parser. Extract structured information from the following resume text and return it as a valid JSON object.

Resume Text:
{resume_text}

Please extract the following information and format it as JSON:
- Contact information (name, email, phone, address, LinkedIn, website)
- Professional summary
- Work experience (company, title, dates, description, achievements, technologies)
- Education (institution, degree, field, graduation year)
- Skills (technical, programming, frameworks, tools, soft skills)
- Certifications
- Notable projects

Return ONLY the JSON object, no additional text or explanations.
"""
    
    def _create_job_analysis_prompt(self, job_text: str) -> str:
        """Create prompt for job description analysis."""
        return f"""
You are an expert job analyst. Analyze the following job description and extract key requirements and information.

Job Description:
{job_text}

Please extract the following information and format it as JSON:
- Required technical skills
- Preferred skills
- Experience level required
- Education requirements
- Key responsibilities
- Company information

Return ONLY the JSON object, no additional text or explanations.
"""
    
    def _create_content_generation_prompt(self, resume_data: ResumeData, job_requirements: JobRequirements, 
                                        content_type: str) -> str:
        """Create prompt for content generation."""
        if content_type == "cover_letter":
            return f"""
You are an expert cover letter writer. Create a compelling cover letter based on the following resume and job requirements.

Resume Summary:
{resume_data.summary or "Not provided"}

Key Experience:
{self._format_experience_for_prompt(resume_data.experience)}

Skills:
{self._format_skills_for_prompt(resume_data.skills)}

Job Requirements:
Required Skills: {', '.join(job_requirements.required_skills)}
Responsibilities: {', '.join(job_requirements.responsibilities)}

Write a professional, tailored cover letter that highlights relevant experience and skills for this position.
"""
        else:
            return f"""
Generate tailored content based on the resume and job requirements.

Resume Data: {resume_data.json()}
Job Requirements: {job_requirements.json()}

Content Type: {content_type}

Generate appropriate content for this request.
"""
    
    def _format_experience_for_prompt(self, experience: List[WorkExperience]) -> str:
        """Format experience for prompt."""
        formatted = []
        for exp in experience:
            formatted.append(f"{exp.title} at {exp.company} ({exp.startDate}-{exp.endDate})")
        return "\n".join(formatted)
    
    def _format_skills_for_prompt(self, skills: Skills) -> str:
        """Format skills for prompt."""
        skill_lists = []
        if skills.technical:
            skill_lists.append(f"Technical: {', '.join(skills.technical)}")
        if skills.programming:
            skill_lists.append(f"Programming: {', '.join(skills.programming)}")
        if skills.frameworks:
            skill_lists.append(f"Frameworks: {', '.join(skills.frameworks)}")
        return "\n".join(skill_lists)
    
    def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API."""
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured information from text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
        return response.choices[0].message.content
    
    def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic API."""
        response = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            temperature=0.1,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text
    
    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM response and extract JSON."""
        try:
            # Try to find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response: {response}")
            raise ValueError(f"Invalid JSON response from LLM: {e}")


def main():
    """Test the LLM processor."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test LLM processor')
    parser.add_argument('--provider', choices=['openai', 'anthropic'], default='openai',
                       help='LLM provider to use')
    parser.add_argument('--resume-file', help='Path to resume file for testing')
    parser.add_argument('--job-file', help='Path to job description file for testing')
    
    args = parser.parse_args()
    
    try:
        processor = LLMProcessor(provider=args.provider)
        print(f"Initialized LLM processor with {args.provider}")
        
        if args.resume_file:
            from resume_parser import ResumeParser
            
            # Parse resume
            resume_parser = ResumeParser()
            parsed_resume = resume_parser.parse_resume(args.resume_file)
            cleaned_text = resume_parser.clean_text(parsed_resume['text'])
            
            print(f"\nParsed resume: {parsed_resume['file_path']}")
            print(f"Text length: {len(cleaned_text)} characters")
            
            # Extract structured data
            resume_data = processor.extract_resume_data(cleaned_text)
            print(f"\nExtracted structured data:")
            print(f"Name: {resume_data.contact.firstName} {resume_data.contact.lastName}")
            print(f"Experience entries: {len(resume_data.experience)}")
            print(f"Skills: {len(resume_data.skills.technical or [])} technical skills")
        
        if args.job_file:
            with open(args.job_file, 'r') as f:
                job_text = f.read()
            
            # Analyze job description
            job_requirements = processor.analyze_job_description(job_text)
            print(f"\nJob requirements:")
            print(f"Required skills: {', '.join(job_requirements.required_skills)}")
            print(f"Responsibilities: {len(job_requirements.responsibilities)} items")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())

