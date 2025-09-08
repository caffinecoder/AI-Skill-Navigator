// Descope integration for AI Skill Navigator

// Global variables for session management
let sessionToken = null;
let userProfile = null;
let userRepos = [];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Initializing Descope authentication...');
    
    // Check for existing session
    checkExistingSession();
    
    // Get the Descope component
    const descopeComponent = document.querySelector('descope-wc');
    
    if (!descopeComponent) {
        console.error('❌ Descope component not found');
        return;
    }

    // Configure Descope event listeners
    setupDescopeListeners(descopeComponent);
    
    // Small delay to ensure app.js has loaded before setting up logout override
    setTimeout(() => {
        // Override the logout function if it exists in the global scope
        if (typeof window.logout === 'function') {
            const originalLogout = window.logout;
            window.logout = function() {
                handleDescopeLogout();
                originalLogout();
            };
        } else {
            // If logout doesn't exist yet, create it
            window.logout = enhancedLogout;
        }
    }, 100);
});

function checkExistingSession() {
    const token = localStorage.getItem('sessionToken');
    const email = localStorage.getItem('userEmail');
    
    if (token && email) {
        // For demo purposes, we'll just show the app
        // In a real app, you would validate the session first
        showMainApp(email);
    }
}

function setupDescopeListeners(descopeComponent) {
    // Success event - user successfully logged in
    descopeComponent.addEventListener('success', (e) => {
        console.log('✅ Descope login successful:', e.detail);
        
        const { user, sessionJwt } = e.detail;
        
        // Store session information
        sessionToken = sessionJwt;
        userProfile = user;
        localStorage.setItem('sessionToken', sessionJwt);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userProfile', JSON.stringify(user));
        
        // Show main application
        showMainApp(user.email);
        
        console.log('🎉 User authenticated via Descope:', user.email);
    });

    // Error event - login failed
    descopeComponent.addEventListener('error', (e) => {
        console.error('❌ Descope login error:', e.detail);
        alert('Login failed. Please try again.');
    });

    // Ready event - Descope component is ready
    descopeComponent.addEventListener('ready', (e) => {
        console.log('🔐 Descope component ready');
    });
}

function showMainApp(email) {
    // This function would typically show your main application UI
    // and hide the login screen
    console.log('Showing main app for user:', email);
    
    // Example implementation (you'll need to adapt this to your actual UI):
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    
    // Update user email display if element exists
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) userEmailElement.textContent = email;
}

// Utility function to get current session token
function getSessionToken() {
    return sessionToken || localStorage.getItem('sessionToken');
}

// Function to validate current session
async function validateSession() {
    const token = getSessionToken();
    
    if (!token) {
        return false;
    }
    
    // For demo mode, assume token is valid
    if (token.startsWith('demo-session-token')) {
        return true;
    }
    
    try {
        // In production, validate with your backend
        const response = await fetch('http://localhost:5000/validate-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.warn('Session validation failed:', error);
        return false;
    }
}

// Function to handle logout from Descope
function handleDescopeLogout() {
    // Clear Descope session if available
    if (window.Descope && window.Descope.logout) {
        window.Descope.logout();
    }
    
    // Clear local storage
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userProfile');
    
    console.log('🔐 Descope session cleared');
}

// Enhanced logout function that includes Descope cleanup
function enhancedLogout() {
    handleDescopeLogout();
    
    // Clear app state
    sessionToken = null;
    userProfile = null;
    userRepos = [];
    
    // Reset UI
    const mainApp = document.getElementById('mainApp');
    const loginScreen = document.getElementById('loginScreen');
    
    if (mainApp) mainApp.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'block';
    
    console.log(' User logged out');
}