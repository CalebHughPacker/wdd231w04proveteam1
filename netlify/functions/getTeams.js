import fetch from "node-fetch";

export async function handler() {
  try {
    const res = await fetch("https://api.collegefootballdata.com/teams/fbs", {
      headers: {
        Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    // Return team name + conference only
    const simplified = data.map(team => ({
      school: team.school,
      conference: team.conference
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(simplified)
    };
  } catch (err) {
    console.error("getTeams error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch teams" })
    };
  }
}
