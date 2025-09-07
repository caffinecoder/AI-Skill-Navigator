// Descope integration for AI Skill Navigator

// Wait for Descope component to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Initializing Descope authentication...');
    
    // Get the Descope component
    const descopeComponent = document.querySelector('descope-wc');
    
    if (!descopeComponent) {
        console.error('❌ Descope component not found');
        return;
    }

    // Configure Descope event listeners
    setupDescopeListeners(descopeComponent);
});

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

// Enhance the existing logout function to include Descope logout
// Wait for the logout function to be available, then enhance it
document.addEventListener('DOMContentLoaded', function() {
    // Store reference to original logout if it exists
    const originalLogout = window.logout;
    
    // Override with enhanced version
    window.logout = function() {
        handleDescopeLogout();
        if (originalLogout) {
            originalLogout();
        }
    };
});