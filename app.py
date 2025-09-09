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
DESCOPE_PROJECT_ID = os.getenv("DESCOPE_PROJECT_ID")

def verify_descope_token(token):
    """
    Verify Descope JWT token
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

def analyze_career(career_goal, repos=None, skills=None, user_email=None):
    """
    Perform career analysis using OpenAI
    """
    if not openai_client:
        raise ValueError("OpenAI not configured")
    
    repos = repos or []
    skills = skills or []
    
    if not career_goal.strip():
        raise ValueError("career_goal is required")

    prompt = f"""
You are a concise tech career guide.
Goal: {career_goal}
Skills: {', '.join(skills[:10])}
Projects: {', '.join(repos[:10])}

Return strict JSON only in this exact shape:
{{
  "summary": "2 short sentences about the user's current position and potential",
  "top_suggestions": ["specific actionable suggestion 1","specific actionable suggestion 2","specific actionable suggestion 3"],
  "score": 75
}}
"""

    print("🤖 Sending prompt to OpenAI...")
    
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
        "status": "Server is running",
        "endpoints": ["/analyze", "/auth/verify"],
        "auth_configured": bool(DESCOPE_PROJECT_ID),
        "openai_configured": bool(openai_client)
    })

@app.route("/auth/verify", methods=["POST"])
def verify_auth():
    """Verify authentication token"""
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"valid": False, "error": "Invalid authorization header"}), 401
            
        token = auth_header.split(' ')[1]
        user_data = verify_descope_token(token)
        
        if user_data:
            return jsonify({
                "valid": True,
                "user": {
                    "id": user_data.get('sub'),
                    "email": user_data.get('email'),
                    "name": user_data.get('name')
                }
            })
        else:
            return jsonify({"valid": False, "error": "Invalid token"}), 401
            
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 500

@app.route("/analyze", methods=["POST"])
@auth_required
def analyze_endpoint():
    """
    AI analysis endpoint
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

        # Perform analysis
        result = analyze_career(career_goal, repos, skills, user_email)
        
        print("✅ Successfully analyzed career")
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
        "available_endpoints": ["/", "/analyze", "/auth/verify"]
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "error": "Method not allowed",
        "hint": "Use POST for /analyze and /auth/verify"
    }), 405

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        "error": "Unauthorized",
        "hint": "Include valid Bearer token in Authorization header"
    }), 401

# --- Run server ---
if __name__ == "__main__":
    print("🚀 Starting Flask server...")
    print("📍 Available endpoints:")
    print("   GET  / - Health check")
    print("   POST /analyze - AI analysis (requires auth)")
    print("   POST /auth/verify - Verify authentication token")
    
    if not DESCOPE_PROJECT_ID:
        print("⚠️  Warning: DESCOPE_PROJECT_ID environment variable not set")
    else:
        print(f"🔐 Descope authentication configured for project: {DESCOPE_PROJECT_ID}")
    
    # Get port from environment variable (for Render deployment)
    port = int(os.environ.get("PORT", 5000))
    
    # In production, don't use debug mode
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(host="0.0.0.0", port=port, debug=debug_mode)