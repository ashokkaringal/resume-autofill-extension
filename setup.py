#!/usr/bin/env python3
"""
Setup script for Resume Autofill System
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def install_dependencies():
    """Install Python dependencies."""
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        return False
    return True

def install_playwright():
    """Install Playwright browsers."""
    if not run_command("playwright install", "Installing Playwright browsers"):
        print("⚠️  Playwright installation failed. You can still use Selenium.")
        return False
    return True

def create_directories():
    """Create necessary directories."""
    directories = ["output", "logs", "screenshots", "temp"]
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")

def setup_environment():
    """Set up environment file."""
    env_file = Path(".env")
    env_example = Path("env_example.txt")
    
    if not env_file.exists() and env_example.exists():
        shutil.copy(env_example, env_file)
        print("✅ Created .env file from template")
        print("⚠️  Please edit .env file with your API keys")
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("⚠️  No .env template found")

def check_chrome():
    """Check if Chrome is available."""
    chrome_paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",  # macOS
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",    # Windows
        "/usr/bin/google-chrome",                                        # Linux
        "/usr/bin/chromium-browser"                                     # Linux alternative
    ]
    
    chrome_found = False
    for path in chrome_paths:
        if os.path.exists(path):
            print(f"✅ Chrome found at: {path}")
            chrome_found = True
            break
    
    if not chrome_found:
        print("⚠️  Chrome not found in standard locations")
        print("   You may need to install Chrome for Selenium automation")
        print("   Or use Playwright instead")
    
    return chrome_found

def main():
    """Main setup function."""
    print("🚀 Setting up Resume Autofill System")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed during dependency installation")
        sys.exit(1)
    
    # Install Playwright (optional)
    install_playwright()
    
    # Create directories
    create_directories()
    
    # Setup environment
    setup_environment()
    
    # Check Chrome
    check_chrome()
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Edit .env file with your API keys")
    print("2. Test the system with: python main.py --help")
    print("3. Process a resume: python main.py --resume your_resume.pdf")
    print("\nFor help, see README.md or run: python main.py --help")

if __name__ == "__main__":
    main()

