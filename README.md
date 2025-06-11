# MicroCrowd - Enhanced AI Focus Groups

> Transform CSV data into realistic personas for natural, authentic focus group discussions with advanced conversation intelligence.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0.0-blue.svg)
![Enhanced Engine](https://img.shields.io/badge/conversation-enhanced-green.svg)

## 🚀 Overview

MicroCrowd bridges the gap between static data and dynamic human insights by transforming consumer datasets into interactive personas for experimental research. Traditional market research methods are limited by cost, time, and participant availability, while generic AI lacks the nuanced diversity of real human perspectives. MicroCrowd enables researchers and strategists to conduct focus group simulations with authentic personality-driven responses, making advanced research methodologies accessible for experimentation across diverse scenarios—from product testing and user experience research to academic studies and strategic planning.

This a framework working model and not scaled for mass use. 

## 🎬 Demo

Check out MicroCrowd in action in demo video

https://youtube.com/shorts/WjuCvi4yywE

## 🚀 Quick Start

**Want to see the enhanced conversation engine in action?**

1. Clone and install: `git clone https://github.com/vtmade/MicroCrowd.git && cd MicroCrowd && npm install`
2. Add your OpenAI API key to `.env` file  
3. Run: `npm run dev`
4. Upload the included `sample_personas.csv`
5. Start a focus group on a controversial topic like "climate change" or "gun laws"
6. **Watch authentic disagreements unfold!** 🎭




### ✨ Key Features

#### 🧠 **Enhanced Conversation Engine** (NEW!)
- **🤝 Realistic Disagreements**: Personas authentically disagree based on demographics and backgrounds
- **🎯 Smart Reference Validation**: Only references actual statements with exact quotes
- **🗣️ Persona-Specific Speech Patterns**: 6 distinct speaking styles based on personality and background
- **📊 Dynamic Behavior Tracking**: Real-time emotional states affect participation and responses
- **⚡ Intelligent Interruptions**: Natural conversation flow with personality-driven interruptions

#### 🔄 **Core Functionality** 
- **📊 CSV-to-Persona Transformation**: Convert any CSV dataset into rich, multi-dimensional personas
- **🎭 Authentic Personalities**: Each persona has unique traits, behaviors, and response patterns
- **💬 Natural Conversations**: Realistic focus group dynamics with varied participation levels
- **🎯 Professional Moderation**: AI moderator follows your discussion guide systematically
- **⏸️ Real-time Control**: Pause, resume, or end sessions at any time
- **📈 Export Transcripts**: Download complete conversation logs for analysis

## 🎯 Use Cases

### Market Research
- **Product Testing**: Understand how different demographics react to new products
- **Brand Perception**: Explore brand associations across diverse consumer segments
- **Feature Prioritization**: Identify which features resonate with different user types
- **Pricing Strategy**: Test price sensitivity across various customer personas

### Academic Research
- **Social Studies**: Simulate group discussions on social issues or policies
- **Psychology Research**: Study group dynamics and personality interactions
- **Educational Research**: Test teaching methods or educational content
- **Behavioral Studies**: Explore decision-making patterns in group settings

### UX/Design Research
- **User Journey Mapping**: Understand how different users navigate your product
- **Interface Testing**: Get diverse perspectives on design choices
- **Accessibility Research**: Include personas with varying abilities and tech comfort
- **Content Strategy**: Test messaging with different demographic groups

### Innovation & Strategy
- **Idea Validation**: Test concepts with diverse stakeholder perspectives
- **Scenario Planning**: Explore how different groups might react to changes
- **Risk Assessment**: Understand potential concerns from various viewpoints
- **Stakeholder Alignment**: Simulate discussions between different organizational roles

## 🛠️ Installation

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn package manager
- OpenAI API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/vtmade/MicroCrowd.git
   cd MicroCrowd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_openai_api_key_here
   ```
  - In your MicroCrowd folder, create a `.env` file using env example file
  - Replace `your_openai_api_key_here` with your actual OpenAI API key

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📋 How to Use

### Step 1: Prepare Your Data
Create a CSV file with any combination of relevant fields:
```csv
name,age,occupation,location,income,interests,education
Sarah Johnson,32,Marketing Manager,Seattle,75000,Sustainability;Technology,Bachelor's
Mike Chen,45,Small Business Owner,Austin,55000,Sports;Family,High School
...
```

**Supported fields** (all optional):
- Demographics: `name`, `age`, `gender`, `location`
- Professional: `occupation`, `industry`, `income`, `experience`
- Personal: `interests`, `hobbies`, `education`, `family_status`
- Any custom fields relevant to your research

### Step 2: Generate Personas
1. Click **"Generate Personas"** in the navigation
2. Upload your CSV file
3. Wait for AI to transform each row into a rich persona profile
4. Review generated personas with full personality traits and backgrounds

### Step 3: Setup Focus Group
1. Navigate to **"Setup Focus Group"**
2. Configure your session:
   - **Topic**: The main subject for discussion
   - **Research Goal**: What insights you're seeking
   - **Discussion Guide**: Key questions/topics to cover
   - **Max Turns**: How many rounds of discussion
   - **Participants**: Select which personas to include

### Step 4: Run the Simulation
1. Click **"Start Focus Group"**
2. Watch as the AI moderator facilitates natural discussion
3. Use controls to **pause**, **resume**, or **end** the session
4. Download transcript when complete

## 🎭 Enhanced Conversation Intelligence

### **What Makes It Different?**

#### 🚫 **Before Enhancement:**
- 90%+ artificial consensus on controversial topics
- Generic template responses across all personas  
- Invalid references to non-existent statements
- No personality-driven behavior changes

#### ✅ **After Enhancement:**
- **Realistic Disagreements**: 30-70% disagreement based on topic controversy
- **Authentic Speech Patterns**: Distinct vocabulary and style per demographic
- **Validated Conversations**: Only references actual statements with exact quotes
- **Dynamic Personalities**: Behavior changes based on emotional investment

### **Conversation Examples**

#### Gun Laws Discussion:
- **Rural Construction Worker**: "I've been hunting since I was 12. Gun control won't stop criminals."
- **Urban Teacher**: "[PASSIONATE] I see the fear in my students' eyes during lockdown drills. We need action."
- **Suburban Analyst**: "The data shows both perspectives have merit, but we need balanced regulation."

#### Climate Change Discussion:
- **Environmental Scientist**: "The evidence is overwhelming - we're facing an emergency."
- **Energy Worker**: "[FRUSTRATED] Easy for you to say. These policies cost real jobs."
- **Working Parent**: "I want a better world for my kids, but I can't afford an electric car right now."

### **Technical Improvements**

- **🔍 Reference Validation**: No more "someone mentioned" - only verified quotes
- **🎭 Speech Diversity**: Age, education, and regional speech patterns  
- **😤 Emotional States**: Frustration, engagement, and confidence affect responses
- **⚡ Natural Interruptions**: Personality-driven interjections and disagreements
- **📊 Flow Intelligence**: AI moderator adapts to conversation dynamics

## 📁 Project Structure

```
MicroCrowd/
├── 📱 components/           # React UI components
├── 📄 pages/               # Application pages  
├── 🧠 services/            # Enhanced conversation engine & core logic
│   ├── conversationOrchestrator.ts    # Main conversation coordinator
│   ├── conversationTracker.ts         # Statement validation
│   ├── controversyStanceAssigner.ts   # Disagreement generation
│   ├── responseStyleManager.ts        # Speech pattern diversity
│   └── ... (8 advanced services)
├── 🛠️ scripts/             # Development and deployment scripts
├── 🔧 tools/               # Python utilities and testing tools
├── 📚 docs/                # Documentation and guides
│   ├── ENHANCED_CONVERSATION_ENGINE.md  # Technical details
│   └── ENHANCED_SETUP.md               # Setup guide
├── 📊 sample_personas.csv  # Example data for testing
└── 📖 README.md           # This file
```

## 🔧 Configuration

### Environment Variables
```env
API_KEY=your_openai_api_key        # Required: OpenAI API key
OPENAI_MODEL=gpt-4o-mini          # Optional: Model to use (default: gpt-4o-mini)
```

### CSV Format Guidelines
- **Flexible Structure**: Any column names and data types accepted
- **No Required Fields**: System adapts to available data
- **Rich Data = Rich Personas**: More fields create more detailed personalities
- **Clean Data**: Remove duplicates and ensure consistent formatting

## 🤝 Contributing

Welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes MicroCrowd better for everyone.

### Ways to Contribute
- 🐛 **Bug Reports**: Found an issue? Open a GitHub issue
- 💡 **Feature Requests**: Have an idea? We'd love to hear it
- 🔧 **Code Contributions**: Submit pull requests for improvements
- 📚 **Documentation**: Help improve guides and examples
- 🧪 **Testing**: Try different CSV formats and report results

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the AI models that power realistic conversations
- **React & Vite** for the modern development framework
- **Research Community** for inspiration and feedback on focus group methodologies
- **Open Source Contributors** who make projects like this possible

## 📞 Support

- **Documentation**: Check this README and inline help
- **Issues**: Report bugs on [GitHub Issues](https://github.com/vtmade/MicroCrowd/issues)
- **Discussions**: Join community discussions in [GitHub Discussions](https://github.com/vtmade/MicroCrowd/discussions)
- **Email**: Contact the maintainer at vpst18@gmail.com

## 🚀 What's Next?

### Planned Features
- **🔬 MicroCrowd-Researcher**: Python backend for advanced research capabilities and fine-tuning
- **📊 Advanced Analytics**: Sentiment analysis, theme extraction, and conversation insights
- **📋 Enhanced Export Formats**: PDF reports, Excel summaries, and data visualization  
- **🎯 Custom Moderation**: Upload your own moderator personalities and conversation styles
- **🔗 Integration APIs**: Connect with survey platforms, CRM systems, and research tools
- **🌐 Multi-language Support**: Conduct focus groups in different languages
- **📱 Mobile Optimization**: Responsive design for mobile research scenarios


### Community Roadmap
Want to influence the future of MicroCrowd? Join our discussions and share your ideas!

---

**Built with ❤️ for the opensource community**
