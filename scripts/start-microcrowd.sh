#!/bin/bash

# MicroCrowd Enhanced - Full Application Startup Script
# This script starts both the Python backend and React frontend

set -e  # Exit on any error

echo "🚀 Starting MicroCrowd Enhanced Application..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python 3 is installed
print_status "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi
print_success "Python 3 found: $(python3 --version)"

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi
print_success "npm found: $(npm --version)"

# Navigate to backend directory
BACKEND_DIR="../microcrowd-enhanced/backend"
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found at $BACKEND_DIR"
    exit 1
fi

print_status "Setting up Python backend..."
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install/update Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
print_success "Python dependencies installed"

# Check for .env file and create if needed
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating template..."
    cat > .env << EOL
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
DEBUG=True
MAX_PERSONAS_PER_REQUEST=50
DEFAULT_TEMPERATURE=0.7
MAX_RESPONSE_TOKENS=150
CACHE_TTL=3600
EOL
    print_error "Please edit .env file with your OpenAI API key: $BACKEND_DIR/.env"
    print_error "Then run this script again."
    exit 1
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" .env; then
    print_error "Please set your OPENAI_API_KEY in the .env file: $BACKEND_DIR/.env"
    exit 1
fi

print_success "Backend environment ready!"

# Navigate back to frontend directory
cd - > /dev/null

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install > /dev/null 2>&1
print_success "Frontend dependencies installed"

# Check if concurrently is available
if ! npm list concurrently &> /dev/null; then
    print_status "Installing concurrently for parallel execution..."
    npm install --save-dev concurrently > /dev/null 2>&1
fi

print_success "All dependencies installed!"
echo ""
print_status "Starting MicroCrowd Enhanced..."
echo "=============================================="
print_success "🌐 Frontend will be available at: http://localhost:5173"
print_success "🔧 Backend API will be available at: http://localhost:8000"
print_success "📖 API Documentation: http://localhost:8000/docs"
echo ""
print_warning "Press Ctrl+C to stop both servers"
echo ""

# Start both frontend and backend
npm run start:full