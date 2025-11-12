window.addEventListener("DOMContentLoaded", async () => {
  const year = 2025;
  const weekSelect = document.getElementById("week");
  const form = document.getElementById("game-search-form");
  const confSelect = document.getElementById("conference");

  // 🔹 Populate conferences
  const conferences = ["SEC", "Big Ten", "ACC", "Big 12", "Pac-12",
                       "American", "MWC", "MAC", "CUSA", "Sun Belt", "Independents"];
  conferences.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    confSelect.appendChild(opt);
  });

  // 🔹 Populate week dropdown 1–15
  for (let i = 1; i <= 15; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    weekSelect.appendChild(opt);
  }

  const currentWeek = 1;
  weekSelect.value = currentWeek;

  await loadGames(year, currentWeek);

  form.addEventListener("submit", async e => {
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

    if (!games || games.length === 0) {
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
