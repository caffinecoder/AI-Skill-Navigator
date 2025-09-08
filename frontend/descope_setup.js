// Descope integration for AI Skill Navigator

// Wait for Descope component to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Initializing Descope authentication...');
    
    // Wait a bit for Descope component to fully load
    setTimeout(() => {
        const descopeComponent = document.querySelector('descope-wc');
        
        if (!descopeComponent) {
            console.error('❌ Descope component not found');
            return;
        }

        console.log('✅ Descope component found, setting up listeners...');
        setupDescopeListeners(descopeComponent);
    }, 1000);
});

function setupDescopeListeners(descopeComponent) {
    // Success event - user successfully logged in
    descopeComponent.addEventListener('success', function(e) {
        console.log('✅ Descope login successful:', e.detail);
        
        try {
            const user = e.detail.user;
            const sessionJwt = e.detail.sessionJwt;
            
            if (!user || !user.email) {
                console.error('❌ User data missing from Descope response');
                return;
            }
            
            // Store session information
            window.sessionToken = sessionJwt;
            window.userProfile = user;
            localStorage.setItem('sessionToken', sessionJwt);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userProfile', JSON.stringify(user));
            
            // Show main application
            if (typeof showMainApp === 'function') {
                showMainApp(user.email);
            } else {
                console.error('❌ showMainApp function not found');
            }
            
            console.log('🎉 User authenticated via Descope:', user.email);
        } catch (error) {
            console.error('❌ Error processing Descope success:', error);
        }
    });

    // Error event - login failed
    descopeComponent.addEventListener('error', function(e) {
        console.error('❌ Descope login error:', e.detail);
        alert('Login failed. Please try again.');
    });

    // Ready event - Descope component is ready
    descopeComponent.addEventListener('ready', function(e) {
        console.log('🔐 Descope component ready');
    });
}

// Function to handle logout from Descope
function handleDescopeLogout() {
    try {
        // Clear Descope session if available
        if (window.Descope && window.Descope.logout) {
            window.Descope.logout();
        }
        
        // Clear local storage
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userProfile');
        
        console.log('🔐 Descope session cleared');
    } catch (error) {
        console.error('Error during Descope logout:', error);
    }
}

// Enhanced logout function
function enhancedLogout() {
    handleDescopeLogout();
    
    // Call the original logout function if it exists
    if (typeof logout === 'function') {
        logout();
    } else {
        // Fallback logout logic
        window.isAuthenticated = false;
        window.sessionToken = null;
        window.userProfile = null;
        window.userRepos = [];
        
        // Reset UI
        const mainApp = document.getElementById('mainApp');
        const loginScreen = document.getElementById('loginScreen');
        
        if (mainApp) mainApp.classList.add('hidden');
        if (loginScreen) loginScreen.classList.remove('hidden');
        
        console.log('👋 User logged out');
    }
}

// Override the logout function when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to load
    setTimeout(() => {
        if (typeof window.logout === 'function') {
            const originalLogout = window.logout;
            window.logout = function() {
                handleDescopeLogout();
                originalLogout();
            };
            console.log('✅ Logout function enhanced with Descope cleanup');
        } else {
            window.logout = enhancedLogout;
            console.log('✅ Fallback logout function created');
        }
    }, 500);
});