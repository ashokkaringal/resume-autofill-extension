# Resume Autofill System

A robust, AI-powered resume autofill system that combines Python scripts with LLM integration for intelligent job application automation.

## 🚀 Features

- **Multi-format Resume Parsing**: Supports PDF, Word, and text files
- **AI-Powered Data Extraction**: Uses OpenAI GPT-4 or Anthropic Claude for structured data extraction
- **Intelligent Form Filling**: Automatically detects and fills job application forms
- **Platform-Specific Optimization**: Optimized for LinkedIn, Greenhouse, Workday, and other major platforms
- **Tailored Content Generation**: Creates customized cover letters and answers
- **Browser Automation**: Uses Selenium or Playwright for reliable form interaction
- **Rich CLI Interface**: Beautiful terminal output with progress tracking

## 🏗️ Architecture

The system follows a multi-step architectural approach:

1. **Resume Parsing**: Python scripts extract raw text from various resume formats
2. **Structured Data Extraction**: LLM processes text and outputs structured JSON data
3. **Job Description Analysis**: Optional analysis of job requirements for better matching
4. **Browser Automation**: Intelligent form detection and filling using Selenium/Playwright
5. **Content Generation**: Tailored cover letters and custom answers based on resume and job data

## 📋 Requirements

- Python 3.8+
- Chrome browser (for Selenium automation)
- API keys for OpenAI or Anthropic

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ResumeFillerNew1
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Playwright browsers** (optional, for Playwright automation):
   ```bash
   playwright install
   ```

4. **Set up environment variables**:
   ```bash
   cp env_example.txt .env
   # Edit .env with your API keys
   ```

## 🔑 Configuration

### Environment Variables

Create a `.env` file with your API keys:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (alternative)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Configuration File

The system uses `config.json` for customizable settings:

```json
{
  "llm_provider": "openai",
  "browser_type": "selenium",
  "headless": false,
  "timeout": 30
}
```

## 🚀 Usage

### Basic Resume Processing

```bash
# Process resume and extract structured data
python main.py --resume path/to/resume.pdf
```

### Job Description Analysis

```bash
# Analyze job description and extract requirements
python main.py --resume resume.pdf --job-description job.txt
```

### Generate Tailored Content

```bash
# Generate customized cover letter
python main.py --resume resume.pdf --job-description job.txt --generate cover_letter

# Generate custom answers
python main.py --resume resume.pdf --job-description job.txt --generate answers
```

### Automated Form Filling

```bash
# Fill job application form automatically
python main.py --resume resume.pdf --url "https://company.com/apply"

# Use specific browser automation
python main.py --resume resume.pdf --url "https://company.com/apply" --browser playwright

# Run in headless mode
python main.py --resume resume.pdf --url "https://company.com/apply" --headless
```

### Advanced Options

```bash
# Use specific LLM provider
python main.py --resume resume.pdf --llm-provider anthropic

# Save outputs to directory
python main.py --resume resume.pdf --url "https://company.com/apply" --output-dir ./output

# Use custom configuration
python main.py --resume resume.pdf --config custom_config.json
```

## 📁 Project Structure

```
ResumeFillerNew1/
├── main.py                 # Main orchestration script
├── resume_parser.py        # Resume parsing and text extraction
├── llm_processor.py        # LLM integration and data processing
├── browser_automation.py   # Browser automation and form filling
├── config.json             # Configuration file
├── requirements.txt        # Python dependencies
├── env_example.txt         # Environment variables template
├── README.md              # This file
└── output/                # Generated content and screenshots
```

## 🔧 Module Details

### Resume Parser (`resume_parser.py`)

- Supports PDF, Word, and text formats
- Multiple PDF parsing methods (pdfplumber, PyPDF2)
- Text cleaning and normalization
- Section identification and extraction

### LLM Processor (`llm_processor.py`)

- OpenAI GPT-4 and Anthropic Claude integration
- Structured data extraction using Pydantic schemas
- Job requirement analysis
- Tailored content generation

### Browser Automation (`browser_automation.py`)

- Selenium and Playwright support
- Platform-specific field detection
- Intelligent form filling
- Error handling and screenshots

## 🌐 Supported Platforms

- **LinkedIn**: Optimized field detection and filling
- **Greenhouse**: Custom selectors and field mapping
- **Workday**: Complex ID-based field detection
- **Lever**: Specialized form handling
- **Generic**: Universal field detection patterns

## 📊 Data Models

The system uses Pydantic models for structured data:

- `ContactInfo`: Personal and contact information
- `WorkExperience`: Job history and achievements
- `Education`: Academic background
- `Skills`: Technical and soft skills
- `JobRequirements`: Extracted job specifications

## 🚨 Error Handling

- Comprehensive logging and error tracking
- Automatic screenshots on failures
- Retry mechanisms for transient errors
- Graceful degradation for unsupported fields

## 🔒 Security Features

- Environment variable-based API key management
- Optional data encryption
- Secure storage options
- No hardcoded credentials

## 🧪 Testing

Test individual components:

```bash
# Test resume parser
python resume_parser.py --resume-file test_resume.pdf --clean --sections

# Test LLM processor
python llm_processor.py --provider openai --resume-file test_resume.pdf

# Test browser automation
python browser_automation.py --url "https://example.com" --browser selenium
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your `.env` file contains valid API keys
2. **Browser Issues**: Update Chrome or try Playwright as alternative
3. **Field Detection**: Some forms may require custom selectors
4. **Rate Limiting**: Respect API rate limits and add delays if needed

### Getting Help

- Check the logs for detailed error information
- Verify your configuration settings
- Ensure all dependencies are properly installed
- Test with a simple form first

## 🔮 Future Enhancements

- **Multi-language Support**: Resume parsing in different languages
- **Advanced AI Models**: Integration with more LLM providers
- **Form Templates**: Pre-built templates for common platforms
- **Batch Processing**: Handle multiple applications simultaneously
- **Mobile Support**: Mobile app and responsive web interface
- **Analytics Dashboard**: Track application success rates and metrics

---

**Note**: This system is designed for legitimate job applications. Please respect website terms of service and use responsibly.
