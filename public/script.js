document.addEventListener("DOMContentLoaded", async () => {
  await loadAllTeams();
  const year = 2025;
  const weekSelect = document.getElementById("week");
  const confSelect = document.getElementById("conference");


  const conferences = ["SEC", "Big Ten", "ACC", "Big 12", "Pac-12",
                       "American", "MWC", "MAC", "CUSA", "Sun Belt", "Independents"];
  conferences.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    confSelect.appendChild(opt);
  });

  for (let i = 2; i <= 15; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    weekSelect.appendChild(opt);
  }


  const urlState = getURLParams();
  const saved = loadFormState();

  document.getElementById("team").value =
    urlState.team || saved?.team || "";

  document.getElementById("conference").value =
    urlState.conference || saved?.conference || "";

  document.getElementById("week").value =
    urlState.week || saved?.week || 1;



  const currentWeek = weekSelect.value || 1;
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