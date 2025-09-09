// app.js

const sdk = Descope({
  projectId: "P31lWtDeYzgqh6jCiC3fZB61zVdF"
});

let fetchedRepos = [];

const app = {
  init() {
    sdk.onSessionTokenChange((sessionToken) => {
      if (sessionToken) {
        this.handleLogin();
      } else {
        this.handleLogout();
      }
    });
  },

  handleLogin() {
    sdk.me().then((user) => {
      document.getElementById("user-email").innerText = user.data.user.email;
    });

    document.getElementById("logged-in-section").classList.remove("hidden");
    document.getElementById("logged-out-section").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    document.getElementById("welcome-message").classList.add("hidden");
  },

  handleLogout() {
    document.getElementById("user-email").innerText = "";
    document.getElementById("logged-in-section").classList.add("hidden");
    document.getElementById("logged-out-section").classList.remove("hidden");
    document.getElementById("main-content").classList.add("hidden");
    document.getElementById("welcome-message").classList.remove("hidden");
  },

  logout() {
    sdk.logout().then(() => {
      this.handleLogout();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  app.init();

  // Handle form submission
  const form = document.getElementById("analysis-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const goal = document.getElementById("career-goal").value.trim();
      const github = document.getElementById("github-username").value.trim();
      const skills = document.getElementById("skills").value.trim();

      const analysisData = {
        careerGoal: goal,
        githubUsername: github,
        skills: skills ? skills.split(",").map(s => s.trim()) : [],
        repositories: fetchedRepos
      };

      const results = document.getElementById("results");
      const resultsContent = document.getElementById("results-content");
      results.classList.remove("hidden");
      resultsContent.innerHTML = "<p>⏳ Analyzing your skills...</p>";

      setTimeout(() => {
        // === Repo Insights ===
        let repoSummary = "";
        if (analysisData.repositories.length > 0) {
          // Top languages
          const langCount = {};
          analysisData.repositories.forEach(r => {
            if (r.language) {
              langCount[r.language] = (langCount[r.language] || 0) + 1;
            }
          });
          const topLangs = Object.entries(langCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([lang, count]) => `${lang} (${count})`)
            .join(", ") || "No languages detected";

          // Most starred repo
          const topStarred = analysisData.repositories.reduce((max, r) =>
            r.stars > max.stars ? r : max, { stars: -1 });

          // Most forked repo
          const topForked = analysisData.repositories.reduce((max, r) =>
            r.forks > max.forks ? r : max, { forks: -1 });

          repoSummary = `
            <p><strong>Repositories analyzed:</strong> ${analysisData.repositories.length}</p>
            <p><strong>Top languages:</strong> ${topLangs}</p>
            <p><strong>Most starred repo:</strong> 
              <a href="${topStarred.url}" target="_blank">${topStarred.name}</a> ⭐ ${topStarred.stars}
            </p>
            <p><strong>Most forked repo:</strong> 
              <a href="${topForked.url}" target="_blank">${topForked.name}</a> 🍴 ${topForked.forks}
            </p>
          `;
        } else {
          repoSummary = "<p>No repositories found to analyze.</p>";
        }

        // === Skills & Career Insights ===
        const skillList = analysisData.skills.length > 0
          ? analysisData.skills.join(", ")
          : "None provided";

        resultsContent.innerHTML = `
          <h4>Career Goal:</h4>
          <p>${analysisData.careerGoal || "Not specified"}</p>
          
          <h4>Your Skills:</h4>
          <p>${skillList}</p>

          <h4>GitHub Insights:</h4>
          ${repoSummary}

          <h4>AI Suggestions:</h4>
          <p>Since your career goal is <strong>${analysisData.careerGoal || "unspecified"}</strong>,
             focus on building more projects in your top language(s) and 
             try to increase collaboration (forks) and visibility (stars) for better alignment with your goal.</p>
        `;
      }, 1500);
    });
  }

  // GitHub fetch button
  const fetchBtn = document.getElementById("fetch-repos-btn");
  if (fetchBtn) {
    fetchBtn.addEventListener("click", async () => {
      const username = document.getElementById("github-username").value.trim();
      const status = document.getElementById("github-status");

      if (!username) {
        status.innerHTML = "<p style='color:red;'>⚠ Please enter a GitHub username.</p>";
        return;
      }

      status.innerHTML = "<p>⏳ Fetching repositories...</p>";
      fetchedRepos = [];

      try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!response.ok) throw new Error("GitHub user not found");

        const repos = await response.json();
        if (repos.length === 0) {
          status.innerHTML = "<p>No public repositories found.</p>";
          return;
        }

        fetchedRepos = repos.map(repo => ({
          name: repo.name,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count
        }));

        const repoList = fetchedRepos
          .map(r => `<li><a href="${r.url}" target="_blank">${r.name}</a> (${r.language || "Unknown"})</li>`)
          .join("");

        status.innerHTML = `
          <p>✅ Found ${fetchedRepos.length} repositories:</p>
          <ul>${repoList}</ul>
        `;
      } catch (error) {
        status.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
      }
    });
  }
});
  







