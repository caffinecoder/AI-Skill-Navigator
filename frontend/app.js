// Global variables
let userRepos = [];
let isAuthenticated = false;
let sessionToken = null;
let userProfile = null;

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const userEmailSpan = document.getElementById('userEmail');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AI Skill Navigator loaded');
    // App will start with login screen visible
    
    // Check if user is already logged in (from localStorage or session)
    checkExistingSession();
});

// Check for existing session
function checkExistingSession() {
    const token = localStorage.getItem('sessionToken');
    const userEmail = localStorage.getItem('userEmail');
    const storedProfile = localStorage.getItem('userProfile');
    
    if (token && userEmail) {
        console.log('Found existing session');
        sessionToken = token;
        if (storedProfile) {
            userProfile = JSON.parse(storedProfile);
        }
        showMainApp(userEmail);
    }
}

// Show main application after login
function showMainApp(userEmail) {
    isAuthenticated = true;
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    mainApp.classList.add('fade-in');
    userEmailSpan.textContent = userEmail;
    
    console.log('✅ User authenticated:', userEmail);
}

// Demo login function
function demoLogin() {
    console.log('🎭 Demo login activated');
    
    const demoUser = {
        email: 'demo@example.com',
        name: 'Demo User'
    };
    
    const demoToken = 'demo-session-token-' + Date.now();
    
    // Store demo session
    sessionToken = demoToken;
    userProfile = demoUser;
    localStorage.setItem('sessionToken', demoToken);
    localStorage.setItem('userEmail', demoUser.email);
    localStorage.setItem('userProfile', JSON.stringify(demoUser));
    
    // Show main application
    showMainApp(demoUser.email);
}

// Logout function
function logout() {
    isAuthenticated = false;
    sessionToken = null;
    userProfile = null;
    userRepos = [];
    
    // Clear stored session
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userProfile');
    
    // Reset UI
    mainApp.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    
    // Reset forms
    document.getElementById('careerGoal').value = '';
    document.getElementById('githubUsername').value = '';
    document.getElementById('skills').value = '';
    
    // Hide sections
    document.getElementById('reposSection').classList.add('hidden');
    document.getElementById('analysisSection').classList.add('hidden');
    
    console.log('👋 User logged out');
}

// Fetch GitHub repositories
async function fetchRepos() {
    const username = document.getElementById('githubUsername').value.trim();
    
    if (!username) {
        alert('Please enter a GitHub username');
        return;
    }
    
    const fetchBtn = document.getElementById('fetchBtn');
    const fetchBtnText = document.getElementById('fetchBtnText');
    const fetchLoader = document.getElementById('fetchLoader');
    
    // Show loading state
    fetchBtn.disabled = true;
    fetchBtnText.textContent = 'Fetching...';
    fetchLoader.classList.remove('hidden');
    
    try {
        console.log('🔍 Fetching repos for:', username);
        
        // Try your backend first, fallback to GitHub API
        let response;
        try {
            response = await fetch(`http://localhost:5000/github/${username}`);
            if (response.ok) {
                const data = await response.json();
                userRepos = data.repositories || [];
            } else {
                throw new Error('Backend not available');
            }
        } catch (backendError) {
            console.log('Backend not available, using GitHub API directly');
            // Fallback to GitHub API
            response = await fetch(`https://api.github.com/users/${username}/repos`);
            if (response.ok) {
                const repos = await response.json();
                userRepos = repos.slice(0, 10).map(repo => ({
                    name: repo.name,
                    language: repo.language || 'Unknown',
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    description: repo.description || ''
                }));
            } else {
                throw new Error('Failed to fetch from GitHub API');
            }
        }
        
        if (userRepos.length > 0) {
            displayRepos();
            console.log(`✅ Found ${userRepos.length} repositories`);
        } else {
            alert('No repositories found for this user');
        }
        
    } catch (error) {
        console.error('❌ Error fetching repos:', error);
        alert('Error fetching repositories. Please check the username and try again.');
    } finally {
        // Reset button state
        fetchBtn.disabled = false;
        fetchBtnText.textContent = 'Fetch Repos';
        fetchLoader.classList.add('hidden');
    }
}

// Display repositories
function displayRepos() {
    const reposSection = document.getElementById('reposSection');
    const reposGrid = document.getElementById('reposGrid');
    const repoCount = document.getElementById('repoCount');
    
    repoCount.textContent = userRepos.length;
    reposGrid.innerHTML = '';
    
    userRepos.forEach(repo => {
        const repoCard = document.createElement('div');
        repoCard.className = 'repo-card';
        repoCard.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${repo.name}</div>
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">(${repo.language})</div>
            <div style="display: flex; gap: 15px; font-size: 14px; color: #6b7280;">
                <span>⭐ ${repo.stars}</span>
                <span>🍴 ${repo.forks}</span>
            </div>
        `;
        reposGrid.appendChild(repoCard);
    });
    
    reposSection.classList.remove('hidden');
    reposSection.classList.add('fade-in');
}

// Calculate authentic career readiness score
function calculateCareerScore(careerGoal, skills, repos) {
    let score = 30; // Base score
    
    // Skill-based scoring (max 35 points)
    const skillList = skills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const skillPoints = Math.min(skillList.length * 3, 35);
    score += skillPoints;
    
    // Repository-based scoring (max 25 points)
    if (repos.length > 0) {
        const avgStars = repos.reduce((sum, repo) => sum + repo.stars, 0) / repos.length;
        const languageVariety = new Set(repos.map(r => r.language).filter(l => l !== 'Unknown')).size;
        
        score += Math.min(repos.length * 2, 15); // Quantity bonus
        score += Math.min(avgStars / 2, 5); // Quality bonus
        score += Math.min(languageVariety * 1.5, 5); // Diversity bonus
    }
    
    // Career goal specificity bonus (max 10 points)
    const goalWords = careerGoal.toLowerCase().split(' ').filter(Boolean);
    if (goalWords.length >= 2) score += 5;
    if (careerGoal.includes('engineer') || careerGoal.includes('developer') || 
        careerGoal.includes('scientist') || careerGoal.includes('analyst')) {
        score += 5;
    }
    
    // Ensure score is between 45-95 for realistic range
    return Math.max(45, Math.min(95, Math.round(score)));
}

// Analyze skills with AI (make it globally available)
window.analyzeSkills = async function() {
    const careerGoal = document.getElementById('careerGoal').value.trim();
    const skills = document.getElementById('skills').value.trim();
    
    if (!careerGoal) {
        alert('Please enter your career goal');
        return;
    }
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeBtnText = document.getElementById('analyzeBtnText');
    const analyzeLoader = document.getElementById('analyzeLoader');
    
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = 'Analyzing Your Skills...';
    analyzeLoader.classList.remove('hidden');
    
    try {
        console.log('🧠 Starting AI analysis...');
        
        const requestBody = {
            career_goal: careerGoal,
            github_repos: userRepos.map(repo => repo.name),
            linkedin_skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []
        };
        
        console.log('📤 Request payload:', requestBody);
        
        let analysisData;
        
        try {
            // Try your Flask backend
            const response = await fetch('http://localhost:5000/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': sessionToken ? `Bearer ${sessionToken}` : 'Bearer demo-token',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                analysisData = await response.json();
                console.log('✅ AI Analysis received:', analysisData);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
        } catch (backendError) {
            console.log('Using fallback analysis');
            
            // Calculate authentic score
            const authenticScore = calculateCareerScore(careerGoal, skills, userRepos);
            
            // Generate contextual suggestions
            const suggestions = [];
            const goalLower = careerGoal.toLowerCase();
            
            if (goalLower.includes('ai') || goalLower.includes('machine learning') || goalLower.includes('ml')) {
                suggestions.push('Build ML projects with TensorFlow or PyTorch');
                suggestions.push('Learn data preprocessing and feature engineering');
                suggestions.push('Study deep learning architectures and neural networks');
            } else if (goalLower.includes('web') || goalLower.includes('frontend') || goalLower.includes('full stack')) {
                suggestions.push('Master modern JavaScript frameworks like React or Vue');
                suggestions.push('Build responsive web applications with CSS Grid/Flexbox');
                suggestions.push('Learn backend technologies like Node.js or Python Flask');
            } else if (goalLower.includes('data') || goalLower.includes('analyst')) {
                suggestions.push('Master SQL and database management');
                suggestions.push('Learn data visualization tools like Tableau or Power BI');
                suggestions.push('Practice statistical analysis with Python/R');
            } else {
                suggestions.push(`Build 2-3 more projects specifically related to ${careerGoal}`);
                suggestions.push('Contribute to open source projects in your field');
                suggestions.push('Network with professionals in your desired field');
            }
            
            suggestions.push('Consider obtaining relevant industry certifications');
            
            analysisData = {
                summary: `Based on your goal of becoming a ${careerGoal}, you have ${userRepos.length > 0 ? 'a solid foundation with your GitHub projects' : 'potential to grow'}. Your current skill set ${skills ? 'shows diversity and' : ''} demonstrates readiness for growth in this dynamic field. Focus on building practical experience and expanding your technical toolkit.`,
                top_suggestions: suggestions.slice(0, 4),
                score: authenticScore
            };
        }
        
        displayAnalysis(analysisData);
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        
        // Show fallback analysis for demo
        const fallbackAnalysis = {
            summary: `Based on your goal of becoming a ${careerGoal}, you have a solid foundation to build upon. Your current skills and projects show promise, but there's always room for growth and improvement.`,
            top_suggestions: [
                `Build 2-3 more projects specifically related to ${careerGoal}`,
                "Contribute to open source projects to gain visibility",
                "Network with professionals in your desired field",
                "Consider obtaining relevant certifications"
            ],
            score: Math.floor(Math.random() * 30) + 60 // Random score 60-90
        };
        
        displayAnalysis(fallbackAnalysis);
        
        // Show user-friendly error message
        setTimeout(() => {
            alert('Using demo analysis. For live AI responses, ensure your backend is running with OpenAI API key configured.');
        }, 500);
    } finally {
        // Reset button state
        analyzeBtn.disabled = false;
        analyzeBtnText.textContent = '🔍 Analyze My Skills';
        analyzeLoader.classList.add('hidden');
    }
}

// Display analysis results
function displayAnalysis(data) {
    const analysisSection = document.getElementById('analysisSection');
    const analysisSummary = document.getElementById('analysisSummary');
    const suggestionsList = document.getElementById('suggestionsList');
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreNumber = document.getElementById('scoreNumber');
    
    // Display summary
    analysisSummary.textContent = data.summary;
    
    // Display suggestions
    suggestionsList.innerHTML = '';
    data.top_suggestions.forEach((suggestion, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <div class="suggestion-number">${index + 1}</div>
            <div>${suggestion}</div>
        `;
        suggestionsList.appendChild(suggestionItem);
    });
    
    // Display score with animation
    const score = Math.min(Math.max(data.score, 0), 100); // Ensure 0-100 range
    const scoreAngle = (score / 100) * 360;
    
    scoreCircle.style.setProperty('--score-angle', `${scoreAngle}deg`);
    
    // Animate score number
    let currentScore = 0;
    const scoreInterval = setInterval(() => {
        currentScore++;
        scoreNumber.textContent = currentScore;
        if (currentScore >= score) {
            clearInterval(scoreInterval);
        }
    }, 30);
    
    // Show analysis section
    analysisSection.classList.remove('hidden');
    analysisSection.classList.add('fade-in');
    
    // Scroll to results
    analysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('📊 Analysis displayed successfully with score:', score);
}

// Utility function to show loading state
function showLoading(elementId, show = true) {
    const element = document.getElementById(elementId);
    if (element) {
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
}

// Handle form submission with Enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && isAuthenticated) {
        const activeElement = document.activeElement;
        
        if (activeElement.id === 'githubUsername') {
            fetchRepos();
        } else if (activeElement.id === 'careerGoal' || activeElement.id === 'skills') {
            analyzeSkills();
        }
    }
});

console.log('📱 App.js loaded successfully');