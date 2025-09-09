// app.js - Main application logic

const API_BASE_URL = 'http://localhost:5000'; // Your Flask backend URL

// GitHub API functionality
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
    fetchBtnText.style.display = 'none';
    fetchLoader.classList.remove('hidden');
    fetchBtn.disabled = true;
    
    try {
        console.log(`🔍 Fetching repositories for: ${username}`);
        
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=20`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('GitHub user not found');
            } else if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Try again later.');
            } else {
                throw new Error(`GitHub API error: ${response.status}`);
            }
        }
        
        const repos = await response.json();
        console.log(`✅ Found ${repos.length} repositories`);
        
        displayRepos(repos);
        
    } catch (error) {
        console.error('❌ Error fetching repositories:', error);
        alert('Error fetching repositories: ' + error.message);
        
        // Hide repos section if there was an error
        document.getElementById('reposSection').classList.add('hidden');
        
    } finally {
        // Reset button state
        fetchBtnText.style.display = 'inline';
        fetchLoader.classList.add('hidden');
        fetchBtn.disabled = false;
    }
}

function displayRepos(repos) {
    const reposSection = document.getElementById('reposSection');
    const repoCount = document.getElementById('repoCount');
    const reposGrid = document.getElementById('reposGrid');
    
    // Update count
    repoCount.textContent = repos.length;
    
    // Clear existing repos
    reposGrid.innerHTML = '';
    
    if (repos.length === 0) {
        reposGrid.innerHTML = '<p style="color: #6b7280;">No repositories found.</p>';
    } else {
        repos.forEach(repo => {
            const repoCard = document.createElement('div');
            repoCard.className = 'repo-card';
            repoCard.innerHTML = `
                <div class="repo-header">
                    <h4 class="repo-name">${repo.name}</h4>
                    <span class="repo-language">${repo.language || 'N/A'}</span>
                </div>
                <p class="repo-description">${repo.description || 'No description available'}</p>
                <div class="repo-stats">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    <span>📅 ${new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
            `;
            reposGrid.appendChild(repoCard);
        });
    }
    
    // Show repos section
    reposSection.classList.remove('hidden');
}

// Main analysis function
async function analyzeSkills() {
    const careerGoal = document.getElementById('careerGoal').value.trim();
    const skills = document.getElementById('skills').value.trim();
    const githubUsername = document.getElementById('githubUsername').value.trim();
    
    if (!careerGoal) {
        alert('Please enter your career goal');
        return;
    }
    
    // Check authentication
    if (!window.descopeManager.isUserAuthenticated()) {
        alert('Please log in first');
        return;
    }
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeBtnText = document.getElementById('analyzeBtnText');
    const analyzeLoader = document.getElementById('analyzeLoader');
    
    // Show loading state
    analyzeBtnText.style.display = 'none';
    analyzeLoader.classList.remove('hidden');
    analyzeBtn.disabled = true;
    
    try {
        console.log('🔍 Starting skill analysis...');
        
        // Prepare data
        const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [];
        
        // Get repository names from the displayed repos
        const repoElements = document.querySelectorAll('.repo-name');
        const githubRepos = Array.from(repoElements).map(el => el.textContent);
        
        const requestData = {
            career_goal: careerGoal,
            linkedin_skills: skillsArray,
            github_repos: githubRepos
        };
        
        console.log('📤 Sending request data:', requestData);
        
        // Get auth token
        const authToken = window.descopeManager.getSessionToken();
        
        if (!authToken || authToken === 'demo-token-for-testing') {
            // Handle demo mode
            if (authToken === 'demo-token-for-testing') {
                console.log('🚀 Demo mode - showing mock results');
                showMockResults(requestData);
                return;
            } else {
                throw new Error('No authentication token available');
            }
        }
        
        // Make API request
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📡 Response status:', response.status);
        
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (!response.ok) {
            throw new Error(result.error || `Server error: ${response.status}`);
        }
        
        displayResults(result);
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        alert('Analysis failed: ' + error.message);
        
    } finally {
        // Reset button state
        analyzeBtnText.style.display = 'inline';
        analyzeLoader.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
}

function showMockResults(requestData) {
    const mockResult = {
        summary: `Based on your goal of becoming a ${requestData.career_goal}, you have a solid foundation with your current skills. Your GitHub projects demonstrate practical experience that aligns well with your target role.`,
        top_suggestions: [
            "Build more projects showcasing advanced algorithms and data structures",
            "Contribute to open-source projects in your target domain",
            "Earn relevant certifications to validate your expertise"
        ],
        score: 78,
        user: "demo@example.com"
    };
    
    displayResults(mockResult);
}

function displayResults(result) {
    console.log('📊 Displaying results:', result);
    
    // Update summary
    const summaryElement = document.getElementById('analysisSummary');
    if (summaryElement) {
        summaryElement.textContent = result.summary || 'No summary available';
    }
    
    // Update suggestions
    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestionsList && result.top_suggestions) {
        suggestionsList.innerHTML = '';
        result.top_suggestions.forEach((suggestion, index) => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <div class="suggestion-number">${index + 1}</div>
                <div class="suggestion-text">${suggestion}</div>
            `;
            suggestionsList.appendChild(suggestionElement);
        });
    }
    
    // Update score with animation
    const scoreNumber = document.getElementById('scoreNumber');
    const scoreCircle = document.getElementById('scoreCircle');
    
    if (scoreNumber && scoreCircle && result.score !== undefined) {
        // Animate score from 0 to target
        let currentScore = 0;
        const targetScore = Math.max(0, Math.min(100, result.score));
        const duration = 2000; // 2 seconds
        const increment = targetScore / (duration / 50);
        
        const scoreAnimation = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreAnimation);
            }
            
            scoreNumber.textContent = Math.round(currentScore);
            
            // Update circle color based on score
            let scoreColor;
            if (currentScore >= 80) {
                scoreColor = '#10b981'; // green
            } else if (currentScore >= 60) {
                scoreColor = '#f59e0b'; // yellow
            } else {
                scoreColor = '#ef4444'; // red
            }
            
            scoreCircle.style.borderColor = scoreColor;
            scoreNumber.style.color = scoreColor;
        }, 50);
    }
    
    // Show results section
    const analysisSection = document.getElementById('analysisSection');
    if (analysisSection) {
        analysisSection.classList.remove('hidden');
        
        // Scroll to results
        analysisSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    console.log('✅ Results displayed successfully');
}

// Utility functions
function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    // You could implement a better success message display here
    console.log('✅ Success:', message);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 App.js loaded and ready');
    
    // Add enter key listeners for better UX
    document.getElementById('githubUsername').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchRepos();
        }
    });
    
    document.getElementById('careerGoal').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeSkills();
        }
    });
});

console.log('📄 app.js loaded');