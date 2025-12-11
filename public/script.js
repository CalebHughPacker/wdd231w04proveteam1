document.addEventListener("DOMContentLoaded", async () => {
  // 1. Define variables first
  const year = 2025;
  const weekSelect = document.getElementById("week");
  const confSelect = document.getElementById("conference");

  // 2. Populate Conferences
  const conferences = ["SEC", "Big Ten", "ACC", "Big 12", "Pac-12",
                       "American", "MWC", "MAC", "CUSA", "Sun Belt", "Independents"];
  
  // Clear any default HTML options to ensure a clean slate
  confSelect.innerHTML = '<option value="">All Conferences</option>';
  
  conferences.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    confSelect.appendChild(opt);
  });

  // 3. Populate Weeks (Fixing the issue)
  // Clear the hardcoded "Week 1" from HTML so we can build the list perfectly in order
  weekSelect.innerHTML = "";

  // Add "All Weeks" first
  const allWeeksOpt = document.createElement("option");
  allWeeksOpt.value = "all";
  allWeeksOpt.textContent = "All Weeks";
  weekSelect.appendChild(allWeeksOpt);

  // Add Weeks 1 through 15 loop
  for (let i = 1; i <= 15; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    weekSelect.appendChild(opt);
  }

  // 4. Load Saved State / URL Params
  const urlState = getURLParams();
  const saved = loadFormState();

  document.getElementById("team").value =
    urlState.team || saved?.team || "";

  document.getElementById("conference").value =
    urlState.conference || saved?.conference || "";

  // Set the week value (defaults to 1 if nothing saved)
  document.getElementById("week").value =
    urlState.week || saved?.week || 1;

  // 5. NOW fetch the data (Teams and Games)
  // We do this last so the UI is already built and visible
  await loadAllTeams();
  
  await loadGames(
    year,
    document.getElementById("week").value,
    document.getElementById("team").value.trim(),
    document.getElementById("conference").value
  );
});

let ALL_TEAMS = [];

async function loadAllTeams() {
  try {
    const res = await fetch("/.netlify/functions/getTeams");
    ALL_TEAMS = await res.json();
  } catch (err) {
    console.error("Failed to load team list", err);
  }
}

document.getElementById("game-search-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  saveFormState();
  updateURL();

  const teamName = document.getElementById("team").value.trim();
  const week = document.getElementById("week").value;
  const conference = document.getElementById("conference").value;

  await loadGames(2025, week, teamName, conference);


if (teamName && ALL_TEAMS.length > 0) {
  const found = ALL_TEAMS.find(
    t => t.school.toLowerCase().includes(teamName.toLowerCase())
  );

  if (found) {
    const primaryColor = found.color?.replace("#", "") || "333333";
    const altColor    = found.alt_color?.replace("#", "") || "ffffff";
    const secondaryColor = found.alternateColor?.replace("#", "") || "ffffff";


    const isLight = (hex) => {
      const c = parseInt(hex, 16);
      const r = (c >> 16) & 255;
      const g = (c >> 8) & 255;
      const b = c & 255;
      const luminance = 0.2126*r + 0.7152*g + 0.0722*b;
      return luminance > 180;
    };

    const textColor = isLight(primaryColor) ? "000000" : "ffffff";

    const root = document.documentElement;

    root.style.setProperty("--team-primary", `#${primaryColor}`);
    root.style.setProperty("--team-contrast", `#${secondaryColor}`);
  }
}
});



async function loadGames(year, week, team = "", conference = "") {
  const container = document.getElementById("games-container");
  container.innerHTML = "<p>Loading games…</p>";

  try {
    // Start with the base URL including the year
    let url = `/.netlify/functions/getGames?year=${year}`;

    // ONLY add the week parameter if it is NOT "all"
    if (week && week !== "all") {
      url += `&week=${week}`;
    }

    // Append team and conference as before
    if (team) url += `&team=${encodeURIComponent(team)}`;
    if (conference) url += `&conference=${encodeURIComponent(conference)}`;

    // Debugging: Log the URL to ensure 'week' is missing when 'all' is selected
    console.log("Fetching URL:", url);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);


    const games = await res.json();  

    if (!games.length) {
      container.innerHTML = "<p>No games found for that search.</p>";
      document.getElementById("results-section").classList.remove("hidden");
      return;
    }

    container.innerHTML = games.map(game => {

      const home = ALL_TEAMS.find(
        t => t.school.toLowerCase() === game.home_team.toLowerCase()
      );

      let bg = "#ffffff";
      let border = "#000000";
      let text = "#000000";

      if (home) {
        const primary = home.color ? `#${home.color.replace("#","")}` : "#ffffff";
        const secondary = home.alt_color ? `#${home.alt_color.replace("#","")}` : "#000000";

        bg = primary;
        border = secondary;

      
        const hex = primary.replace("#","");
        const r = parseInt(hex.substring(0,2),16);
        const g = parseInt(hex.substring(2,4),16);
        const b = parseInt(hex.substring(4,6),16);
        const luminance = 0.2126*r + 0.7152*g + 0.0722*b;

        text = luminance > 180 ? "#000" : "#fff";
      }

      const awayLong = (game.away_team.length > 15) ? "long" : "";
      const homeLong = (game.home_team.length > 15) ? "long" : "";
      return `
        <div class="game-card"
             style="background:${bg}; color:${text}; border:3px solid ${border}">
          <h3>${game.away_team} @ ${game.home_team}</h3>
          <p><strong>Date:</strong> ${
            game.start_date ? new Date(game.start_date).toLocaleDateString() : "TBD"
          }</p>

          <p><strong>Time:</strong> ${
            game.start_date ? new Date(game.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"
          }</p>
          <h1>
            <span class="team-name ${awayLong}">${game.away_team}</span>
            <span class="score">${game.away_points ?? "-"}</span>
          </h1>

          <h1>
            <span class="team-name ${homeLong}">${game.home_team}</span>
            <span class="score">${game.home_points ?? "-"}</span>
          </h1>
        </div>
      `;
    }).join("");


    document.getElementById("results-section").classList.remove("hidden");

  } catch (err) {
    console.error("loadGames error:", err);
    container.innerHTML = "<p>Failed to load games.</p>";
  }
}




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