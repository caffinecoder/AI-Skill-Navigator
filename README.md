 AI Skill Navigator

## Project Description
Personalized career guidance platform powered by AI that analyzes your GitHub projects, skills, and career goals to provide actionable recommendations for professional growth


## Team Information
**Team Name:** LLMates
**Team Members:**
- Sharmista J 

## Hackathon Theme Addressed
**Theme 1: Outbound Apps - Build a purposeful AI Agent**

Our solution directly addresses Theme 1 by implementing Descope's Outbound Apps to securely manage external API credentials and tokens. The application demonstrates seamless integration with:
- **GitHub API** - For repository analysis and profile data
- **OpenAI API** - For AI-powered career analysis and recommendations

## What We Built + How to Run It

### Architecture Overview
The AI Skill Navigator consists of three main components:

1. **Frontend Application** (`frontend/`)
   - Responsive web interface built with vanilla HTML, CSS, and JavaScript
   - Descope Web Component integration for authentication
   - Real-time repository visualization and analysis results

2. **Flask Backend** (`app.py`)
   - RESTful API with secure JWT-based authentication
   - Integration with OpenAI GPT-4 for intelligent career analysis
   - Descope Outbound Apps integration for external API management

3. **MCP Server** (Model Context Protocol)
   - Additional integration layer for advanced AI workflows
   - Shared analysis functions between Flask and MCP implementations

### Prerequisites
- Python 3.8+
- Node.js (for local development server)
- OpenAI API key
- Descope project credentials

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd ai-skill-navigator
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DESCOPE_PROJECT_ID=P31lWtDeYzgqh6jCiC3fZB61zVdF
   DESCOPE_MANAGEMENT_KEY=your_descope_management_key
   FLASK_ENV=development
   ```

4. **Start the Backend Server**
   ```bash
   python app.py
   ```
   The Flask server will start on `http://localhost:5000`

5. **Serve the Frontend**
   ```bash
   cd frontend
   # Using Python's built-in server
   python -m http.server 3000
   # OR using Node.js
   npx serve . -p 3000
   ```
   The frontend will be available at `http://localhost:3000`

### Key Features Demonstrated


#### 🔗 Outbound Apps Integration
- GitHub API access through Descope-managed tokens
- No hardcoded API credentials in the application
- Automatic token lifecycle management

#### 🤖 AI-Powered Analysis
- OpenAI GPT-4 integration for career guidance
- Intelligent parsing of GitHub repositories
- Skills gap analysis and personalized recommendations

#### 📊 Real-time Data Visualization
- Interactive repository cards with metadata
- Animated career readiness scoring
- Responsive design for all device types

## Tech Stack Used

### Frontend Technologies
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with flexbox and grid layouts
- **JavaScript (ES6+)** - Interactive functionality and API integration
- **Descope Web Components** - Authentication interface

### Backend Technologies
- **Python 3.8+** - Core application logic
- **Flask** - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **OpenAI Python SDK** - AI integration
- **PyJWT** - JSON Web Token handling
- **Requests** - HTTP client for external APIs

### External Integrations
- **Descope** - Authentication and Outbound Apps management
- **OpenAI GPT-4** - Natural language processing and analysis
- **GitHub API** - Repository and profile data access

### Development Tools
- **Git** - Version control
- **Python Virtual Environment** - Dependency isolation
- **Postman** - API testing and documentation
- **VS Code** - Development environment

## Demo Video Link
https://youtu.be/xY5LSnCfuis

**Demo Highlights:**
- Descope authentication flow demonstration
- GitHub repository fetching via Outbound Apps
- Real-time AI career analysis
- Interactive results visualization
- Mobile responsiveness showcase

## What We'd Do With More Time

### Immediate Enhancements (1-2 weeks)
1. **LinkedIn Integration Completion**
   - Implement full LinkedIn API integration through Descope Outbound Apps
   - Extract professional experience, endorsements, and connections data
   - Cross-reference LinkedIn skills with GitHub project analysis

2. **Advanced AI Features**
   - Implement RAG (Retrieval-Augmented Generation) for more accurate industry insights
   - Add trending skills analysis based on job market data
   - Create personalized learning path recommendations

3. **Enhanced User Experience**
   - Add dark mode toggle with user preference persistence
   - Implement progressive loading for better performance
   - Create interactive career roadmap visualization

### Medium-term Goals (1-3 months)
1. **Multi-platform Integration**
   - GitLab and Bitbucket repository analysis
   - Stack Overflow profile integration
   - Kaggle competition history analysis

2. **Advanced Analytics Dashboard**
   - Career progression tracking over time
   - Industry benchmarking and peer comparisons
   - Skills demand forecasting based on market trends

3. **Community Features**
   - Mentorship matching based on career goals
   - Skill exchange marketplace
   - Success story sharing and career journey documentation

### Long-term Vision (3+ months)
1. **Enterprise Integration**
   - HR system integration for talent acquisition
   - Team skills assessment and gap analysis
   - Training program recommendations and ROI tracking

2. **Mobile Application**
   - Native iOS and Android applications
   - Push notifications for skill updates and opportunities
   - Offline analysis capabilities

3. **AI Model Enhancement**
   - Custom-trained models for specific industries
   - Real-time job market analysis integration
   - Predictive career outcome modeling
  

## Authentication Note
I implemented Descope with GitHub/Google outbound apps (client IDs configured), but encountered integration issues during deployment. For demo purposes, I've included a placeholder login. The full Descope integration is code-complete but requires additional configuration.


## Contributing

We welcome contributions from the developer community! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on:
- Code style and standards
- Pull request process
- Issue reporting
- Feature request procedures


## Acknowledgments

- **Descope Team** for the excellent Outbound Apps feature that made secure API integration seamless
- **OpenAI** for providing the powerful GPT-4 API for intelligent analysis
- **GitHub** for their comprehensive developer API
- **Flask Community** for the lightweight yet powerful web framework
- **All Beta Testers** who provided valuable feedback during development

---

