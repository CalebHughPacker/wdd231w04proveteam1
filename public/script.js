window.addEventListener("DOMContentLoaded", async () => {
  const year = 2025;
  const weekSelect = document.getElementById("week");
  const confSelect = document.getElementById("conference");
  const form = document.getElementById("game-search-form");

  // Populate week dropdown 1–15
  for (let i = 1; i <= 15; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    weekSelect.appendChild(opt);
  }

  // 🔹 Populate conferences dynamically from getTeams.js
  let conferences = [];
  try {
    const res = await fetch("/.netlify/functions/getTeams");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const teams = await res.json();

    const confSet = new Set();
    teams.forEach(t => {
      if (t.conference) confSet.add(t.conference);
    });
    conferences = Array.from(confSet).sort();

    conferences.forEach(conf => {
      const opt = document.createElement("option");
      opt.value = conf;
      opt.textContent = conf;
      confSelect.appendChild(opt);
    });
  } catch (err) {
    console.warn("Could not fetch teams; using fallback conference list", err);
    conferences = [
      "SEC", "Big Ten", "ACC", "Big 12", "Pac-12",
      "American", "MWC", "MAC", "CUSA", "Sun Belt", "Independents"
    ];
    conferences.forEach(conf => {
      const opt = document.createElement("option");
      opt.value = conf;
      opt.textContent = conf;
      confSelect.appendChild(opt);
    });
  }

  // 🔹 Set default week
  let currentWeek = 1;
  weekSelect.value = currentWeek;

  // 🔹 Initial load
  await loadGames(year, currentWeek);

  // 🔹 Handle form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const selectedWeek = weekSelect.value || currentWeek;
    const team = document.getElementById("team").value.trim();
    const conference = confSelect.value;

    await loadGames(year, selectedWeek, team, conference);
  });
});

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

    if (!Array.isArray(games) || games.length === 0) {
      container.innerHTML = "<p>No games found for that search.</p>";
      document.getElementById("results-section").classList.remove("hidden");
      return;
    }

    // 🔹 Optional: filter client-side in case API conference names differ
    const filteredGames = games.filter(g =>
      !conference || g.home_conference === conference || g.away_conference === conference
    );

    container.innerHTML = filteredGames.map(game => `
      <div class="game-card">
        <h3>${game.away_team || "TBD"} @ ${game.home_team || "TBD"}</h3>
        <p><strong>Venue:</strong> ${game.venue || "Venue TBD"}</p>
        <p><strong>Date:</strong> ${game.start_date ? new Date(game.start_date).toLocaleString() : "TBD"}</p>
        <p><strong>Score:</strong> ${game.away_points ?? "-"} - ${game.home_points ?? "-"}</p>
        <p><strong>Conference:</strong> ${game.home_conference || game.away_conference || "Unknown"}</p>
      </div>
    `).join("");

    document.getElementById("results-section").classList.remove("hidden");
  } catch (err) {
    console.error("loadGames error:", err);
    container.innerHTML = "<p>Failed to load games.</p>";
  }
}
