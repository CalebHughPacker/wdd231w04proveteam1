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
  // Restore form state (URL > LocalStorage > Defaults)
  const urlState = getURLParams();
  const saved = loadFormState();

  document.getElementById("team").value =
    urlState.team || saved?.team || "";

  document.getElementById("conference").value =
    urlState.conference || saved?.conference || "";

  document.getElementById("week").value =
    urlState.week || saved?.week || 1;


  // Auto load games once dropdowns are ready
  const currentWeek = weekSelect.value || 1;
  await loadGames(
    year,
    document.getElementById("week").value,
    document.getElementById("team").value.trim(),
    document.getElementById("conference").value
  );

  // Listen for user submit
  document.getElementById("game-search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    saveFormState();
    updateURL();
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

function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    team: params.get("team") || "",
    conference: params.get("conference") || "",
    week: params.get("week") || ""
  };
}

function updateURL() {
  const params = new URLSearchParams();
  const team = document.getElementById("team").value.trim();
  const conference = document.getElementById("conference").value;
  const week = document.getElementById("week").value;

  if (team) params.set("team", team);
  if (conference) params.set("conference", conference);
  if (week) params.set("week", week);

  const newURL = `${window.location.pathname}?${params.toString()}`;
  history.replaceState({}, "", newURL);
}
