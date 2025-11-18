export async function handler(event) {
  const { year = 2025, week, team, conference } = event.queryStringParameters || {};

  console.log("CFBD_API_KEY exists?", !!process.env.CFBD_API_KEY);
  console.log("Node version:", process.version);

  const params = new URLSearchParams({ year, division: "fbs", seasonType: "regular" });
  if (week) params.append("week", week);
  if (team) params.append("team", team);

  try {
    const res = await fetch(`https://api.collegefootballdata.com/games?${params.toString()}`, {
      headers: { Authorization: `Bearer ${process.env.CFBD_API_KEY}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // 🔹 Standard conference mapping
    const confMap = {
      "SEC": "SEC",
      "Big Ten": "Big Ten",
      "ACC": "ACC",
      "Big 12": "Big 12",
      "B12": "Big 12",
      "Pac-12": "Pac-12",
      "PAC": "Pac-12",
      "American": "American",
      "MWC": "MWC",
      "MAC": "MAC",
      "CUSA": "CUSA",
      "Sun Belt": "Sun Belt",
      "Independents": "Independents"
    };

    const simplified = data.map(g => {
      const homeConfRaw = g.homeConference ?? g.home_conference;
      const awayConfRaw = g.awayConference ?? g.away_conference;

      const home_conf = confMap[homeConfRaw] ?? homeConfRaw ?? "Unknown";
      const away_conf = confMap[awayConfRaw] ?? awayConfRaw ?? "Unknown";

      return {
        id: g.id,
        home_team: g.homeTeam ?? g.home_team,
        away_team: g.awayTeam ?? g.away_team,
        home_points: g.homePoints ?? g.home_points,
        away_points: g.awayPoints ?? g.away_points,
        start_date: g.startDate ?? g.start_date,
        venue: g.venue ?? null,
        home_conference: home_conf,
        away_conference: away_conf
      };
    });

    // 🔹 Optional backend conference filtering
    const filtered = conference
      ? simplified.filter(g => g.home_conference === conference || g.away_conference === conference)
      : simplified;

    return { statusCode: 200, body: JSON.stringify(filtered) };
  } catch (err) {
    console.error("getGames error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch games" }) };
  }
}
