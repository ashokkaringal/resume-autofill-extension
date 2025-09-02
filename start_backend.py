#!/usr/bin/env python3
"""
Start the Python backend service for Chrome extension integration
"""

import os
import sys
from pathlib import Path

def main():
    """Start the extension backend service."""
    print("🚀 Starting Resume Autofill Extension Backend...")
    
    # Check if extension_integration.py exists
    if not Path("extension_integration.py").exists():
        print("❌ extension_integration.py not found!")
        print("Please run this script from the project directory.")
        return 1
    
    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("⚠️  .env file not found. Creating from template...")
        env_example = Path("env_example.txt")
        if env_example.exists():
            import shutil
            shutil.copy(env_example, env_file)
            print("✅ Created .env file from template")
            print("⚠️  Please edit .env file with your API keys before using AI features")
        else:
            print("⚠️  No .env template found. AI features will not work.")
    
    # Set default port
    os.environ.setdefault('EXTENSION_PORT', '5000')
    os.environ.setdefault('FLASK_DEBUG', 'False')
    
    print(f"🌐 Backend will start on port {os.environ['EXTENSION_PORT']}")
    print("📝 Make sure your Chrome extension is configured to connect to this backend")
    print("🔧 Press Ctrl+C to stop the service")
    print()
    
    try:
        # Import and run the extension integration service
        from extension_integration import app, backend
        
        port = int(os.environ['EXTENSION_PORT'])
        debug = os.environ['FLASK_DEBUG'].lower() == 'true'
        
        print(f"✅ Backend service ready!")
        print(f"📊 LLM Available: {backend.llm_processor is not None}")
        print(f"🔗 Health check: http://localhost:{port}/health")
        print()
        
        app.run(host='0.0.0.0', port=port, debug=debug)
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please install dependencies first:")
        print("  python setup.py")
        return 1
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())

