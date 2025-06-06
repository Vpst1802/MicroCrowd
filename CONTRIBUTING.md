# Contributing to MicroCrowd

First off, thank you for considering contributing to MicroCrowd! 🎉 It's people like you that make this tool valuable for the entire research community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Types of Contributions](#types-of-contributions)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Community Guidelines](#community-guidelines)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming, inclusive environment. By participating, you are expected to uphold these values:

- **Be respectful** and inclusive
- **Be constructive** in discussions and feedback
- **Help others learn** and grow
- **Focus on what's best** for the community
- **Show empathy** towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn
- Git
- OpenAI API key (for testing)
- Basic knowledge of React, TypeScript, and modern web development

### Setting Up Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/microcrowd.git
   cd microcrowd
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## 🛠️ Types of Contributions

We welcome all types of contributions:

### 🐛 Bug Reports
Found a bug? Please help us fix it:
- Use the GitHub issue tracker
- Include detailed steps to reproduce
- Provide browser/system information
- Include screenshots if relevant

### 💡 Feature Requests
Have an idea for improvement?
- Check existing issues first
- Clearly describe the use case
- Explain why it would benefit the community
- Consider implementation complexity

### 🔧 Code Contributions
Ready to code? Great!
- Bug fixes
- New features
- Performance improvements
- Documentation updates
- Test improvements

### 📚 Documentation
Help others understand and use MicroCrowd:
- Fix typos or unclear explanations
- Add examples or tutorials
- Improve API documentation
- Translate documentation

## 🔄 Development Process

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `docs/improvement-description` - Documentation updates

### Workflow
1. **Create an issue** first (for non-trivial changes)
2. **Create a branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** with clear, logical commits
4. **Test your changes** thoroughly
5. **Submit a pull request** to `develop` branch

## 💻 Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing code style (we use Prettier)
- Use meaningful variable and function names
- Add type annotations for complex objects
- Prefer functional programming patterns

### React Components
- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Handle loading and error states
- Follow accessibility best practices

### File Organization
- Place components in `components/` directory
- Use `pages/` for page-level components
- Keep utilities in `services/` or `utils/`
- Group related files together

### Example Code Style
```typescript
interface PersonaProps {
  persona: PersonaProfile;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

const PersonaCard: React.FC<PersonaProps> = ({ 
  persona, 
  onSelect, 
  isSelected = false 
}) => {
  const handleClick = useCallback(() => {
    onSelect(persona.id);
  }, [persona.id, onSelect]);

  return (
    <div 
      className={`persona-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <h3>{persona.name}</h3>
      <p>{persona.generatedSummary}</p>
    </div>
  );
};
```

## 🧪 Testing Guidelines

### Manual Testing
- Test all user interactions
- Verify different CSV formats work
- Check responsive design on mobile
- Test accessibility with screen readers
- Validate API error handling

### Testing Checklist
- [ ] Feature works as expected
- [ ] No console errors or warnings
- [ ] Responsive design maintained
- [ ] Accessibility standards met
- [ ] Performance remains acceptable
- [ ] Error states handled gracefully

### CSV Testing
Please test with various CSV formats:
- Different column orders
- Missing fields
- Special characters
- Large datasets (100+ rows)
- Edge cases (empty cells, long text)

## 📤 Submitting Changes

### Pull Request Process
1. **Update documentation** if needed
2. **Add/update tests** for your changes
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** for notable changes
5. **Create descriptive PR title and description**

### PR Title Format
- `feat: add new persona generation algorithm`
- `fix: resolve CSV parsing issue with special characters`
- `docs: improve installation instructions`
- `perf: optimize focus group simulation speed`

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
- [ ] Tested manually
- [ ] Added/updated tests
- [ ] Tested with different CSV formats

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

## 🌟 Community Guidelines

### Communication
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community chat
- **Pull Requests**: For code review and technical discussion

### Getting Help
- Check existing issues and documentation first
- Ask questions in GitHub Discussions
- Be patient and respectful when asking for help
- Help others when you can

### Recognition
Contributors are recognized in:
- README.md acknowledgments
- Release notes for significant contributions
- GitHub contributors list

## 🏆 Contributor Levels

### 🌱 First-time Contributors
Welcome! We have issues labeled `good first issue` and `help wanted` that are perfect for getting started.

### 🌿 Regular Contributors
Help with code reviews, testing, and mentoring new contributors.

### 🌳 Core Contributors
Maintainers who help guide the project direction and review major changes.

## 📈 Development Priorities

Current focus areas where contributions are most needed:

1. **Performance Optimization**: Improve simulation speed and responsiveness
2. **CSV Format Support**: Handle edge cases and various data formats
3. **Accessibility**: Ensure the tool works for users with disabilities
4. **Documentation**: Examples, tutorials, and API documentation
5. **Testing**: Automated tests and comprehensive manual testing
6. **Internationalization**: Support for multiple languages

## 🎯 Roadmap Participation

Want to influence MicroCrowd's future? 
- Join roadmap discussions in GitHub Issues
- Propose new features with detailed use cases
- Vote on feature priorities
- Help with technical design decisions

## 📞 Questions?

Don't hesitate to reach out:
- **GitHub Discussions**: For general questions
- **Issues**: For specific bugs or features
- **Email**: [your-email@domain.com] for sensitive topics

---

**Thank you for contributing to MicroCrowd!** 🙏

Your contributions help make market research more accessible and effective for everyone.