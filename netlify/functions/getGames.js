import fetch from "node-fetch";

export async function handler(event) {
  const { year = 2025, week, team, conference } = event.queryStringParameters || {};

  try {
    // Build query params
    const params = new URLSearchParams({
      year,
      division: "fbs",
      seasonType: "regular",
    });
    if (week) params.append("week", week);
    if (team) params.append("team", team);

    // Fetch games from CFBD API
    const res = await fetch(`https://api.collegefootballdata.com/games?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CFBD API error: HTTP ${res.status} - ${text}`);
    }

    const data = await res.json();

    // Fetch all FBS teams to map conferences
    const teamsRes = await fetch("https://api.collegefootballdata.com/teams/fbs", {
      headers: {
        Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
        Accept: "application/json",
      },
    });
    if (!teamsRes.ok) throw new Error(`Teams API error: HTTP ${teamsRes.status}`);
    const teams = await teamsRes.json();

    // Map school name -> conference
    const confMap = {};
    teams.forEach(t => {
      if (t.school && t.conference) confMap[t.school] = t.conference;
    });

    // Simplify games + attach conferences
    const simplified = (data || [])
      .filter(g => {
        const homeClass = g.homeClassification ?? g.home_classification ?? null;
        const awayClass = g.awayClassification ?? g.away_classification ?? null;
        return (homeClass === "fbs" || awayClass === "fbs") &&
               (!!g.homeTeam || !!g.awayTeam || !!g.home_team || !!g.away_team);
      })
      .map(g => {
        const home = g.homeTeam ?? g.home_team ?? null;
        const away = g.awayTeam ?? g.away_team ?? null;
        const homeConf = confMap[home] || null;
        const awayConf = confMap[away] || null;
        return {
          id: g.id,
          home_team: home,
          away_team: away,
          home_points: g.homePoints ?? g.home_points ?? null,
          away_points: g.awayPoints ?? g.away_points ?? null,
          start_date: g.startDate ?? g.start_date ?? null,
          venue: g.venue ?? null,
          home_conference: homeConf,
          away_conference: awayConf
        };
      })
      // Optional: filter by conference server-side
      .filter(g => !conference || g.home_conference === conference || g.away_conference === conference);

    return { statusCode: 200, body: JSON.stringify(simplified) };

  } catch (err) {
    console.error("getGames error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch games" }) };
  }
}
