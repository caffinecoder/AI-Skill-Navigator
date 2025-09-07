from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import json

# --- Setup ---
app = Flask(__name__)
CORS(app)

# Configure OpenAI client - Updated for new OpenAI library version
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


# --- Routes ---
@app.route("/", methods=["GET"])
def home():
    """Health check endpoint"""
    return jsonify({"status": "Server is running", "endpoints": ["/analyze"]})

@app.route("/analyze", methods=["POST"])  # Fixed: Use @app.route instead of @app.post
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
            model="gpt-4o-mini",  # change if needed
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        raw_output = response.choices[0].message.content.strip()

        # Debug: log what the model sent back
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
    return jsonify({"error": "Endpoint not found", "available_endpoints": ["/", "/analyze"]}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed", "hint": "Use POST for /analyze"}), 405


# --- Run server ---
if __name__ == "__main__":
    print("🚀 Starting Flask server...")
    print("📍 Available endpoints:")
    print("   GET  / - Health check")
    print("   POST /analyze - AI analysis")
    app.run(host="0.0.0.0", port=5000, debug=True)