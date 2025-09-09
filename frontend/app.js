// app.js - Theme 1 Compliant Main application logic

const API_BASE_URL = 'http://localhost:5000'; // Your Flask backend URL

// Enhanced GitHub API functionality using Descope Outbound Apps
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
        
        // Check authentication
        if (!window.descopeManager.isUserAuthenticated()) {
            throw new Error('Please log in first');
        }
        
        // Get auth token
        const authToken = window.descopeManager.getSessionToken();
        
        // Use backend proxy instead of direct GitHub API call (Theme 1 compliance)
        const response = await fetch(`${API_BASE_URL}/github/repos/${username}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 404) {
                throw new Error('GitHub user not found');
            } else if (response.status === 429) {
                throw new Error('API rate limit exceeded. Try again later or connect your GitHub account for higher limits.');
            } else {
                throw new Error(errorData.error || `API error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        const repos = data.repos || [];
        
        console.log(`✅ Found ${repos.length} repositories`);
        console.log(`🔐 Using authenticated API: ${data.using_auth || false}`);
        
        displayRepos(repos, data.using_auth);
        
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

// New function to fetch user's own repositories (Theme 1 compliant)
async function fetchMyRepos() {
    if (!window.descopeManager.isUserAuthenticated()) {
        alert('Please log in first');
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
        console.log('🔍 Fetching your GitHub repositories...');
        
        const authToken = window.descopeManager.getSessionToken();
        
        // Call the Theme 1 compliant endpoint
        const response = await fetch(`${API_BASE_URL}/github/user-repos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.requires_connection) {
                throw new Error('GitHub account not connected. Please reconnect through your profile settings.');
            }
            throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        const repos = data.repos || [];
        
        console.log(`✅ Found ${repos.length} of your repositories`);
        
        displayRepos(repos, true, true);
        
        // Clear username field since we're showing user's own repos
        document.getElementById('githubUsername').value = 'Your Repositories';
        document.getElementById('githubUsername').disabled = true;
        
    } catch (error) {
        console.error('❌ Error fetching your repositories:', error);
        alert('Error fetching your repositories: ' + error.message);
        
        // Show connection prompt if needed
        if (error.message.includes('not connected')) {
            showConnectionPrompt();
        }
        
    } finally {
        // Reset button state
        fetchBtnText.style.display = 'inline';
        fetchLoader.classList.add('hidden');
        fetchBtn.disabled = false;
    }
}

function displayRepos(repos, usingAuth = false, isUserRepos = false) {
    const reposSection = document.getElementById('reposSection');
    const repoCount = document.getElementById('repoCount');
    const reposGrid = document.getElementById('reposGrid');
    
    // Update count and add authentication indicator
    repoCount.innerHTML = `
        ${repos.length}
        ${usingAuth ? '<span style="color: #10b981; font-size: 12px;">🔐 Authenticated</span>' : '<span style="color: #f59e0b; font-size: 12px;">📖 Public</span>'}
        ${isUserRepos ? '<span style="color: #4c51bf; font-size: 12px;">👤 Your Repos</span>' : ''}
    `;
    
    // Clear existing repos
    reposGrid.innerHTML = '';
    
    if (repos.length === 0) {
        reposGrid.innerHTML = '<p style="color: #6b7280;">No repositories found.</p>';
    } else {
        repos.forEach(repo => {
            const repoCard = document.createElement('div');
            repoCard.className = 'repo-card';
            repoCard.innerHTML = `
                <div class="repo-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 class="repo-name" style="margin: 0; color: #4c51bf; font-size: 16px;">${repo.name}</h4>
                    <span class="repo-language" style="background: #e5e7eb; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${repo.language || 'N/A'}</span>
                </div>
                <p class="repo-description" style="color: #6b7280; margin-bottom: 15px; font-size: 14px; line-height: 1.4;">${repo.description || 'No description available'}</p>
                <div class="repo-stats" style="display: flex; gap: 15px; font-size: 12px; color: #9ca3af;">
                    <span>⭐ ${repo.stars || repo.stargazers_count || 0}</span>
                    <span>🍴 ${repo.forks || repo.forks_count || 0}</span>
                    <span>📅 ${new Date(repo.updated_at).toLocaleDateString()}</span>
                    ${repo.private ? '<span style="color: #dc2626;">🔒 Private</span>' : ''}
                </div>
                ${repo.topics && repo.topics.length > 0 ? `
                    <div class="repo-topics" style="margin-top: 10px;">
                        ${repo.topics.map(topic => `<span style="background: #ddd6fe; color: #5b21b6; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-right: 5px;">${topic}</span>`).join('')}
                    </div>
                ` : ''}
            `;
            reposGrid.appendChild(repoCard);
        });
    }
    
    // Show repos section
    reposSection.classList.remove('hidden');
}

function showConnectionPrompt() {
    const prompt = document.createElement('div');
    prompt.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #fef3c7; border: 1px solid #f59e0b;
        padding: 15px; border-radius: 8px; max-width: 300px; z-index: 1000;
    `;
    prompt.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🔗</span>
            <div>
                <strong>Connect GitHub Account</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Connect your GitHub account through Descope to access your private repositories and get higher API limits.</p>
            </div>
        </div>
        <button onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
    `;
    document.body.appendChild(prompt);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (prompt.parentElement) prompt.remove();
    }, 10000);
}

// Enhanced analysis function with better error handling
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
        console.log('🔍 Starting enhanced skill analysis...');
        
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
        
        console.log('📤 Sending enhanced request data:', requestData);
        
        // Get auth token
        const authToken = window.descopeManager.getSessionToken();
        
        if (!authToken || authToken === 'demo-token-for-testing') {
            // Handle demo mode
            if (authToken === 'demo-token-for-testing') {
                console.log('🚀 Demo mode - showing enhanced mock results');
                showEnhancedMockResults(requestData);
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
        console.log('📥 Enhanced response data:', result);
        
        if (!response.ok) {
            throw new Error(result.error || `Server error: ${response.status}`);
        }
        
        displayEnhancedResults(result);
        
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

function showEnhancedMockResults(requestData) {
    const mockResult = {
        summary: `Based on your goal of becoming a ${requestData.career_goal}, you have a solid foundation with your current skills. Your GitHub projects demonstrate practical experience that aligns well with your target role, though there are key areas for improvement.`,
        top_suggestions: [
            "Build 2-3 advanced projects showcasing system design and scalability patterns",
            "Contribute to 5+ open-source projects in your target domain to build community presence",
            "Earn industry-recognized certifications (AWS, Google Cloud, or relevant platform certs)"
        ],
        score: 78,
        skill_gaps: [
            "Advanced system design and architecture patterns",
            "Cloud infrastructure and DevOps practices"
        ],
        strengths: [
            "Strong programming fundamentals evident in GitHub projects",
            "Diverse project portfolio showing learning agility"
        ],
        data_sources: {
            github_repos: requestData.github_repos.length,
            skills: requestData.linkedin_skills.length,
            using_outbound_apps: false,
            analysis_timestamp: new Date().toISOString()
        },
        user: "demo@example.com"
    };
    
    displayEnhancedResults(mockResult);
}

function displayEnhancedResults(result) {
    console.log('📊 Displaying enhanced results:', result);
    
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
    
    // Add skill gaps and strengths sections if they exist
    if (result.skill_gaps || result.strengths) {
        addSkillInsights(result);
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
            
            // Update circle progress
            const angle = (currentScore / 100) * 360;
            scoreCircle.style.setProperty('--score-angle', `${angle}deg`);
            scoreNumber.style.color = scoreColor;
        }, 50);
    }
    
    // Show data source information
    if (result.data_sources) {
        showDataSourceInfo(result.data_sources);
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
    
    console.log('✅ Enhanced results displayed successfully');
}

function addSkillInsights(result) {
    // Find or create insights container
    let insightsContainer = document.getElementById('skillInsights');
    if (!insightsContainer) {
        insightsContainer = document.createElement('div');
        insightsContainer.id = 'skillInsights';
        insightsContainer.style.cssText = 'margin-top: 20px;';
        
        // Add after suggestions
        const suggestionsList = document.getElementById('suggestionsList');
        if (suggestionsList && suggestionsList.parentElement) {
            suggestionsList.parentElement.appendChild(insightsContainer);
        }
    }
    
    let insightsHTML = '';
    
    // Add skill gaps
    if (result.skill_gaps && result.skill_gaps.length > 0) {
        insightsHTML += `
            <h3 style="margin: 20px 0 15px 0; color: #dc2626; font-size: 18px;">🎯 Areas to Develop</h3>
            <div class="skill-gaps">
                ${result.skill_gaps.map(gap => `
                    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin-bottom: 10px; border-radius: 0 8px 8px 0;">
                        <span style="color: #991b1b; font-weight: 500;">${gap}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Add strengths
    if (result.strengths && result.strengths.length > 0) {
        insightsHTML += `
            <h3 style="margin: 20px 0 15px 0; color: #059669; font-size: 18px;">💪 Your Strengths</h3>
            <div class="strengths">
                ${result.strengths.map(strength => `
                    <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 12px; margin-bottom: 10px; border-radius: 0 8px 8px 0;">
                        <span style="color: #047857; font-weight: 500;">${strength}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    insightsContainer.innerHTML = insightsHTML;
}

function showDataSourceInfo(dataSources) {
    // Create or update data source indicator
    let dataInfo = document.getElementById('dataSourceInfo');
    if (!dataInfo) {
        dataInfo = document.createElement('div');
        dataInfo.id = 'dataSourceInfo';
        dataInfo.style.cssText = `
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; 
            padding: 15px; margin-top: 20px; font-size: 14px; color: #64748b;
        `;
        
        const analysisSection = document.getElementById('analysisSection');
        if (analysisSection) {
            analysisSection.appendChild(dataInfo);
        }
    }
    
    dataInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span style="font-size: 16px;">📊</span>
            <strong style="color: #475569;">Analysis Data Sources</strong>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div>GitHub Repos: <strong>${dataSources.github_repos || 0}</strong></div>
            <div>Skills Listed: <strong>${dataSources.skills || 0}</strong></div>
            <div>Using Outbound Apps: <strong style="color: ${dataSources.using_outbound_apps ? '#059669' : '#dc2626'};">${dataSources.using_outbound_apps ? 'Yes' : 'No'}</strong></div>
        </div>
        ${dataSources.using_outbound_apps ? 
            '<p style="margin-top: 10px; padding: 8px; background: #dcfce7; border-radius: 4px; color: #166534;">🔐 Using secure Descope-managed API tokens for enhanced analysis</p>' :
            '<p style="margin-top: 10px; padding: 8px; background: #fef3c7; border-radius: 4px; color: #92400e;">⚠️ Connect your accounts through Descope for more detailed analysis</p>'
        }
    `;
}

// Enhanced utility functions
function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #fef2f2; color: #991b1b;
        border: 1px solid #fecaca; padding: 15px 20px; border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; max-width: 400px;
    `;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">❌</span>
            <div>
                <strong>Error</strong>
                <p style="margin: 5px 0 0 0;">${message}</p>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #f0fdf4; color: #166534;
        border: 1px solid #bbf7d0; padding: 15px 20px; border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; max-width: 400px;
    `;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">✅</span>
            <div>
                <strong>Success</strong>
                <p style="margin: 5px 0 0 0;">${message}</p>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Add button to fetch user's own repos
function addMyReposButton() {
    const githubSection = document.querySelector('.github-section');
    if (githubSection && !document.getElementById('myReposBtn')) {
        const myReposBtn = document.createElement('button');
        myReposBtn.id = 'myReposBtn';
        myReposBtn.className = 'btn btn-fetch';
        myReposBtn.style.marginLeft = '10px';
        myReposBtn.innerHTML = `
            <span>My Repos</span>
        `;
        myReposBtn.onclick = fetchMyRepos;
        githubSection.appendChild(myReposBtn);
    }
}

// Initialize enhanced app
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Enhanced App.js loaded and ready (Theme 1 Compliant)');
    
    // Add enhanced UI elements
    addMyReposButton();
    
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
    
    // Add help tooltips
    addHelpTooltips();
    
    // Show welcome message for Theme 1 compliance
    setTimeout(() => {
        if (window.descopeManager && window.descopeManager.isUserAuthenticated()) {
            showSuccess('Connected to AI Skill Navigator - Theme 1 compliant version with Descope Outbound Apps support!');
        }
    }, 2000);
});

function addHelpTooltips() {
    // Add tooltip to GitHub username field
    const githubInput = document.getElementById('githubUsername');
    const githubLabel = document.querySelector('label[for="githubUsername"]');
    if (githubLabel && !githubLabel.querySelector('.help-text')) {
        const helpText = document.createElement('span');
        helpText.className = 'help-text';
        helpText.style.cssText = 'font-size: 12px; color: #6b7280; font-weight: normal; margin-left: 8px;';
        helpText.textContent = '(or use "My Repos" for your connected GitHub account)';
        githubLabel.appendChild(helpText);
    }
}

console.log('📄 Enhanced app.js loaded - Theme 1 Compliant');