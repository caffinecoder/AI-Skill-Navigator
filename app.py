from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import json
import jwt
import requests
from functools import wraps
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Setup ---
app = Flask(__name__)

# Configure CORS for production
if os.environ.get('FLASK_ENV') == 'production':
    # Add your actual frontend domain here
    CORS(app, origins=["https://your-frontend-domain.com", "https://your-other-domain.com"])
else:
    # Allow all origins in development
    CORS(app)

# Configure OpenAI client
try:
    openai_client = openai.OpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
    )
    print("✅ OpenAI client configured successfully")
except Exception as e:
    print(f"❌ OpenAI configuration error: {e}")
    openai_client = None

# Descope configuration
DESCOPE_PROJECT_ID = os.getenv("DESCOPE_PROJECT_ID", "P31lWtDeYzgqh6jCiC3fZB61zVdF")
DESCOPE_MANAGEMENT_KEY = os.getenv("DESCOPE_MANAGEMENT_KEY")

def verify_descope_token(token):
    """
    Verify Descope JWT token - shared function for both Flask and MCP
    """
    try:
        if not DESCOPE_PROJECT_ID:
            print("❌ DESCOPE_PROJECT_ID not configured")
            return None
            
        # Decode without verification first to check structure
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        
        # Basic validation
        if decoded_token.get('iss') != f"https://api.descope.com/{DESCOPE_PROJECT_ID}":
            print("❌ Invalid issuer in token")
            return None
            
        # TODO: Add proper signature verification with public key
        # For now, we'll trust tokens that have the right structure
        
        print(f"✅ Token validated for user: {decoded_token.get('sub')}")
        return decoded_token
        
    except jwt.ExpiredSignatureError:
        print("❌ Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {e}")
        return None
    except Exception as e:
        print(f"❌ Token verification error: {e}")
        return None

def get_outbound_app_token(user_id, provider_name):
    """
    Get external service token from Descope Outbound Apps
    This uses Descope's management API to get tokens for external services
    """
    try:
        if not DESCOPE_MANAGEMENT_KEY:
            print("❌ DESCOPE_MANAGEMENT_KEY not configured")
            return None
            
        headers = {
            'Authorization': f'Bearer {DESCOPE_MANAGEMENT_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Call Descope Management API to get the outbound app token
        url = f"https://api.descope.com/v1/mgmt/user/{user_id}/outbound/{provider_name}/token"
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get('access_token')
        else:
            print(f"❌ Failed to get outbound token: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting outbound token: {e}")
        return None

def analyze_career(career_goal, repos=None, skills=None, user_email=None):
    """
    Perform career analysis - shared function for both Flask and MCP
    """
    if not openai_client:
        raise ValueError("OpenAI not configured")
    
    repos = repos or []
    skills = skills or []
    
    if not career_goal.strip():
        raise ValueError("career_goal is required")

    # Enhanced prompt with more detailed analysis
    prompt = f"""
You are an expert tech career advisor with deep knowledge of industry requirements and skill gaps.

User Information:
- Career Goal: {career_goal}
- Current Skills: {', '.join(skills[:15])}
- GitHub Projects: {', '.join(repos[:15])}

Analyze this profile comprehensively and provide actionable guidance.

Return ONLY valid JSON in this exact format:
{{
  "summary": "2-3 sentences analyzing their current position relative to their goal and highlighting key strengths or gaps",
  "top_suggestions": [
    "Specific, actionable suggestion with clear next steps",
    "Another concrete recommendation with timeline or resources",
    "Third practical suggestion focusing on skill building or portfolio"
  ],
  "score": 85,
  "skill_gaps": [
    "Important missing skill for their goal",
    "Another key area to develop"
  ],
  "strengths": [
    "Notable strength from their profile",
    "Another positive aspect"
  ]
}}
"""

    print("🤖 Sending enhanced prompt to OpenAI...")
    
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    raw_output = response.choices[0].message.content.strip()
    print("🔍 Raw AI Output:", raw_output)

    try:
        parsed_output = json.loads(raw_output)
        
        # Add user context to response if provided
        if user_email:
            parsed_output["user"] = user_email
        
        return parsed_output
        
    except json.JSONDecodeError as json_err:
        print(f"❌ JSON parsing error: {json_err}")
        raise ValueError(f"Model returned invalid JSON: {raw_output}")

# Flask-specific decorators and routes
def auth_required(func):
    """Decorator to require authentication for Flask routes"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"error": "No authorization header provided"}), 401
            
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Invalid authorization header format"}), 401
            
        token = auth_header.split(' ')[1]
        
        # Handle demo token
        if token == 'demo-token-for-testing':
            request.user = {
                'sub': 'demo-user-123',
                'email': 'demo@example.com',
                'name': 'Demo User'
            }
            return func(*args, **kwargs)
        
        # Verify the token
        user_data = verify_descope_token(token)
        if not user_data:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        # Add user data to request context
        request.user = user_data
        return func(*args, **kwargs)
    
    return wrapper

# --- Flask Routes ---
@app.route("/", methods=["GET"])
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "AI Skill Navigator - Theme 1 Compliant",
        "endpoints": [
            "/analyze", 
            "/auth/verify", 
            "/github/repos/<username>",
            "/github/user-repos"
        ],
        "auth_configured": bool(DESCOPE_PROJECT_ID),
        "outbound_apps_configured": bool(DESCOPE_MANAGEMENT_KEY),
        "external_integrations": ["GitHub", "LinkedIn (planned)"],
        "mcp_available": True
    })

@app.route("/auth/verify", methods=["POST"])
def verify_auth():
    """Verify authentication token"""
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"valid": False, "error": "Invalid authorization header"}), 401
            
        token = auth_header.split(' ')[1]
        
        # Handle demo token
        if token == 'demo-token-for-testing':
            return jsonify({
                "valid": True,
                "user": {
                    "id": "demo-user-123",
                    "email": "demo@example.com",
                    "name": "Demo User"
                },
                "demo_mode": True
            })
        
        user_data = verify_descope_token(token)
        
        if user_data:
            return jsonify({
                "valid": True,
                "user": {
                    "id": user_data.get('sub'),
                    "email": user_data.get('email'),
                    "name": user_data.get('name')
                },
                "demo_mode": False
            })
        else:
            return jsonify({"valid": False, "error": "Invalid token"}), 401
            
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 500

@app.route("/github/repos/<username>", methods=["GET"])
@auth_required
def get_github_repos_public(username):
    """
    Fetch public GitHub repos for any username (fallback for demo)
    """
    try:
        print(f"🔍 Fetching public repos for username: {username}")
        
        # For demo purposes, we'll still allow public API calls
        # In production, this should use Descope-managed tokens
        headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Skill-Navigator'
        }
        
        # Add GitHub token if available from outbound apps
        github_token = get_outbound_app_token(request.user['sub'], 'github')
        if github_token:
            headers['Authorization'] = f'Bearer {github_token}'
            print("✅ Using Descope-managed GitHub token")
        else:
            print("⚠️ No Descope GitHub token available, using public API")
        
        response = requests.get(
            f'https://api.github.com/users/{username}/repos?sort=updated&per_page=20',
            headers=headers
        )
        
        if response.status_code == 200:
            repos_data = response.json()
            
            # Process and return relevant repo information
            processed_repos = []
            for repo in repos_data:
                processed_repos.append({
                    'name': repo['name'],
                    'description': repo['description'],
                    'language': repo['language'],
                    'stars': repo['stargazers_count'],
                    'forks': repo['forks_count'],
                    'updated_at': repo['updated_at'],
                    'topics': repo.get('topics', []),
                    'html_url': repo['html_url']
                })
            
            return jsonify({
                'repos': processed_repos,
                'total_count': len(processed_repos),
                'rate_limit_remaining': response.headers.get('X-RateLimit-Remaining', 'unknown'),
                'using_auth': bool(github_token)
            })
        elif response.status_code == 404:
            return jsonify({"error": "GitHub user not found"}), 404
        elif response.status_code == 403:
            return jsonify({"error": "GitHub API rate limit exceeded"}), 429
        else:
            return jsonify({"error": f"GitHub API error: {response.status_code}"}), 400
            
    except Exception as e:
        print(f"❌ Error fetching GitHub repos: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/github/user-repos", methods=["GET"])
@auth_required
def get_user_github_repos():
    """
    Fetch the authenticated user's GitHub repositories using Descope-managed token
    This is the true Theme 1 compliant endpoint
    """
    try:
        print(f"🔍 Fetching authenticated user's repos for: {request.user.get('email')}")
        
        # Get GitHub token from Descope Outbound Apps
        github_token = get_outbound_app_token(request.user['sub'], 'github')
        
        if not github_token:
            return jsonify({
                "error": "GitHub account not connected. Please reconnect your GitHub account through Descope.",
                "requires_connection": True
            }), 400
        
        headers = {
            'Authorization': f'Bearer {github_token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Skill-Navigator'
        }
        
        # Fetch user's own repositories
        response = requests.get(
            'https://api.github.com/user/repos?sort=updated&per_page=50&affiliation=owner',
            headers=headers
        )
        
        if response.status_code == 200:
            repos_data = response.json()
            
            # Process repositories with enhanced data
            processed_repos = []
            for repo in repos_data:
                processed_repos.append({
                    'name': repo['name'],
                    'description': repo['description'],
                    'language': repo['language'],
                    'stars': repo['stargazers_count'],
                    'forks': repo['forks_count'],
                    'updated_at': repo['updated_at'],
                    'topics': repo.get('topics', []),
                    'html_url': repo['html_url'],
                    'private': repo['private'],
                    'size': repo['size']
                })
            
            return jsonify({
                'repos': processed_repos,
                'total_count': len(processed_repos),
                'rate_limit_remaining': response.headers.get('X-RateLimit-Remaining', 'unknown'),
                'authenticated': True
            })
        else:
            return jsonify({
                "error": f"Failed to fetch repositories: {response.status_code}",
                "requires_reconnection": True
            }), 400
            
    except Exception as e:
        print(f"❌ Error fetching authenticated user repos: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/analyze", methods=["POST"])
@auth_required
def analyze_endpoint():
    """
    AI analysis endpoint (Flask version) - Enhanced for Theme 1
    Requires Bearer token in Authorization header.
    """
    print(f"📥 Analyze endpoint hit by user: {request.user.get('email', 'unknown')}")
    
    try:
        body = request.get_json(force=True, silent=True) or {}
        print(f"📋 Request body: {body}")
        
        career_goal = (body.get("career_goal") or "").strip()
        repos = body.get("github_repos") or []
        skills = body.get("linkedin_skills") or []
        user_email = request.user.get('email', 'unknown')

        # Enhanced validation
        if not career_goal:
            return jsonify({"error": "Career goal is required"}), 400

        # Use shared analysis function with enhanced data
        result = analyze_career(career_goal, repos, skills, user_email)
        
        # Add metadata about data sources
        result["data_sources"] = {
            "github_repos": len(repos),
            "skills": len(skills),
            "using_outbound_apps": bool(get_outbound_app_token(request.user['sub'], 'github')),
            "analysis_timestamp": json.dumps({"timestamp": "now"}, default=str)
        }
        
        print("✅ Successfully analyzed career with enhanced data")
        return jsonify(result)

    except ValueError as ve:
        print(f"❌ Validation error: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"❌ General error: {e}")
        return jsonify({"error": str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "available_endpoints": ["/", "/analyze", "/auth/verify", "/github/repos/<username>", "/github/user-repos"]
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "error": "Method not allowed",
        "hint": "Check the HTTP method for your endpoint"
    }), 405

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        "error": "Unauthorized",
        "hint": "Include valid Bearer token in Authorization header"
    }), 401

# --- Run server ---
if __name__ == "__main__":
    print("🚀 Starting AI Skill Navigator - Theme 1 Compliant...")
    print("📍 Available endpoints:")
    print("   GET  / - Health check")
    print("   POST /analyze - AI analysis (requires auth)")
    print("   POST /auth/verify - Verify authentication token")
    print("   GET  /github/repos/<username> - Public GitHub repos")
    print("   GET  /github/user-repos - User's GitHub repos (Outbound Apps)")
    print("💡 MCP Server available: Run 'python mcp_server.py' for MCP mode")
    
    if not DESCOPE_PROJECT_ID:
        print("⚠️  Warning: DESCOPE_PROJECT_ID environment variable not set")
    else:
        print(f"🔐 Descope authentication configured for project: {DESCOPE_PROJECT_ID}")
    
    if not DESCOPE_MANAGEMENT_KEY:
        print("⚠️  Warning: DESCOPE_MANAGEMENT_KEY not set - Outbound Apps won't work")
    else:
        print("🔗 Descope Outbound Apps integration enabled")
        
    app.run(host="0.0.0.0", port=5000, debug=True)