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
    console.log(' AI Skill Navigator loaded');
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
            response = await fetch(`/api/github/${username}`);
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

// Calculate authentic career readiness score - FIXED VERSION
function calculateCareerScore(careerGoal, skills, repos) {
    let score = 20; // Lower base score for more realistic scaling
    
    // Skill-based scoring (max 30 points)
    const skillList = skills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    if (skillList.length > 0) {
        const skillPoints = Math.min(skillList.length * 2.5, 25); // More conservative scoring
        score += skillPoints;
        console.log(`Skills contribution: ${skillPoints} points for ${skillList.length} skills`);
    }
    
    // Repository-based scoring (max 30 points)
    if (repos.length > 0) {
        const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks, 0);
        const languageVariety = new Set(repos.map(r => r.language).filter(l => l !== 'Unknown')).size;
        
        // Quantity bonus (max 15 points)
        const quantityPoints = Math.min(repos.length * 1.5, 15);
        score += quantityPoints;
        
        // Quality bonus based on engagement (max 10 points)
        const engagementScore = Math.min((totalStars + totalForks) * 0.5, 10);
        score += engagementScore;
        
        // Language diversity bonus (max 5 points)
        const diversityPoints = Math.min(languageVariety * 1.2, 5);
        score += diversityPoints;
        
        console.log(`Repos contribution: ${quantityPoints + engagementScore + diversityPoints} points`);
        console.log(`- Quantity: ${quantityPoints}, Engagement: ${engagementScore}, Diversity: ${diversityPoints}`);
    }
    
    // Career goal specificity and relevance bonus (max 20 points)
    const goalWords = careerGoal.toLowerCase().split(' ').filter(Boolean);
    let careerBonus = 0;
    
    // Specificity bonus
    if (goalWords.length >= 2) careerBonus += 5;
    if (goalWords.length >= 3) careerBonus += 3;
    
    // Role relevance bonus
    const techRoles = ['engineer', 'developer', 'scientist', 'analyst', 'architect', 'manager', 'lead'];
    if (techRoles.some(role => careerGoal.toLowerCase().includes(role))) {
        careerBonus += 7;
    }
    
    // Technology/field specificity bonus
    const techFields = ['ai', 'ml', 'machine learning', 'data', 'web', 'mobile', 'cloud', 'devops', 'security'];
    if (techFields.some(field => careerGoal.toLowerCase().includes(field))) {
        careerBonus += 5;
    }
    
    score += careerBonus;
    console.log(`Career goal contribution: ${careerBonus} points`);
    
    // Skill-goal alignment bonus (additional 10 points for good matches)
    if (skillList.length > 0 && careerGoal) {
        const goalLower = careerGoal.toLowerCase();
        let alignmentBonus = 0;
        
        skillList.forEach(skill => {
            const skillLower = skill.toLowerCase();
            
            // Check for direct technology matches
            if (goalLower.includes('ai') && (skillLower.includes('python') || skillLower.includes('tensorflow') || skillLower.includes('pytorch'))) {
                alignmentBonus += 1;
            }
            if (goalLower.includes('web') && (skillLower.includes('javascript') || skillLower.includes('react') || skillLower.includes('node'))) {
                alignmentBonus += 1;
            }
            if (goalLower.includes('data') && (skillLower.includes('sql') || skillLower.includes('pandas') || skillLower.includes('python'))) {
                alignmentBonus += 1;
            }
        });
        
        alignmentBonus = Math.min(alignmentBonus, 10);
        score += alignmentBonus;
        console.log(`Skill-goal alignment bonus: ${alignmentBonus} points`);
    }
    
    // Ensure realistic score range (30-90)
    const finalScore = Math.max(30, Math.min(90, Math.round(score)));
    console.log(`Final calculated score: ${finalScore} (raw: ${score})`);
    
    return finalScore;
}

// Analyze skills with AI (make it globally available) - UPDATED WITH NEW ENDPOINT
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
            // UPDATED: Use relative path for Vercel deployment
            const response = await fetch('/api/analyze', {
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
                
                // Use the score from AI response, but validate it
                if (analysisData.score && typeof analysisData.score === 'number') {
                    analysisData.score = Math.max(30, Math.min(95, analysisData.score));
                } else {
                    // If AI didn't provide a valid score, calculate our own
                    analysisData.score = calculateCareerScore(careerGoal, skills, userRepos);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
        } catch (backendError) {
            console.log('Backend not available, using fallback analysis:', backendError.message);
            
            // Calculate authentic score using our improved algorithm
            const authenticScore = calculateCareerScore(careerGoal, skills, userRepos);
            
            // Generate contextual suggestions based on career goal and current status
            const suggestions = generateContextualSuggestions(careerGoal, skills, userRepos);
            
            // Generate contextual summary
            const summary = generateContextualSummary(careerGoal, skills, userRepos, authenticScore);
            
            analysisData = {
                summary: summary,
                top_suggestions: suggestions,
                score: authenticScore
            };
        }
        
        displayAnalysis(analysisData);
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        
        // Show fallback analysis for demo
        const fallbackScore = calculateCareerScore(careerGoal, skills, userRepos);
        const fallbackAnalysis = {
            summary: generateContextualSummary(careerGoal, skills, userRepos, fallbackScore),
            top_suggestions: generateContextualSuggestions(careerGoal, skills, userRepos),
            score: fallbackScore
        };
        
        displayAnalysis(fallbackAnalysis);
        
        // Show user-friendly error message
        setTimeout(() => {
            alert('Analysis completed with local scoring. For AI-powered insights, ensure your backend is running with OpenAI API key configured.');
        }, 500);
    } finally {
        // Reset button state
        analyzeBtn.disabled = false;
        analyzeBtnText.textContent = '🔍 Analyze My Skills';
        analyzeLoader.classList.add('hidden');
    }
}

// Generate contextual suggestions based on user's profile
function generateContextualSuggestions(careerGoal, skills, repos) {
    const suggestions = [];
    const goalLower = careerGoal.toLowerCase();
    const skillList = skills ? skills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean) : [];
    
    // AI/ML specific suggestions
    if (goalLower.includes('ai') || goalLower.includes('machine learning') || goalLower.includes('ml') || goalLower.includes('data scientist')) {
        if (!skillList.some(s => s.includes('python'))) {
            suggestions.push('Master Python programming - essential for AI/ML development');
        }
        if (!skillList.some(s => s.includes('tensorflow') || s.includes('pytorch'))) {
            suggestions.push('Learn deep learning frameworks like TensorFlow or PyTorch');
        }
        suggestions.push('Build end-to-end ML projects with real datasets from Kaggle');
        suggestions.push('Study neural network architectures and implement them from scratch');
    }
    
    // Web Development suggestions
    else if (goalLower.includes('web') || goalLower.includes('frontend') || goalLower.includes('full stack') || goalLower.includes('react') || goalLower.includes('javascript')) {
        if (!skillList.some(s => s.includes('javascript') || s.includes('js'))) {
            suggestions.push('Master modern JavaScript (ES6+) and asynchronous programming');
        }
        if (!skillList.some(s => s.includes('react') || s.includes('vue') || s.includes('angular'))) {
            suggestions.push('Learn a modern frontend framework like React, Vue, or Angular');
        }
        suggestions.push('Build responsive web applications with CSS Grid and Flexbox');
        suggestions.push('Create full-stack applications with REST APIs and databases');
    }
    
    // Data Analysis/Engineering suggestions
    else if (goalLower.includes('data') || goalLower.includes('analyst') || goalLower.includes('engineer')) {
        if (!skillList.some(s => s.includes('sql'))) {
            suggestions.push('Master SQL and database design for data manipulation');
        }
        if (!skillList.some(s => s.includes('python') || s.includes('r'))) {
            suggestions.push('Learn Python or R for statistical analysis and data processing');
        }
        suggestions.push('Create interactive dashboards with tools like Tableau or Power BI');
        suggestions.push('Work with big data technologies like Apache Spark or Hadoop');
    }
    
    // Mobile Development suggestions
    else if (goalLower.includes('mobile') || goalLower.includes('ios') || goalLower.includes('android') || goalLower.includes('flutter')) {
        suggestions.push('Build native mobile apps using Swift/Kotlin or cross-platform with Flutter/React Native');
        suggestions.push('Learn mobile UI/UX design principles and platform guidelines');
        suggestions.push('Implement mobile-specific features like push notifications and offline storage');
        suggestions.push('Publish apps to App Store/Google Play and gather user feedback');
    }
    
    // Generic suggestions if no specific match
    if (suggestions.length === 0) {
        suggestions.push(`Build 3-5 substantial projects specifically related to ${careerGoal}`);
        suggestions.push('Contribute to open source projects to demonstrate collaboration skills');
        suggestions.push('Network with professionals in your target field through LinkedIn and events');
        suggestions.push('Obtain industry-recognized certifications relevant to your career goal');
    }
    
    // Add repository-specific suggestions
    if (repos.length === 0) {
        suggestions.push('Start building projects and upload them to GitHub to showcase your skills');
    } else if (repos.length < 3) {
        suggestions.push('Expand your portfolio with more diverse projects to demonstrate versatility');
    }
    
    // Add skill-specific suggestions
    if (skillList.length < 5) {
        suggestions.push('Develop a broader skill set including both technical and soft skills');
    }
    
    // Return top 4-5 most relevant suggestions
    return suggestions.slice(0, 4);
}

// Generate contextual summary based on user's profile
function generateContextualSummary(careerGoal, skills, repos, score) {
    const skillList = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const hasProjects = repos.length > 0;
    const hasSkills = skillList.length > 0;
    
    let summary = `Based on your goal of becoming a ${careerGoal}, `;
    
    // Assessment based on score
    if (score >= 80) {
        summary += `you're well-positioned with strong foundations. `;
    } else if (score >= 65) {
        summary += `you have solid potential with room for strategic growth. `;
    } else if (score >= 50) {
        summary += `you're on the right track but need focused development. `;
    } else {
        summary += `you're beginning your journey with significant opportunities ahead. `;
    }
    
    // Project assessment
    if (hasProjects) {
        if (repos.length >= 5) {
            summary += `Your ${repos.length} GitHub projects demonstrate practical experience. `;
        } else {
            summary += `Your ${repos.length} project${repos.length > 1 ? 's show' : ' shows'} initiative, but expanding your portfolio would strengthen your candidacy. `;
        }
    } else {
        summary += `Building practical projects and showcasing them on GitHub will significantly boost your profile. `;
    }
    
    // Skills assessment
    if (hasSkills) {
        if (skillList.length >= 8) {
            summary += `Your diverse skill set positions you well for the dynamic tech landscape.`;
        } else if (skillList.length >= 5) {
            summary += `Your current skills provide a good foundation for continued growth.`;
        } else {
            summary += `Focus on expanding your technical toolkit to match industry expectations.`;
        }
    } else {
        summary += `Developing and showcasing relevant technical skills will be crucial for your career advancement.`;
    }
    
    return summary;
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
    const increment = Math.ceil(score / 60); // Smooth animation over ~2 seconds
    const scoreInterval = setInterval(() => {
        currentScore = Math.min(currentScore + increment, score);
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

console.log(' App.js loaded successfully');