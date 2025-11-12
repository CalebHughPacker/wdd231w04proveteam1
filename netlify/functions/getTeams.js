export async function handler() {
  try {
    const res = await fetch("https://api.collegefootballdata.com/teams/fbs", {
      headers: { Authorization: `Bearer ${process.env.CFBD_API_KEY}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const teams = await res.json();

    return { statusCode: 200, body: JSON.stringify(teams) };
  } catch (err) {
    console.error("getTeams error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch teams" }) };
  }
}
