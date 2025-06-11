#!/bin/bash

# Test script to verify backend functionality
echo "🧪 Testing MicroCrowd Enhanced Backend..."

BACKEND_DIR="../microcrowd-enhanced/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Test import of main modules
echo "🔍 Testing Python imports..."
python3 -c "
try:
    from app.main import app
    from app.api import personas, conversations, validation
    from app.models.personality import PersonalityFramework
    from app.models.persona import EnhancedPersona
    print('✅ All imports successful')
except ImportError as e:
    print(f'❌ Import error: {e}')
    exit(1)
"

echo "✅ Backend test completed successfully!"
echo "💡 To start the full application, run: ./start-microcrowd.sh"