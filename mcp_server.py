# mcp_server.py
from mcp import Server, Tool
import asyncio
from app import analyze_career 

app = Server("ai-skill-navigator")

@app.tool("analyze_skills")
async def analyze_skills_mcp(career_goal: str, skills: list, repos: list) -> dict:
    return await analyze_career(career_goal, repos, skills)

if __name__ == "__main__":
    asyncio.run(app.serve())