// Bracket generation and match updates, ported from backend/routes/games.js

export const newId = () =>
  Math.floor(Date.now() / 1000).toString(16) +
  Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const match = (fields) => ({
  _id: newId(), bracket: "WB", winner: null, finalizeWinner: false,
  date: null, location: "", notificationSent: false, ...fields,
});

const generateRRMatches = (teams, bracketName) => {
  const matches = [];
  const teamList = teams.length % 2 === 0 ? [...teams] : [...teams, "BLANK"];
  const numTeams = teamList.length;
  for (let r = 0; r < numTeams - 1; r++) {
    for (let i = 0; i < numTeams / 2; i++) {
      const t1 = teamList[i];
      const t2 = teamList[numTeams - 1 - i];
      if (t1 !== "BLANK" && t2 !== "BLANK") {
        matches.push(match({
          bracket: bracketName, round: r + 1, matchIndex: i,
          teams: [{ name: t1, score: null }, { name: t2, score: null }],
        }));
      }
    }
    teamList.splice(1, 0, teamList.pop());
  }
  return matches;
};

function singleElimination(teams) {
  const matches = [];
  const totalRounds = Math.ceil(Math.log2(teams.length));
  for (let i = 0; i < teams.length; i += 2) {
    matches.push(match({
      round: 1, matchIndex: i / 2,
      teams: [{ name: teams[i] || "TBD", score: null }, { name: teams[i + 1] || "TBD", score: null }],
    }));
  }
  for (let round = 2; round <= totalRounds; round++) {
    for (let i = 0; i < Math.pow(2, totalRounds - round); i++) {
      matches.push(match({ round, matchIndex: i, teams: [{ name: "TBD", score: null }, { name: "TBD", score: null }] }));
    }
  }
  for (let round = 1; round < totalRounds; round++) {
    const current = matches.filter((m) => m.round === round);
    const next = matches.filter((m) => m.round === round + 1);
    current.forEach((m, i) => { m.nextMatch = next[Math.floor(i / 2)]._id; });
  }
  return matches;
}

function doubleElimination(teams) {
  const bracketTeams = [...teams];
  const size = Math.pow(2, Math.ceil(Math.log2(bracketTeams.length)));
  while (bracketTeams.length < size) bracketTeams.push("No Opponent");

  const totalWBRounds = Math.log2(size);
  const allMatches = [];
  for (let r = 1; r <= totalWBRounds; r++) {
    for (let i = 0; i < size / Math.pow(2, r); i++) {
      const t = r === 1
        ? [{ name: bracketTeams[i * 2], score: null }, { name: bracketTeams[i * 2 + 1], score: null }]
        : [{ name: "TBD", score: null }, { name: "TBD", score: null }];
      allMatches.push(match({ bracket: "WB", round: r, matchIndex: i, teams: t }));
    }
  }
  const totalLBRounds = (totalWBRounds - 1) * 2;
  let matchesInRound = size / 4;
  for (let r = 1; r <= totalLBRounds; r++) {
    for (let i = 0; i < matchesInRound; i++) {
      allMatches.push(match({ bracket: "LB", round: r, matchIndex: i, teams: [{ name: "TBD", score: null }, { name: "TBD", score: null }] }));
    }
    if (r % 2 === 0) matchesInRound /= 2;
  }
  const gfMatch = match({
    bracket: "GF", round: totalWBRounds + 1, matchIndex: 0,
    teams: [{ name: "Winner WB", score: null }, { name: "Winner LB", score: null }],
  });

  // Auto-advance byes
  const resolveMatch = (m) => {
    if (m.finalizeWinner || m.teams[0].name === "TBD" || m.teams[1].name === "TBD") return;
    let winner = null;
    if (m.teams[1].name === "No Opponent") winner = m.teams[0].name;
    else if (m.teams[0].name === "No Opponent") winner = m.teams[1].name;
    if (!winner) return;
    m.winner = winner;
    m.finalizeWinner = true;
    if (m.bracket === "WB") {
      const nextWB = allMatches.find((x) => x.bracket === "WB" && x.round === m.round + 1 && x.matchIndex === Math.floor(m.matchIndex / 2));
      if (nextWB) {
        nextWB.teams[m.matchIndex % 2].name = winner;
        resolveMatch(nextWB);
      } else if (m.round + 1 > totalWBRounds) {
        gfMatch.teams[0].name = winner;
      }
      const lbRound = m.round === 1 ? 1 : (m.round - 1) * 2;
      let targetLB = allMatches.find((x) => x.bracket === "LB" && x.round === lbRound && x.matchIndex === Math.floor(m.matchIndex / 2));
      if (!targetLB) targetLB = allMatches.find((x) => x.bracket === "LB" && x.round === lbRound && x.teams.some((t) => t.name === "TBD"));
      if (targetLB) {
        const slot = targetLB.teams.findIndex((t) => t.name === "TBD" || t.name === "No Opponent");
        if (slot !== -1) {
          targetLB.teams[slot].name = "No Opponent";
          resolveMatch(targetLB);
        }
      }
    } else if (m.bracket === "LB") {
      const cur = allMatches.filter((x) => x.bracket === "LB" && x.round === m.round).length;
      const nxt = allMatches.filter((x) => x.bracket === "LB" && x.round === m.round + 1).length;
      const nextIndex = cur === nxt ? m.matchIndex : Math.floor(m.matchIndex / 2);
      const nextLB = allMatches.find((x) => x.bracket === "LB" && x.round === m.round + 1 && x.matchIndex === nextIndex);
      if (nextLB) {
        const slot = nextLB.teams.findIndex((t) => t.name === "TBD");
        if (slot !== -1) {
          nextLB.teams[slot].name = winner;
          resolveMatch(nextLB);
        }
      } else if (m.round + 1 > totalLBRounds) {
        gfMatch.teams[1].name = winner;
      }
    }
  };
  allMatches.filter((m) => m.bracket === "WB" && m.round === 1).forEach(resolveMatch);
  return [...allMatches, gfMatch];
}

function adnu(teams) {
  const mid = Math.ceil(teams.length / 2);
  const tbd = (a, b) => [{ name: a, score: null }, { name: b, score: null }];
  return [
    ...generateRRMatches(teams.slice(0, mid), "Group A"),
    ...generateRRMatches(teams.slice(mid), "Group B"),
    match({ bracket: "SF", round: 100, matchIndex: 0, teams: tbd("Group A #1", "Group B #2") }),
    match({ bracket: "SF", round: 100, matchIndex: 1, teams: tbd("Group B #1", "Group A #2") }),
    match({ bracket: "3rd Place", round: 101, matchIndex: 0, teams: tbd("Loser SF1", "Loser SF2") }),
    match({ bracket: "Championship", round: 102, matchIndex: 0, teams: tbd("Winner SF1", "Winner SF2") }),
  ];
}

export function generateMatches(bracketType, teams) {
  if (bracketType === "Single Elimination") return singleElimination(teams);
  if (bracketType === "Double Elimination") return doubleElimination(teams);
  if (bracketType === "Round Robin") return generateRRMatches(teams, "RR");
  if (bracketType === "ADNU") return adnu(teams);
  return [];
}

function awardMedal(db, teamName, game, medal) {
  if (!teamName || teamName === "TBD") return;
  const team = db.teams.find((t) => t.teamName === teamName && t.eventName === game.eventName);
  if (!team || team.medals.some((m) => m.gameId === game._id && m.medal === medal)) return;
  team.medals.push({ _id: newId(), gameId: game._id, gameName: `${game.category} ${game.gameType}`, medal });
}

export function updateMatch(db, game, m, score1, score2, finalizeWinner) {
  const oldScore1 = m.teams[0].score || 0;
  const oldScore2 = m.teams[1].score || 0;
  score1 = Number(score1);
  score2 = Number(score2);
  m.teams[0].score = score1;
  m.teams[1].score = score2;
  if (!finalizeWinner) return;

  const winnerIdx = score1 > score2 ? 0 : score2 > score1 ? 1 : null;
  if (winnerIdx === null) return;
  const winnerName = m.teams[winnerIdx].name;
  const loserName = m.teams[1 - winnerIdx].name;
  m.winner = winnerName;
  m.finalizeWinner = true;
  const find = (bracket, round, index) => game.matches.find((x) => x.bracket === bracket && x.round === round && x.matchIndex === index);

  if (game.bracketType === "Single Elimination") {
    const nextM = game.matches.find((x) => x.round === m.round + 1 && x.matchIndex === Math.floor(m.matchIndex / 2));
    if (nextM) nextM.teams[m.matchIndex % 2] = { name: winnerName, score: null };
    if (m.round === Math.ceil(Math.log2(game.teams.length))) {
      awardMedal(db, winnerName, game, "gold");
      awardMedal(db, loserName, game, "silver");
    }
  }

  if (game.bracketType === "Double Elimination") {
    if (m.bracket === "WB") {
      const maxWB = Math.max(...game.matches.filter((x) => x.bracket === "WB").map((x) => x.round));
      if (m.round === maxWB) {
        const gf = game.matches.find((x) => x.bracket === "GF");
        if (gf) gf.teams[0] = { name: winnerName, score: null };
      } else {
        const nextWB = find("WB", m.round + 1, Math.floor(m.matchIndex / 2));
        if (nextWB) nextWB.teams[m.matchIndex % 2] = { name: winnerName, score: null };
      }
      const lbRound = m.round === 1 ? 1 : (m.round - 1) * 2;
      let target = m.round === 1
        ? find("LB", 1, Math.floor(m.matchIndex / 2))
        : game.matches.filter((x) => x.bracket === "LB" && x.round === lbRound)
          .sort((a, b) => a.matchIndex - b.matchIndex)
          .find((x) => x.teams.some((t) => t.name === "TBD" || t.name === "No Opponent"));
      if (target) {
        const slot = target.teams.findIndex((t) => t.name === "TBD" || t.name === "No Opponent");
        target.teams[slot !== -1 ? slot : 0] = { name: loserName || "No Opponent", score: null };
      }
    }
    if (m.bracket === "LB") {
      const lb = game.matches.filter((x) => x.bracket === "LB");
      const maxLB = Math.max(...lb.map((x) => x.round));
      if (m.round === maxLB) {
        const gf = game.matches.find((x) => x.bracket === "GF");
        if (gf) gf.teams[1] = { name: winnerName, score: null };
      } else {
        const cur = lb.filter((x) => x.round === m.round).length;
        const nxt = lb.filter((x) => x.round === m.round + 1).length;
        const nextLB = find("LB", m.round + 1, cur === nxt ? m.matchIndex : Math.floor(m.matchIndex / 2));
        if (nextLB) {
          const slot = nextLB.teams.findIndex((t) => t.name === "TBD");
          nextLB.teams[slot !== -1 ? slot : 0] = { name: winnerName, score: null };
        }
      }
    }
    if (m.bracket === "GF") {
      awardMedal(db, winnerName, game, "gold");
      awardMedal(db, loserName, game, "silver");
      const lb = game.matches.filter((x) => x.bracket === "LB");
      const lbFinal = lb.find((x) => x.round === Math.max(...lb.map((y) => y.round)));
      if (lbFinal && lbFinal.winner) awardMedal(db, lbFinal.teams.find((t) => t.name !== lbFinal.winner)?.name, game, "bronze");
    }
  }

  if (game.bracketType === "Round Robin" && game.matches.every((x) => x.finalizeWinner)) {
    const wins = {};
    game.teams.forEach((t) => { wins[t] = 0; });
    game.matches.forEach((x) => { if (x.winner) wins[x.winner] = (wins[x.winner] || 0) + 1; });
    const sorted = Object.entries(wins).sort(([, a], [, b]) => b - a);
    ["gold", "silver", "bronze"].forEach((medal, i) => sorted[i] && awardMedal(db, sorted[i][0], game, medal));
  }

  // Team score totals
  [[m.teams[0].name, oldScore1, score1], [m.teams[1].name, oldScore2, score2]].forEach(([name, oldScore, score]) => {
    const team = db.teams.find((t) => t.teamName === name && t.eventName === game.eventName);
    if (!team) return;
    team.totalScore = (team.totalScore || 0) - oldScore + score;
    const entry = team.roundScores.find((r) => r.round === m.round);
    if (entry) entry.score = score;
    else team.roundScores.push({ round: m.round, score });
  });
}
