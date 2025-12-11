// getGames.js

export async function handler(event) {
  const { year = 2025, week, team, conference } = event.queryStringParameters || {};

  const params = new URLSearchParams({ year, division: "fbs", seasonType: "regular" });
  if (week) params.append("week", week);
  if (team) params.append("team", team);

  try {
    const res = await fetch(`https://api.collegefootballdata.com/games?${params.toString()}`, {
      headers: { Authorization: `Bearer ${process.env.CFBD_API_KEY}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

  const confMap = {
    "SEC": "SEC",
    "Big Ten": "Big Ten",
    "ACC": "ACC",
    "Big 12": "Big 12",
    "Pac-12": "Pac-12",
    "American Athletic": "American",
    "Mountain West": "MWC",
    "Mid-American": "MAC",
    "Conference USA": "CUSA",
    "Sun Belt": "Sun Belt",
    "FBS Independents": "Independents"
  };


    const simplified = data.map(g => ({
      id: g.id,
      home_team: g.homeTeam ?? g.home_team,
      away_team: g.awayTeam ?? g.away_team,
      home_points: g.homePoints ?? g.home_points,
      away_points: g.awayPoints ?? g.away_points,
      start_date: g.startDate ?? g.start_date,
      home_conference: confMap[g.homeConference ?? g.home_conference] ?? "Unknown",
      away_conference: confMap[g.awayConference ?? g.away_conference] ?? "Unknown"
    }));

    const FBS_CONFERENCES = new Set([
      "SEC", "Big Ten", "ACC", "Big 12", "Pac-12",
      "American", "MWC", "MAC", "CUSA", "Sun Belt", "Independents"
    ]);

    const onlyD1 = simplified.filter(g =>
      FBS_CONFERENCES.has(g.home_conference) || FBS_CONFERENCES.has(g.away_conference)
    );

    const filtered = conference
      ? onlyD1.filter(g => g.home_conference === conference || g.away_conference === conference)
      : onlyD1;

    return { statusCode: 200, body: JSON.stringify(filtered) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch games" }) };
  }
}
