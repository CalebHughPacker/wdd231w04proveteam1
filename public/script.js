window.addEventListener("DOMContentLoaded", async () => {
  //
  // ----- INITIAL TEST FETCH -----
  //
  const res = await fetch("/api/games");
  const teams = await res.json();

  const container = document.getElementById("games-container");
  console.log(teams);
  container.innerHTML = teams.map(team => `
    <div class="game-card">
      <h3>${team.awayTeam}</h3>
      <h3>${team.homeTeam}</h3>
    </div>
  `).join("");

  document.getElementById("results-section").classList.remove("hidden");


  //
  // ----- SEARCH BUTTON FUNCTIONALITY -----
  //
  const form = document.getElementById("game-search-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const team = document.getElementById("team").value.trim();
    const conference = document.getElementById("conference").value.trim();
    const week = document.getElementById("week").value.trim();

    // Build query string
    const qs = new URLSearchParams({
      team,
      conference,
      week
    });

    // ✅ Request your backend with query params
    const res = await fetch(`/api/games?${qs.toString()}`);
    const data = await res.json();

    // Display results
    container.innerHTML = data.map(game => `
      <div class="game-card">
        <h3>${game.home_team} vs ${game.away_team}</h3>
        <p>${game.conference}</p>
      </div>
    `).join("");

    document.getElementById("results-section").classList.remove("hidden");
  });

});
