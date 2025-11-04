window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/api/test");
  const teams = await res.json();

  const container = document.getElementById("games-container");
  container.innerHTML = teams.map(team => `
    <div class="game-card">
      <h3>${team.school}</h3>
      <p>${team.conference}</p>
    </div>
  `).join("");

  document.getElementById("results-section").classList.remove("hidden");
});
