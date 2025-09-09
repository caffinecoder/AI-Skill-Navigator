// descope_setup.js - Fixed for your HTML structure

class DescopeManager {
    constructor() {
        this.projectId = 'P31lWtDeYzgqh6jCiC3fZB61zVdF';
        this.currentUser = null;
        this.sessionToken = null;
        this.isAuthenticated = false;
    }

    init() {
        console.log('🔧 Initializing Descope Manager...');
        
        // Wait for Descope web component to be ready
        this.waitForDescopeComponent()
            .then(() => {
                this.setupDescopeEventListeners();
                this.checkExistingSession();
            })
            .catch(error => {
                console.error('❌ Failed to initialize Descope:', error);
                this.showError('Failed to initialize authentication system');
            });
    }

    async waitForDescopeComponent() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50;
            let attempts = 0;
            
            const checkForComponent = () => {
                const descopeElement = document.querySelector('descope-wc');
                
                if (descopeElement && window.customElements.get('descope-wc')) {
                    console.log('✅ Descope web component found');
                    resolve(descopeElement);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkForComponent, 100);
                } else {
                    reject(new Error('Descope component not found after waiting'));
                }
            };
            
            checkForComponent();
        });
    }

    setupDescopeEventListeners() {
        const descopeElement = document.querySelector('descope-wc');
        
        if (!descopeElement) {
            console.error('❌ Descope element not found');
            return;
        }

        console.log('🔗 Setting up Descope event listeners...');

        // Listen for successful authentication
        descopeElement.addEventListener('success', (event) => {
            console.log('✅ Descope authentication successful:', event.detail);
            this.handleAuthSuccess(event.detail);
        });

        // Listen for authentication errors
        descopeElement.addEventListener('error', (event) => {
            console.error('❌ Descope authentication error:', event.detail);
            this.handleAuthError(event.detail);
        });

        // Listen for ready state
        descopeElement.addEventListener('ready', () => {
            console.log('✅ Descope component is ready');
        });

        // Additional event listeners
        descopeElement.addEventListener('userChange', (event) => {
            console.log('👤 User change event:', event.detail);
            this.handleUserChange(event.detail);
        });
    }

    async checkExistingSession() {
        try {
            console.log('🔍 Checking for existing session...');
            
            // Try to get session from Descope SDK
            const descopeElement = document.querySelector('descope-wc');
            
            if (descopeElement && descopeElement.sdk) {
                const sessionToken = descopeElement.sdk.getSessionToken();
                
                if (sessionToken) {
                    console.log('✅ Found existing session token');
                    
                    try {
                        const userInfo = await descopeElement.sdk.me();
                        console.log('✅ User info retrieved:', userInfo);
                        
                        this.currentUser = userInfo;
                        this.sessionToken = sessionToken;
                        this.isAuthenticated = true;
                        
                        this.showMainApp();
                    } catch (error) {
                        console.log('❌ Session token invalid, clearing...');
                        this.clearSession();
                    }
                } else {
                    console.log('ℹ️ No existing session found');
                }
            }
        } catch (error) {
            console.error('❌ Error checking existing session:', error);
        }
    }

    handleAuthSuccess(detail) {
        console.log('🎉 Authentication successful!', detail);
        
        try {
            // Extract user information from the success event
            this.currentUser = detail.user || detail;
            this.sessionToken = detail.sessionJwt || detail.sessionToken;
            this.isAuthenticated = true;
            
            console.log('👤 Current user:', this.currentUser);
            console.log('🔑 Session token exists:', !!this.sessionToken);
            
            this.showMainApp();
            
        } catch (error) {
            console.error('❌ Error handling auth success:', error);
            this.showError('Authentication succeeded but failed to process user data');
        }
    }

    handleAuthError(detail) {
        console.error('❌ Authentication failed:', detail);
        
        let errorMessage = 'Authentication failed';
        
        if (detail && detail.errorMessage) {
            errorMessage = detail.errorMessage;
        } else if (detail && detail.error) {
            errorMessage = detail.error;
        } else if (typeof detail === 'string') {
            errorMessage = detail;
        }
        
        this.showError(errorMessage);
        this.showLoginScreen();
    }

    handleUserChange(detail) {
        console.log('👤 User change detected:', detail);
        
        if (detail && detail.user) {
            this.currentUser = detail.user;
            this.updateUserDisplay();
        }
    }

    showMainApp() {
        console.log('🏠 Showing main application...');
        
        // Hide login screen
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }
        
        // Show main app
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.classList.remove('hidden');
        }
        
        this.updateUserDisplay();
        
        console.log('✅ Main application is now visible');
    }

    showLoginScreen() {
        console.log('🔐 Showing login screen...');
        
        // Show login screen
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
        }
        
        // Hide main app
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.classList.add('hidden');
        }
        
        console.log('✅ Login screen is now visible');
    }

    updateUserDisplay() {
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement && this.currentUser) {
            const email = this.currentUser.email || this.currentUser.loginId || 'User';
            userEmailElement.textContent = email;
            console.log('👤 Updated user display:', email);
        }
    }

    showError(message) {
        console.error('🚨 Showing error:', message);
        
        // You can implement a better error display here
        // For now, just show an alert
        alert('Error: ' + message);
    }

    async logout() {
        try {
            console.log('🚪 Logging out...');
            
            const descopeElement = document.querySelector('descope-wc');
            
            if (descopeElement && descopeElement.sdk) {
                await descopeElement.sdk.logout();
            }
            
            this.clearSession();
            this.showLoginScreen();
            
            console.log('✅ Logout successful');
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Clear session anyway
            this.clearSession();
            this.showLoginScreen();
        }
    }

    clearSession() {
        this.currentUser = null;
        this.sessionToken = null;
        this.isAuthenticated = false;
        console.log('🧹 Session cleared');
    }

    getSessionToken() {
        if (this.sessionToken) {
            return this.sessionToken;
        }
        
        // Try to get from Descope SDK as fallback
        const descopeElement = document.querySelector('descope-wc');
        if (descopeElement && descopeElement.sdk) {
            const token = descopeElement.sdk.getSessionToken();
            if (token) {
                this.sessionToken = token;
                return token;
            }
        }
        
        return null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated && !!this.sessionToken;
    }
}

// Create global instance
window.descopeManager = new DescopeManager();

// Global functions for HTML onclick handlers
function logout() {
    window.descopeManager.logout();
}

function demoLogin() {
    console.log('🚀 Demo login activated');
    
    // Set demo user data
    window.descopeManager.currentUser = {
        email: 'demo@example.com',
        name: 'Demo User'
    };
    window.descopeManager.sessionToken = 'demo-token-for-testing';
    window.descopeManager.isAuthenticated = true;
    
    window.descopeManager.showMainApp();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded, initializing Descope...');
        setTimeout(() => window.descopeManager.init(), 100);
    });
} else {
    console.log('📄 DOM already loaded, initializing Descope...');
    setTimeout(() => window.descopeManager.init(), 100);
}