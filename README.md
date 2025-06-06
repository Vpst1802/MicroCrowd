# MicroCrowd - Data-Driven Focus Groups

> Transform CSV data into realistic personas for simulated focus groups and market research insights.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0.0-blue.svg)

## 🚀 Overview

MicroCrowd revolutionizes market research by converting your existing CSV data into authentic AI-powered personas that participate in realistic focus group discussions. Unlike traditional surveys or generic AI responses, MicroCrowd creates natural, personality-driven conversations that mirror real focus group dynamics.

### ✨ Key Features

- **🔄 CSV-to-Persona Transformation**: Convert any CSV dataset into rich, multi-dimensional personas
- **🎭 Authentic Personalities**: Each persona has unique traits, behaviors, and response patterns
- **💬 Natural Conversations**: Realistic focus group dynamics with varied participation levels
- **🎯 Professional Moderation**: AI moderator follows your discussion guide systematically
- **⏸️ Real-time Control**: Pause, resume, or end sessions at any time
- **📊 Export Transcripts**: Download complete conversation logs for analysis
- **🎨 Personality-Driven Responses**: Responses vary from one-word answers to detailed explanations

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
   git clone https://github.com/yourusername/microcrowd.git
   cd microcrowd
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

## 🎭 Understanding Persona Behavior

### Personality-Driven Responses
Each persona exhibits authentic behavior patterns:

- **Extroverted (4-5/5)**: Respond frequently, speak faster, jump in quickly
- **Introverted (1-2/5)**: Respond rarely, take time to think, give brief answers
- **Agreeable**: More likely to support others' ideas
- **Disagreeable**: More likely to challenge or offer contrasting views
- **Open**: Creative responses, embrace new ideas
- **Conscientious**: Detail-oriented, practical considerations

### Natural Conversation Patterns
- **Varied Response Lengths**: From one-word answers to detailed explanations
- **Realistic Participation**: Not everyone responds to every question
- **Authentic Speech**: Natural fillers like "um," "well," "you know"
- **Human Quirks**: Unfinished thoughts, tangents, misunderstandings
- **Dynamic Interaction**: Build on others' comments, show agreement/disagreement

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

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes MicroCrowd better for everyone.

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

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the AI models that power realistic conversations
- **React & Vite** for the modern development framework
- **Research Community** for inspiration and feedback on focus group methodologies
- **Open Source Contributors** who make projects like this possible

## 📞 Support

- **Documentation**: Check this README and inline help
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/microcrowd/issues)
- **Discussions**: Join community discussions in [GitHub Discussions](https://github.com/yourusername/microcrowd/discussions)
- **Email**: Contact the maintainer at [your-email@domain.com]

## 🚀 What's Next?

### Planned Features
- **Advanced Analytics**: Sentiment analysis and theme extraction
- **Export Formats**: PDF reports, Excel summaries
- **Custom Moderation**: Upload your own moderator styles
- **Integration APIs**: Connect with survey platforms and CRM systems
- **Multi-language Support**: Conduct focus groups in different languages
- **Video Avatars**: Visual representation of personas

### Community Roadmap
Want to influence the future of MicroCrowd? Join our discussions and share your ideas!

---

**Built with ❤️ for the research community**

*Transform your data into insights, one conversation at a time.*