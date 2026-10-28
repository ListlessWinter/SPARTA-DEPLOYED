// Dummy data for the offline demo. Dates are relative to today so events stay "active".
import { newId, generateMatches } from "./brackets";

const DAY = 24 * 60 * 60 * 1000;
const at = (days, hour = 8) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const INSTITUTION = "Ateneo de Naga University";
export const ACTIVE_EVENT = "Intramurals 2026";
export const PAST_EVENT = "Intramurals 2025";

const TEAMS = [
  { teamName: "Blue Eagles", teamColor: "#1E3A8A", teamManager: "Carlo Reyes" },
  { teamName: "Red Warriors", teamColor: "#B91C1C", teamManager: "Bea Villanueva" },
  { teamName: "Green Archers", teamColor: "#15803D", teamManager: "Paolo Mendoza" },
  { teamName: "Golden Tigers", teamColor: "#CA8A04", teamManager: "Liza Fernandez" },
];

const FIRST = ["Miguel", "Andrea", "Joshua", "Patricia", "Rafael", "Camille", "Gabriel", "Nicole", "Daniel", "Sofia",
  "Marco", "Isabel", "Kevin", "Angela", "Luis", "Jasmine", "Adrian", "Kristine", "Enzo", "Bianca"];
const LAST = ["Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Mendoza", "Torres", "Ramos", "Aquino", "Navarro"];
const COURSES = ["BS Computer Science", "BS Information Technology", "BS Nursing", "BS Accountancy", "AB Communication"];

const stamp = (obj, days = -10) => ({ ...obj, createdAt: at(days), updatedAt: at(days) });

function makePlayer(i, overrides) {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 3) % LAST.length];
  const male = i % 2 === 0;
  return stamp({
    _id: newId(),
    email: `${first}.${last}${i}@student.adnu.edu.ph`.toLowerCase(),
    password: "",
    institution: INSTITUTION,
    eventName: ACTIVE_EVENT,
    role: "player",
    approved: true,
    playerName: `${first} ${last}`,
    team: "",
    sex: male ? "Male" : "Female",
    game: [male ? "Men Basketball" : "Women Volleyball"],
    teamApproval: true,
    uploadedRequirements: [],
    jerseyNumber: String(4 + (i % 20)),
    contactNumber: `09${String(170000000 + i * 7919).slice(0, 9)}`,
    permanentAddress: "Naga City, Camarines Sur",
    course: COURSES[i % COURSES.length],
    birthDate: `200${3 + (i % 4)}-0${1 + (i % 9)}-1${i % 9}`,
    age: 19 + (i % 4),
    weight: 55 + (i % 20),
    height: 160 + (i % 25),
    medicalHistory: "None",
    profilePic: null,
    ...overrides,
  });
}

function makeGame(db, fields, results = []) {
  const game = stamp({
    _id: newId(),
    institution: INSTITUTION,
    rules: "Standard league rules apply. Teams must be present 15 minutes before the scheduled match.",
    videoLink: "",
    coordinators: [],
    referees: [],
    ...fields,
  });
  game.matches = generateMatches(game.bracketType, game.teams);
  db.games.push(game);
  return { game, results };
}

export function buildSeed() {
  const db = {
    institutions: ["Ateneo de Naga University", "Bicol University", "University of Nueva Caceres"].map((name) => ({ _id: newId(), name })),
    admins: [],
    coordinators: [],
    events: [],
    teams: [],
    players: [],
    games: [],
    feedback: [],
    announcements: [],
  };

  db.admins.push({
    _id: newId(), email: "admin@sparta.demo", password: "", institution: INSTITUTION,
    ok: true, role: "admin", playerName: "Demo Admin", profilePic: null,
  });

  const coord = [
    { name: "Maria Santos", email: "co@sparta.demo", role: "co-organizer" },
    { name: "Juan Dela Cruz", email: "sub@sparta.demo", role: "sub-organizer" },
  ];

  const events = [
    {
      eventName: ACTIVE_EVENT, eventStartDate: at(-5), eventEndDate: at(25), eventColor: "#d4a537",
      description: "The annual university-wide intramurals featuring basketball, volleyball, badminton and chess.",
      location: "ADNU Main Campus", requirements: ["Medical Certificate", "Parent Consent Form"], coordinators: coord,
    },
    {
      eventName: "Founders Week Sportsfest", eventStartDate: at(10), eventEndDate: at(40), eventColor: "#2f5bd8",
      description: "Friendly inter-college games to celebrate Founders Week.",
      location: "ADNU Sports Complex", requirements: ["Medical Certificate"], coordinators: [],
    },
    {
      eventName: PAST_EVENT, eventStartDate: at(-380), eventEndDate: at(-350), eventColor: "#8a8f99",
      description: "Last year's intramurals.", location: "ADNU Main Campus", requirements: ["Medical Certificate"], coordinators: [],
    },
  ];
  events.forEach((e, i) => db.events.push(stamp({
    _id: newId(), userName: "Demo Admin", email: "admin@sparta.demo", institution: INSTITUTION, ...e,
  }, -30 + i)));

  coord.forEach((c, i) => db.coordinators.push(stamp({
    _id: newId(), ...c, institution: INSTITUTION, eventName: ACTIVE_EVENT, accessKey: i === 0 ? "DEMOCO" : "DEMOSUB",
  })));

  for (const eventName of [ACTIVE_EVENT, PAST_EVENT]) {
    TEAMS.forEach((t, i) => db.teams.push(stamp({
      _id: newId(), ...t, managerEmail: `${t.teamName.split(" ")[0].toLowerCase()}@sparta.demo`,
      institution: INSTITUTION, eventName, teamIcon: null,
      coordinators: eventName === ACTIVE_EVENT ? [db.coordinators[i % 2]._id] : [],
      totalScore: 0, roundScores: [], medals: [],
    })));
  }

  // Demo player account + rosters
  db.players.push(makePlayer(0, {
    email: "player@sparta.demo", playerName: "Demo Player", team: "Blue Eagles", jerseyNumber: "23",
    game: ["Men Basketball", "Mixed Badminton"],
  }));
  for (let i = 1; i <= 16; i++) {
    db.players.push(makePlayer(i, { team: TEAMS[i % 4].teamName }));
  }
  // Waiting for institution approval
  db.players.push(makePlayer(17, { approved: false, teamApproval: false, game: [] }));
  db.players.push(makePlayer(18, { approved: false, teamApproval: false, game: [] }));
  // Waiting for team approval
  db.players.push(makePlayer(19, { team: "Blue Eagles", teamApproval: false }));
  db.players.push(makePlayer(20, { team: "Red Warriors", teamApproval: false, game: ["Mixed Badminton"] }));

  const names = TEAMS.map((t) => t.teamName);
  const pending = [
    makeGame(db, { gameType: "Basketball", category: "Men", bracketType: "Single Elimination", eventName: ACTIVE_EVENT, startDate: at(-4), endDate: at(10), teams: names, referees: ["Ramon Lopez"] },
      [[0, 78, 65], [1, 70, 72]]),
    makeGame(db, { gameType: "Volleyball", category: "Women", bracketType: "Round Robin", eventName: ACTIVE_EVENT, startDate: at(-3), endDate: at(15), teams: names },
      [[0, 3, 1], [1, 2, 3], [2, 3, 0]]),
    makeGame(db, { gameType: "Badminton", category: "Mixed", bracketType: "Double Elimination", eventName: ACTIVE_EVENT, startDate: at(-2), endDate: at(20), teams: names },
      [[0, 21, 17]]),
    makeGame(db, { gameType: "Chess", category: "Mixed", bracketType: "ADNU", eventName: ACTIVE_EVENT, startDate: at(1), endDate: at(20), teams: names }),
    makeGame(db, { gameType: "Table Tennis", category: "Women", bracketType: "Round Robin", eventName: ACTIVE_EVENT, startDate: at(-5), endDate: at(-1), teams: names },
      [[0, 3, 1], [1, 3, 2], [2, 0, 3], [3, 3, 0], [4, 1, 3], [5, 2, 3]]),
    makeGame(db, { gameType: "Football", category: "Men", bracketType: "Single Elimination", eventName: ACTIVE_EVENT, startDate: at(-5), endDate: at(-1), teams: names },
      [[0, 2, 1], [1, 0, 3], [2, 1, 2]]),
    makeGame(db, { gameType: "Basketball", category: "Men", bracketType: "Single Elimination", eventName: PAST_EVENT, startDate: at(-378), endDate: at(-355), teams: names },
      [[0, 80, 71], [1, 66, 69], [2, 74, 70]]),
    makeGame(db, { gameType: "Volleyball", category: "Women", bracketType: "Round Robin", eventName: PAST_EVENT, startDate: at(-378), endDate: at(-355), teams: names },
      [[0, 3, 0], [1, 3, 2], [2, 1, 3], [3, 3, 1], [4, 0, 3], [5, 3, 2]]),
  ];

  // Give upcoming matches a schedule
  db.games.forEach((g) => g.matches.forEach((m, i) => {
    const start = new Date(g.startDate).getTime();
    m.date = new Date(start + (i + 1) * DAY / 2).toISOString();
    m.location = i % 2 ? "Gym B" : "Main Gym";
  }));

  db.feedback.push(
    stamp({ _id: newId(), eventName: ACTIVE_EVENT, institution: INSTITUTION, userId: db.players[0]._id, playerName: "Demo Player", message: "The schedule board is really easy to follow. Great job organizers!" }, -2),
    stamp({ _id: newId(), eventName: ACTIVE_EVENT, institution: INSTITUTION, userId: db.players[3]._id, playerName: db.players[3].playerName, message: "Can we get more water stations near the Main Gym?" }, -1),
    stamp({ _id: newId(), eventName: ACTIVE_EVENT, institution: INSTITUTION, userId: db.players[6]._id, playerName: db.players[6].playerName, message: "Live scores updating in real time is awesome." }, 0),
  );

  db.announcements.push(
    stamp({ _id: newId(), institution: INSTITUTION, eventName: ACTIVE_EVENT, authorName: "Demo Admin", message: "Semi-finals for Men's Basketball start tomorrow at the Main Gym." }, -1),
    stamp({ _id: newId(), institution: INSTITUTION, authorName: "Demo Admin", message: "Welcome to SPARTA! Registration for Founders Week Sportsfest is now open." }, -3),
  );

  return { db, pending };
}
