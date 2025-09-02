# 🚀 Quick Start Guide

Get up and running with the Resume Autofill System in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
# Run the automated setup
python setup.py
```

### 2. Start the Python Backend (for AI features)
```bash
# Start the backend service
python start_backend.py
```

This will:
- ✅ Install all Python packages
- ✅ Set up Playwright browsers
- ✅ Create necessary directories
- ✅ Set up environment file

### 2. Configure API Keys
```bash
# Edit the .env file with your API keys
nano .env  # or use your preferred editor
```

Add your API keys:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

### 3. Test the System
```bash
# Run comprehensive tests
python test_system.py
```

## 🎯 Common Use Cases

### Chrome Extension (Recommended)
1. **Load your extension** in Chrome (chrome://extensions/ → Load unpacked)
2. **Start the backend**: `python start_backend.py`
3. **Navigate to any job application page**
4. **Click "Go Fill"** - now with AI-powered intelligence!

### Command Line (Alternative)
```bash
# Process your resume
python main.py --resume your_resume.pdf
```

### Analyze Job Description
```bash
python main.py --resume resume.pdf --job-description job.txt
```

### Generate Cover Letter
```bash
python main.py --resume resume.pdf --job-description job.txt --generate cover_letter
```

### Fill Job Application
```bash
python main.py --resume resume.pdf --url "https://company.com/apply"
```

## 🔧 Troubleshooting

### "Module not found" errors?
```bash
python setup.py  # Install dependencies
```

### "API key not set" errors?
```bash
# Check your .env file
cat .env
# Make sure it contains your API key
```

### Browser automation issues?
```bash
# Try Playwright instead of Selenium
python main.py --resume resume.pdf --url "https://example.com" --browser playwright
```

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Try with a real resume** to see the system in action
3. **Customize the config.json** for your specific needs
4. **Join the community** for support and updates

## 🆘 Need Help?

- Check the logs for detailed error information
- Run `python main.py --help` for command options
- Review the troubleshooting section in README.md
- Test individual components with the test scripts

---

**Happy job hunting! 🎉**
