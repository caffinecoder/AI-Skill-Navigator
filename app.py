from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import openai
import os
import json

# --- Setup ---
app = Flask(__name__, 
            template_folder='frontend',  # Point to your frontend folder
            static_folder='frontend')    # Serve CSS/JS from frontend folder
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

# Dummy auth decorator (replace with your real one)
def auth_required(func):
    def wrapper(*args, **kwargs):
        # Here you'd validate the token/session
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

# --- Frontend Routes ---
@app.route("/")
def home_page():
    """Serve the main frontend page"""
    return render_template('index.html')

@app.route("/login")
def login_page():
    """Serve login page if you have one"""
    return render_template('index.html')  # Or whatever your main page is

# Serve static files (CSS, JS, images) from frontend folder
@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files like CSS and JS"""
    return send_from_directory('frontend', filename)

# --- API Routes ---
@app.route("/api/health", methods=["GET"])
def api_health():
    """API health check endpoint"""
    return jsonify({"status": "Server is running", "endpoints": ["/api/analyze"]})

@app.route("/api/analyze", methods=["POST"])
@auth_required
def analyze():
    """
    AI analysis endpoint.
    Body JSON:
    {
      "career_goal": "ML Engineer",
      "github_repos": ["proj1", "proj2"],
      "linkedin_skills": ["python","pandas"]
    }
    """
    print("📥 Analyze endpoint hit")
    
    if not openai_client:
        return jsonify({"error": "OpenAI not configured"}), 500

    try:
        body = request.get_json(force=True, silent=True) or {}
        print(f"📋 Request body: {body}")
        
        career_goal = (body.get("career_goal") or "").strip()
        repos = body.get("github_repos") or []
        skills = body.get("linkedin_skills") or []

        if not career_goal:
            return jsonify({"error": "career_goal is required"}), 400

        prompt = f"""
You are a concise tech career guide.
Goal: {career_goal}
Skills: {', '.join(skills[:10])}
Projects: {', '.join(repos[:10])}

Return strict JSON only in this exact shape:
{{
  "summary": "2 short sentences",
  "top_suggestions": ["thing 1","thing 2","thing 3"],
  "score": 70
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
            print("✅ Successfully parsed JSON response")
            return jsonify(parsed_output)
        except json.JSONDecodeError as json_err:
            print(f"❌ JSON parsing error: {json_err}")
            return jsonify({
                "error": "Model did not return valid JSON",
                "raw": raw_output
            }), 500

    except Exception as e:
        print(f"❌ General error: {e}")
        return jsonify({"error": str(e)}), 500

# Add error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

# --- Run server ---
if __name__ == "__main__":
    print(" Starting Flask server...")
    print(" Available endpoints:")
    print("   GET  / - Frontend")
    print("   GET  /api/health - API Health check")
    print("   POST /api/analyze - AI analysis")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)