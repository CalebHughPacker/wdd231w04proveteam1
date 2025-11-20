// ================== INITIAL PAGE SETUP ==================
document.addEventListener("DOMContentLoaded", async () => {
  const year = 2025;
  const weekSelect = document.getElementById("week");
  const confSelect = document.getElementById("conference");

  // Populate conferences dropdown
  const conferences = ["SEC", "Big Ten", "ACC", "Big 12", "Pac-12",
                       "American", "MWC", "MAC", "CUSA", "Sun Belt", "Independents"];
  conferences.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    confSelect.appendChild(opt);
  });

  // Populate week dropdown 1–15
  for (let i = 2; i <= 15; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    weekSelect.appendChild(opt);
  }

  // Restore form state if it exists
  const saved = loadFormState();
  if (saved) {
    document.getElementById("team").value = saved.team || "";
    document.getElementById("conference").value = saved.conference || "";
    document.getElementById("week").value = saved.week || 1;
  }

  // Auto load games once dropdowns are ready
  const currentWeek = weekSelect.value || 1;
  await loadGames(year, currentWeek, saved?.team || "", saved?.conference || "");

  // Listen for user submit
  document.getElementById("game-search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    saveFormState();
    await loadGames(
      year,
      weekSelect.value,
      document.getElementById("team").value.trim(),
      confSelect.value
    );
  });

  // Save form changes on input
  document.getElementById("game-search-form").addEventListener("input", saveFormState);
});


// ================== LOAD GAMES ==================
async function loadGames(year, week, team = "", conference = "") {
  const container = document.getElementById("games-container");
  container.innerHTML = "<p>Loading games…</p>";

  try {
    let url = `/.netlify/functions/getGames?year=${year}&week=${week}`;
    if (team) url += `&team=${encodeURIComponent(team)}`;
    if (conference) url += `&conference=${encodeURIComponent(conference)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const games = await res.json();

    if (!games.length) {
      container.innerHTML = "<p>No games found for that search.</p>";
      document.getElementById("results-section").classList.remove("hidden");
      return;
    }

    container.innerHTML = games.map(game => `
      <div class="game-card">
        <h3>${game.away_team} @ ${game.home_team}</h3>
        <p><strong>Venue:</strong> ${game.venue || "Venue TBD"}</p>
        <p><strong>Date:</strong> ${game.start_date ? new Date(game.start_date).toLocaleString() : "TBD"}</p>
        <p><strong>Score:</strong> ${game.away_points ?? "-"} - ${game.home_points ?? "-"}</p>
        <p><strong>Conference:</strong> ${game.away_conference} / ${game.home_conference}</p>
      </div>
    `).join("");

    document.getElementById("results-section").classList.remove("hidden");
  } catch (err) {
    console.error("loadGames error:", err);
    container.innerHTML = "<p>Failed to load games.</p>";
  }
}


// ================== LOCAL STORAGE ==================
function saveFormState() {
  const state = {
    team: document.getElementById("team").value.trim(),
    conference: document.getElementById("conference").value,
    week: document.getElementById("week").value
  };
  localStorage.setItem("gameFormState", JSON.stringify(state));
}

function loadFormState() {
  try {
    return JSON.parse(localStorage.getItem("gameFormState"));
  } catch {
    return null;
  }
}
