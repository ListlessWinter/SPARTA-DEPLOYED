// Offline demo backend: answers every /api call in the browser from dummy data.
// Edits made during the demo are kept in localStorage; clear "sparta-demo-db" to reset.
import axios from "axios";
import { buildSeed } from "./seed";
import { newId, shuffleArray, generateMatches, updateMatch } from "./brackets";

const STORAGE_KEY = "sparta-demo-db-v4";

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { }
  const { db, pending } = buildSeed();
  pending.forEach(({ game, results }) =>
    results.forEach(([i, s1, s2]) => updateMatch(db, game, game.matches[i], s1, s2, true)));
  return db;
}

const db = load();

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) { }
}

save(); // keep seeded ids stable across reloads

const collectionByRole = (role) =>
  role === "admin" ? db.admins
    : role === "co-organizer" || role === "sub-organizer" ? db.coordinators
      : role === "player" ? db.players : null;

// Returns a user to log in as: the account with this email if it exists, else the demo account for the role
export function getDemoUser(role, email) {
  const list = collectionByRole(role);
  if (!list) return null;
  const ofRole = role === "co-organizer" || role === "sub-organizer" ? list.filter((u) => u.role === role) : list;
  const wanted = (email || "").trim().toLowerCase();
  return ofRole.find((u) => u.email.toLowerCase() === wanted) || ofRole[0] || null;
}

const today = () => new Date();
const isActive = (e) => new Date(e.eventEndDate) >= today();
const byId = (list, id) => list.find((x) => x._id === id);
const touch = (doc) => { doc.updatedAt = new Date().toISOString(); return doc; };
const create = (fields) => {
  const now = new Date().toISOString();
  return { _id: newId(), ...fields, createdAt: now, updatedAt: now };
};

const routes = [
  // AUTH
  ["POST", "/auth/register/:role", ({ role }, q, body) => {
    const list = collectionByRole(role);
    if (!list) return [400, { message: "Invalid role" }];
    if (list.some((u) => u.email === (body.email || "").toLowerCase())) return [409, { message: "Email already in use" }];
    list.push(create({
      email: (body.email || "").toLowerCase(), password: "", institution: body.institution, role,
      ...(role === "player" && { eventName: body.eventName, approved: false, teamApproval: false, game: [], uploadedRequirements: [] }),
      ...(role === "admin" && { ok: true }),
    }));
    save();
    return [201, { message: `${role} registered successfully` }];
  }],
  ["POST", "/auth/login/:role", ({ role }, q, body) => {
    const user = getDemoUser(role, body.email);
    if (!user) return [401, { message: "Invalid credentials" }];
    return [200, { message: `${role} logged in successfully`, user }];
  }],
  ["GET", "/institutions", () => [200, [...db.institutions].sort((a, b) => a.name.localeCompare(b.name))]],
  ["POST", "/send-request", () => [200, { message: "Request sent successfully! We will get back to you soon." }]],

  // EVENTS
  ["POST", "/event", (p, q, body) => {
    const event = create({ ...body, coordinators: (body.coordinators || []).map((c) => ({ name: c.name, email: c.email, role: c.role || "co-organizer" })) });
    db.events.push(event);
    const invites = event.coordinators.filter((c) => c.email).map((c) => {
      const accessKey = Math.random().toString(16).slice(2, 14).toUpperCase();
      db.coordinators.push(create({ ...c, accessKey, institution: event.institution, eventName: event.eventName }));
      return { email: c.email, accessKey };
    });
    save();
    return [201, { message: "Event created successfully", event, coordinators: invites }];
  }],
  ["GET", "/events", (p, q) => [200, db.events.filter((e) => e.institution === q.institution && isActive(e))]],
  ["GET", "/specific-event", (p, q) => {
    const e = db.events.find((x) => x.eventName === q.eventName);
    return e ? [200, e] : [404, { message: "Event not found" }];
  }],
  ["GET", "/event", (p, q) => {
    const e = db.events.find((x) => x.eventName === q.eventName && x.institution === q.institution);
    return e ? [200, e] : [404, { message: "Event not found" }];
  }],
  ["GET", "/active-events", (p, q) => {
    let events = db.events.filter((e) => e.institution === q.institution && isActive(e));
    if (q.role === "co-organizer" || q.role === "sub-organizer") {
      const names = db.coordinators.filter((c) => c.email === q.email).map((c) => c.eventName);
      events = events.filter((e) => names.includes(e.eventName));
    } else if (q.role === "player") {
      const player = db.players.find((x) => x.email === q.email);
      events = events.filter((e) => e.eventName === player?.eventName);
    }
    return [200, events];
  }],
  ["GET", "/past-events", (p, q) => [200, db.events.filter((e) => e.institution === q.institution && !isActive(e))]],
  ["PUT", "/event/:id", ({ id }, q, body) => {
    const event = byId(db.events, id);
    if (!event) return [404, { message: "Event not found" }];
    const { coordinators, ...data } = body;
    const list = Array.isArray(coordinators) ? coordinators.map((c) => ({ name: c.name, email: c.email, role: c.role || "co-organizer" })) : [];
    const emails = list.map((c) => c.email);
    db.coordinators = db.coordinators.filter((c) => c.eventName !== event.eventName || emails.includes(c.email));
    Object.assign(event, data, { coordinators: list });
    touch(event);
    if (!Array.isArray(coordinators)) { save(); return [200, event]; }
    const newInvites = list.filter((c) => c.email && !db.coordinators.some((x) => x.eventName === event.eventName && x.email === c.email)).map((c) => {
      const accessKey = Math.random().toString(16).slice(2, 14).toUpperCase();
      db.coordinators.push(create({ ...c, accessKey, institution: event.institution, eventName: event.eventName }));
      return { email: c.email, accessKey };
    });
    save();
    return [200, { updatedEvent: event, newInvites }];
  }],
  ["DELETE", "/event/:id", ({ id }) => {
    if (!byId(db.events, id)) return [404, { message: "Event not found" }];
    db.events = db.events.filter((e) => e._id !== id);
    save();
    return [200, { message: "Event deleted successfully" }];
  }],

  // GAMES
  ["POST", "/games", (p, q, body) => {
    const teams = JSON.parse(body.teams || "[]");
    if (db.games.some((g) => g.institution === body.institution && g.eventName === body.eventName && g.gameType === body.gameType && g.category === body.category)) {
      return [409, { message: `A ${body.category} ${body.gameType} game already exists for this event.` }];
    }
    const rules = body.rulesFile instanceof File ? URL.createObjectURL(body.rulesFile) : (body.rulesText || "").trim();
    if (!rules) return [400, { message: "Rules (file or text) are required" }];
    if (teams.length < 2) return [400, { message: "At least 2 teams are required" }];
    const shuffled = shuffleArray(teams);
    const referees = body.referees ? [].concat(body.referees) : [];
    const game = create({
      institution: body.institution, gameType: body.gameType, category: body.category,
      startDate: body.startDate, endDate: body.endDate, teams: shuffled, eventName: body.eventName,
      bracketType: body.bracketType, rules, videoLink: "", referees,
      coordinators: JSON.parse(body.coordinators || "[]"),
      matches: generateMatches(body.bracketType, shuffled),
    });
    db.games.push(game);
    save();
    return [201, game];
  }],
  ["PUT", "/games/:id/matches/:matchId/schedule", ({ id, matchId }, q, body) => {
    const game = byId(db.games, id);
    const m = game && byId(game.matches, matchId);
    if (!m) return [404, { message: "Match not found" }];
    if (body.date) m.date = new Date(body.date).toISOString();
    if (body.location !== undefined) m.location = body.location;
    if (body.referee !== undefined) m.referee = body.referee;
    if (body.teams?.length === 2) {
      m.teams = [{ name: body.teams[0], score: null }, { name: body.teams[1], score: null }];
      m.winner = null;
      m.finalizeWinner = false;
    }
    save();
    return [200, { match: m }];
  }],
  ["PUT", "/games/:id/matches/:matchId", ({ id, matchId }, q, body) => {
    const game = byId(db.games, id);
    const m = game && byId(game.matches, matchId);
    if (!m) return [404, { message: "Match not found" }];
    updateMatch(db, game, m, body.score1, body.score2, body.finalizeWinner);
    touch(game);
    save();
    return [200, game];
  }],
  ["DELETE", "/games/:id", ({ id }) => {
    db.games = db.games.filter((g) => g._id !== id);
    save();
    return [200, { message: "Game deleted successfully" }];
  }],
  ["GET", "/games", (p, q) => {
    if (!q.institution) return [400, { message: "Institution is required" }];
    return [200, db.games.filter((g) => g.institution === q.institution && (!q.eventName || g.eventName === q.eventName))];
  }],
  ["GET", "/games/:id", ({ id }) => {
    const game = byId(db.games, id);
    return game ? [200, game] : [404, { message: "Game not found" }];
  }],
  ["PUT", "/:gameId/video", ({ gameId }, q, body) => {
    const game = byId(db.games, gameId);
    if (game) game.videoLink = body.videoLink;
    save();
    return [200, game];
  }],

  // PLAYERS
  ["GET", "/players/pending", (p, q) => [200, db.players.filter((x) => !x.approved && x.institution === q.institution)]],
  ["GET", "/players/team-pending", (p, q) => [200, db.players.filter((x) =>
    x.approved && x.institution === q.institution && x.eventName === q.eventName && x.team === q.team && !x.teamApproval)]],
  ["PUT", "/players/approve/:id", ({ id }) => {
    const player = byId(db.players, id);
    if (!player) return [404, { message: "Player not found" }];
    player.approved = true;
    save();
    return [200, { message: "Player approved", player }];
  }],
  ["PUT", "/players/team-approve/:id", ({ id }) => {
    const player = byId(db.players, id);
    if (!player) return [404, { message: "Player not found" }];
    player.teamApproval = true;
    save();
    return [200, { message: "Player approved by team", player }];
  }],
  ["PUT", "/players/team-decline/:id", ({ id }) => {
    const player = byId(db.players, id);
    if (!player) return [404, { message: "Player not found" }];
    Object.assign(player, { team: "", game: [], teamApproval: false, uploadedRequirements: [] });
    save();
    return [200, { message: "Player declined by team", player }];
  }],
  ["PUT", "/players/:id/register-game", ({ id }, q, body) => {
    const player = byId(db.players, id);
    if (!player) return [404, { message: "Player not found" }];
    const ids = body.game ? [].concat(body.game) : [];
    const games = db.games.filter((g) => ids.includes(g._id));
    if (!games.length) return [400, { message: "No game selected" }];
    Object.entries(body).forEach(([key, value]) => {
      const m = key.match(/requirements\[(.+)\]/);
      if (m && value instanceof File) {
        player.uploadedRequirements = player.uploadedRequirements.filter((r) => r.name !== m[1]);
        player.uploadedRequirements.push({ name: m[1], filePath: URL.createObjectURL(value) });
      }
    });
    Object.assign(player, { playerName: body.playerName, team: body.team, sex: body.sex, teamApproval: false });
    player.game = [...new Set([...(player.game || []), ...games.map((g) => `${g.category} ${g.gameType}`)])];
    save();
    return [200, { message: "Game(s) registered and files updated", player }];
  }],
  ["GET", "/players", (p, q) => [200, db.players.filter((x) =>
    x.institution === q.institution && x.team === q.team && x.eventName === q.eventName && x.teamApproval)]],
  ["PUT", "/players/:id/profile", ({ id }, q, body) => {
    const player = byId(db.players, id);
    if (!player) return [404, { message: "Player not found" }];
    Object.assign(player, body);
    save();
    return [200, player];
  }],
  ["PUT", "/players/users/:id", ({ id }, q, body) => {
    const user = byId(db.players, id) || byId(db.admins, id);
    if (!user) return [404, { message: "User not found in Players or Admins." }];
    user.playerName = body.playerName;
    if (body.profilePic instanceof File) user.profilePic = URL.createObjectURL(body.profilePic);
    save();
    return [200, user];
  }],
  ["GET", "/players/:id", ({ id }) => {
    const player = byId(db.players, id);
    return player ? [200, player] : [404, { message: "Player not found" }];
  }],
  ["DELETE", "/players/:id", ({ id }) => {
    db.players = db.players.filter((x) => x._id !== id);
    save();
    return [200, { message: "Player deleted" }];
  }],

  // TEAMS
  ["POST", "/team", (p, q, body) => {
    if (!body.teamName || !body.institution) return [400, { message: "All fields are required." }];
    if (db.teams.some((t) => t.teamName === body.teamName && t.institution === body.institution && t.eventName === body.eventName)) {
      return [409, { message: "Team already exists in this institution." }];
    }
    const coords = JSON.parse(body.coordinators || "[]").map((c) => (typeof c === "string" ? c : c._id));
    const team = create({
      teamName: body.teamName, teamManager: body.teamManager, managerEmail: body.managerEmail,
      institution: body.institution, teamColor: body.teamColor, eventName: body.eventName,
      teamIcon: body.teamIcon instanceof File ? URL.createObjectURL(body.teamIcon) : null,
      coordinators: coords, totalScore: 0, roundScores: [], medals: [],
    });
    db.teams.push(team);
    save();
    return [201, { message: "Team created successfully.", team }];
  }],
  ["GET", "/teams", (p, q) => {
    if (!q.institution) return [400, { message: "Institution is required" }];
    return [200, db.teams.filter((t) => t.institution === q.institution && (!q.event || t.eventName === q.event))];
  }],
  ["GET", "/team", (p, q) => {
    const team = db.teams.find((t) => t.institution === q.institution && t.eventName === q.event && t.teamName === q.teamName);
    return team ? [200, team] : [404, { message: "Team not found" }];
  }],
  ["GET", "/teams/scores", (p, q) => {
    if (!q.institution || !q.event) return [400, { message: "Institution and event are required" }];
    const points = { gold: 3, silver: 2, bronze: 1 };
    const tally = db.teams.filter((t) => t.institution === q.institution && t.eventName === q.event).map((t) => {
      const count = (medal) => t.medals.filter((m) => m.medal === medal).length;
      return {
        ...t, gold: count("gold"), silver: count("silver"), bronze: count("bronze"),
        grandTotal: t.medals.reduce((sum, m) => sum + (points[m.medal] || 0), 0),
      };
    });
    tally.sort((a, b) => b.grandTotal - a.grandTotal || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
    return [200, tally];
  }],
  ["GET", "/teams/player-counts", (p, q) => {
    if (!q.institution) return [400, { message: "Institution is required" }];
    const players = db.players.filter((x) => x.institution === q.institution && x.team &&
      (!q.event || x.eventName === q.event) && (q.approved === undefined || x.teamApproval === (q.approved === "true")));
    const grouped = {};
    players.forEach((x) => {
      const ev = (grouped[x.eventName] = grouped[x.eventName] || { eventName: x.eventName, teams: [], totalPlayers: 0 });
      const team = ev.teams.find((t) => t.teamName === x.team);
      if (team) team.count++;
      else ev.teams.push({ teamName: x.team, count: 1 });
      ev.totalPlayers++;
    });
    const results = Object.values(grouped);
    if (q.event) return [200, results.find((r) => r.eventName === q.event) || { eventName: q.event, teams: [], totalPlayers: 0 }];
    return [200, results];
  }],
  ["GET", "/coordinators", (p, q) => {
    if (!q.institution || !q.event) return [400, { message: "Institution and event are required" }];
    return [200, db.coordinators.filter((c) => c.institution === q.institution && c.eventName === q.event)];
  }],
  ["PUT", "/team/:id", ({ id }, q, body) => {
    const team = byId(db.teams, id);
    if (!team) return [404, { message: "Team not found" }];
    const updates = { ...body };
    if (body.teamIcon instanceof File) updates.teamIcon = URL.createObjectURL(body.teamIcon);
    if (typeof updates.coordinators === "string") {
      try { updates.coordinators = JSON.parse(updates.coordinators); } catch (e) { }
    }
    if (Array.isArray(updates.coordinators)) updates.coordinators = updates.coordinators.map((c) => (typeof c === "string" ? c : c._id));
    Object.assign(team, updates);
    touch(team);
    save();
    return [200, { message: "Team updated successfully", team }];
  }],
  ["DELETE", "/team/:id", ({ id }) => {
    db.teams = db.teams.filter((t) => t._id !== id);
    save();
    return [200, { message: "Team and associated icon deleted successfully" }];
  }],

  // FEEDBACK & ANNOUNCEMENTS
  ["POST", "/feedback", (p, q, body) => {
    const feedback = create({ eventName: body.eventName, institution: body.institution, userId: body.userId, playerName: body.playerName, message: body.message });
    db.feedback.push(feedback);
    save();
    return [201, { message: "Feedback posted", feedback }];
  }],
  ["GET", "/feedback/:eventName", ({ eventName }) => [200,
    db.feedback.filter((f) => f.eventName === eventName).sort((a, b) => b.createdAt.localeCompare(a.createdAt))]],
  ["POST", "/announcements", (p, q, body) => {
    const a = create({ institution: body.institution, eventName: body.eventName, authorName: body.authorName, message: body.message });
    db.announcements.push(a);
    save();
    return [201, a];
  }],
  ["GET", "/announcements", (p, q) => {
    if (!q.institution) return [400, { message: "Institution is required" }];
    return [200, db.announcements
      .filter((a) => a.institution === q.institution && (q.eventName ? a.eventName === q.eventName : !a.eventName))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))];
  }],
].map(([method, pattern, handler]) => {
  const keys = [];
  const regex = new RegExp("^" + pattern.replace(/:(\w+)/g, (m, k) => { keys.push(k); return "([^/]+)"; }) + "$");
  return { method, regex, keys, handler };
});

async function parseBody(body) {
  if (!body) return {};
  if (body instanceof FormData) {
    const out = {};
    for (const [key, value] of body.entries()) {
      if (key in out) out[key] = [].concat(out[key], value);
      else out[key] = value;
    }
    return out;
  }
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch (e) { return {}; }
  }
  return body;
}

// Returns [status, data] or null when the URL is not an API call
async function handle(method, url, rawBody) {
  const parsed = new URL(url, window.location.origin);
  const idx = parsed.pathname.indexOf("/api/");
  if (idx === -1) return null;
  const path = parsed.pathname.slice(idx + 4);
  const query = Object.fromEntries(parsed.searchParams.entries());
  const body = await parseBody(rawBody);
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.regex);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    await new Promise((res) => setTimeout(res, 120));
    try {
      return r.handler(params, query, body);
    } catch (err) {
      console.error("[demo api]", method, path, err);
      return [500, { message: "Server error" }];
    }
  }
  console.warn("[demo api] no handler for", method, path);
  return [404, { message: "Not found" }];
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;
  const method = (init.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
  const result = await handle(method, url, init.body);
  if (!result) return realFetch(input, init);
  const [status, data] = result;
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
};

axios.defaults.adapter = async (config) => {
  const url = axios.getUri(config);
  const result = await handle((config.method || "get").toUpperCase(), url, config.data);
  const [status, data] = result || [404, { message: "Not found" }];
  const response = { data: JSON.parse(JSON.stringify(data)), status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 200 && status < 300) return response;
  const error = new axios.AxiosError(`Request failed with status code ${status}`, "ERR_BAD_RESPONSE", config, {}, response);
  throw error;
};
