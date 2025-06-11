# MicroCrowd Enhanced - Setup Guide

MicroCrowd Enhanced uses a Python backend for sophisticated persona generation and conversation simulation, paired with a React frontend.

## 🚀 Quick Start (Integrated)

### Option 1: One-Command Startup (Recommended)
```bash
# From the Microcrowd directory
./start-microcrowd.sh
```

This script will automatically:
- Check system requirements
- Set up the Python backend
- Install all dependencies
- Start both frontend and backend servers

### Option 2: Manual Setup

#### Backend Setup
```bash
# Navigate to backend directory
cd ../microcrowd-enhanced/backend

# Run the setup script (first time only)
./start.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Frontend Setup
```bash
# From the Microcrowd directory
npm install
```

#### Running the Application
```bash
# Start both servers (requires concurrently)
npm run start:full

# Or start separately:
# Terminal 1 - Backend
npm run backend:start

# Terminal 2 - Frontend  
npm run dev
```

## 📋 Requirements

- **Python 3.8+** (for the enhanced backend)
- **Node.js 16+** (for the React frontend)
- **OpenAI API Key** (for persona generation and conversations)

## ⚙️ Configuration

### Backend Configuration (.env)
Create/edit `../microcrowd-enhanced/backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
DEBUG=True
MAX_PERSONAS_PER_REQUEST=50
DEFAULT_TEMPERATURE=0.7
MAX_RESPONSE_TOKENS=150
CACHE_TTL=3600
```

### Frontend Configuration (.env)
Edit `.env` (optional):

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🌐 Application URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 Available npm Scripts

```bash
# Frontend only
npm run dev                 # Start React development server
npm run build              # Build for production
npm run preview            # Preview production build

# Backend management
npm run backend:install    # Install backend dependencies
npm run backend:start      # Start backend server
npm run backend:setup      # Full backend setup (first time)

# Full application
npm run start:full         # Start both frontend and backend
```

## 🐛 Troubleshooting

### Backend Issues

**"Enhanced Backend Unavailable"**
- Ensure Python backend is running on port 8000
- Check backend console for error messages
- Verify OpenAI API key is set correctly

**Python/pip issues**
```bash
# Make sure you're in the correct directory
cd ../microcrowd-enhanced/backend

# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

**Dependencies not found**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port conflicts**
- Frontend uses port 5173
- Backend uses port 8000
- Make sure these ports are available

### OpenAI API Issues

**Rate limits**
- The backend implements intelligent rate limiting
- Reduce concurrent requests if needed
- Check your OpenAI API quota

**Invalid API Key**
- Verify your key in `../microcrowd-enhanced/backend/.env`
- Ensure the key has sufficient permissions

## 📖 Features

### Enhanced Persona Generation
- **Psychological Profiling**: Big Five personality traits analysis
- **Personality Fragments**: Pre-defined behavioral archetypes
- **Advanced CSV Processing**: Intelligent data extraction and personality inference
- **Behavioral Validation**: Consistency checking for persona responses

### AI-Moderated Focus Groups
- **Sophisticated Conversation Engine**: Memory-aware dialogue management
- **Psychological Validation**: Response authenticity scoring
- **Real-time Simulation**: WebSocket-based live conversations
- **Export Capabilities**: Download transcripts and analysis

## 🔄 Development Workflow

1. **Start the application**: `./start-microcrowd.sh`
2. **Generate personas**: Upload CSV data through the frontend
3. **Run simulations**: Create AI-moderated focus groups
4. **Analyze results**: Export transcripts and conversation analysis

## 📁 Project Structure

```
Microcrowd/                     # React frontend
├── components/                 # React components
├── pages/                     # Application pages
├── services/                  # API services
├── start-microcrowd.sh       # Integrated startup script
└── ENHANCED_SETUP.md         # This guide

../microcrowd-enhanced/backend/ # Python backend
├── app/                       # FastAPI application
├── models/                    # Data models
├── services/                  # Business logic
├── start.sh                   # Backend startup script
└── requirements.txt           # Python dependencies
```

## 🆘 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all requirements are installed
3. Ensure your OpenAI API key is valid and has quota
4. Try restarting both servers
5. Check that ports 5173 and 8000 are available

For development questions, consult the API documentation at http://localhost:8000/docs when the backend is running.