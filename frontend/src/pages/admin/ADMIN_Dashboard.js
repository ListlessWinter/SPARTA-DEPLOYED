import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from 'react-calendar';
import axios from 'axios';
import {
  CalendarCheck, Trophy, Shield, Users, Plus, ArrowRight, MapPin, Clock, X, CalendarX2, Flame, Crown, Swords,
} from "lucide-react";
import { Meander, CountUp, Emblem, Ring, Embers } from "../../components/SpartanDecor";
import { MdSportsBasketball, MdSportsVolleyball, MdSportsSoccer, MdSportsTennis } from "react-icons/md";
import { GiChessKnight, GiShuttlecock, GiPingPongBat } from "react-icons/gi";
import "../../styles/Dashboard.css";
import { API_URL } from "../../config";

const SPORT_ICONS = {
  basketball: MdSportsBasketball,
  volleyball: MdSportsVolleyball,
  football: MdSportsSoccer,
  soccer: MdSportsSoccer,
  tennis: MdSportsTennis,
  "table tennis": GiPingPongBat,
  badminton: GiShuttlecock,
  chess: GiChessKnight,
};

const SportIcon = ({ type, size = 18 }) => {
  const Icon = SPORT_ICONS[(type || "").toLowerCase()] || Trophy;
  return <Icon size={size} />;
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const sameDay = (a, b) => a.toDateString() === b.toDateString();

const Dashboard = () => {

  useEffect(() => { document.title = "SPARTA | Dashboard"; }, []);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('auth'));

  // Calendar & Events State
  const [date, setDate] = useState(new Date());
  const [matchEvents, setMatchEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [multiDayEvents, setMultiDayEvents] = useState([]);

  // Event summary state
  const [eventsSummary, setEventsSummary] = useState([]);

  // List Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [listModalTitle, setListModalTitle] = useState("");
  const [listModalItems, setListModalItems] = useState([]);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.institution) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Active Events
        const eventsUrl = `${API_URL}/api/active-events?institution=${encodeURIComponent(user.institution)}&email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(user.role)}`;

        // Games data (schedule) based on user role
        let gamesUrl = `${API_URL}/api/games?institution=${encodeURIComponent(user.institution)}`;
        if (user?.role === "co-organizer" || user?.role === "sub-organizer") {
          gamesUrl += `&eventName=${encodeURIComponent(user.eventName)}`;
        }

        // Player Counts
        const countsUrl = `${API_URL}/api/teams/player-counts?institution=${encodeURIComponent(user.institution)}&approved=true`;

        // Teams per event
        const teamsUrl = `${API_URL}/api/teams?institution=${encodeURIComponent(user.institution)}`;

        // Fetch all
        const [eventsRes, gamesRes, countsRes, teamsRes] = await Promise.all([
          axios.get(eventsUrl),
          axios.get(gamesUrl),
          fetch(countsUrl).then(res => res.json()),
          axios.get(teamsUrl)
        ]);

        const activeEvents = eventsRes.data;
        const activeNames = new Set(activeEvents.map(e => e.eventName));
        const gamesData = gamesRes.data.filter(g => activeNames.has(g.eventName));
        const playerCountsData = countsRes;
        const allTeamsData = teamsRes.data;

        // Games schedule
        const matches = [];
        const multiDay = [];
        const gameStatsMap = {};

        gamesData.forEach(game => {
          const evtName = game.eventName;
          gameStatsMap[evtName] = (gameStatsMap[evtName] || 0) + 1;

          if (game.matches && Array.isArray(game.matches)) {

            // Multi-day logic
            const dated = game.matches.filter(match => match.date);
            const uniqueDates = [...new Set(dated.map(match => new Date(match.date).toDateString()))];
            if (uniqueDates.length > 1) {
              multiDay.push({
                gameId: game._id || game.gameType,
                startDate: new Date(Math.min(...dated.map(m => new Date(m.date)))),
                endDate: new Date(Math.max(...dated.map(m => new Date(m.date)))),
                title: `${game.gameType} (${game.category})`
              });
            }

            // Single match logic
            dated.forEach(match => {
              matches.push({
                date: new Date(match.date),
                title: `${game.category} ${game.gameType}`,
                gameType: game.gameType,
                location: match.location,
                time: new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                teamList: match.teams.map(t => ({ name: t.name, score: t.score })),
                final: !!match.finalizeWinner,
                winner: match.winner,
                gameId: game._id,
                eventName: evtName
              });
            });
          }
        });

        // Player counting
        const playerCountsMap = {};
        if (Array.isArray(playerCountsData)) {
          playerCountsData.forEach((c) => (playerCountsMap[c.eventName] = c));
        } else if (playerCountsData && playerCountsData.eventName) {
          playerCountsMap[playerCountsData.eventName] = playerCountsData;
        }

        // Per event data
        const summaryData = activeEvents.map(event => {
          const eventName = event.eventName;
          const today = new Date();
          const start = new Date(event.eventStartDate);
          const end = new Date(event.eventEndDate);
          today.setHours(0, 0, 0, 0); start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
          const progress = Math.min(1, Math.max(0, (today - start) / (end - start)));

          return {
            title: eventName,
            color: event.eventColor,
            location: event.location,
            start,
            end,
            progress,
            gamesCount: gameStatsMap[eventName] || 0,
            registeredPlayersCount: (playerCountsMap[eventName] || { totalPlayers: 0 }).totalPlayers,
            teamsCount: allTeamsData.filter(t => t.eventName === eventName).length,
            isOngoing: today >= start && today <= end
          };
        });

        setEventsSummary(summaryData);
        setMatchEvents(matches);
        setMultiDayEvents(multiDay);

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.institution, user?.eventName, user?.role, user?.email]);

  const handleDateClick = (day) => {
    setSelectedDate(day);
    if (matchEvents.some(event => sameDay(event.date, day))) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const count = matchEvents.filter(event => sameDay(event.date, date)).length;
    if (!count) return null;
    return (
      <span className="db-cal-dots">
        {[...Array(Math.min(count, 3))].map((_, i) => <i key={i} />)}
      </span>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const classes = [];
    if (matchEvents.some(event => sameDay(event.date, date))) classes.push('db-has-match');
    if (multiDayEvents.some(r => date >= r.startDate && date <= r.endDate)) classes.push('db-in-range');
    return classes;
  };

  const formatEventDate = (eventDate) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (sameDay(eventDate, today)) return "Today";
    if (sameDay(eventDate, tomorrow)) return "Tomorrow";
    return eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todaysMatches = matchEvents
    .filter(event => event.date >= startOfToday && event.date <= endOfToday)
    .sort((a, b) => a.date - b.date);

  const upcomingMatches = matchEvents
    .filter(event => event.date > endOfToday)
    .sort((a, b) => a.date - b.date);

  const selectedDateMatches = selectedDate ? matchEvents.filter(event => sameDay(event.date, selectedDate)) : [];

  const openListModal = (type) => {
    setListModalTitle(type === "ongoing" ? "Today's matches" : "Upcoming matches");
    setListModalItems(type === "ongoing" ? todaysMatches : upcomingMatches);
    setShowListModal(true);
  };

  const closeListModal = () => {
    setShowListModal(false);
    setListModalItems([]);
    setListModalTitle("");
  };

  const totals = eventsSummary.reduce((t, s) => ({
    games: t.games + s.gamesCount,
    teams: t.teams + s.teamsCount,
    players: t.players + s.registeredPlayersCount,
  }), { games: 0, teams: 0, players: 0 });

  const stats = [
    { label: "Active events", value: eventsSummary.length, icon: CalendarCheck, tone: "gold" },
    { label: "Games", value: totals.games, icon: Trophy, tone: "blue" },
    { label: "Teams", value: totals.teams, icon: Shield, tone: "green" },
    { label: "Players", value: totals.players, icon: Users, tone: "violet" },
  ];

  const openGame = (m) => navigate(`/admin/event/${encodeURIComponent(m.eventName)}/game/${m.gameId}`);

  const now = new Date();

  const MatchCard = ({ m, showDate }) => {
    const live = !m.final && sameDay(m.date, now) && m.date <= now;
    return (
      <li>
        <button type="button" className={`db-match ${live ? "is-live" : ""}`} onClick={() => openGame(m)}>
          <span className="db-match-icon"><SportIcon type={m.gameType} /></span>
          <span className="db-match-body">
            <span className="db-match-title">{m.title}</span>
            <span className="db-match-teams">
              {m.teamList.map((t, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <em>vs</em>}
                  <b className={m.final && m.winner === t.name ? "win" : ""}>
                    {m.final && m.winner === t.name && <Crown size={13} />}
                    {t.name}{m.final && t.score !== null ? ` ${t.score}` : ""}
                  </b>
                </React.Fragment>
              ))}
            </span>
            <span className="db-match-meta">
              <Clock size={12} /> {showDate ? `${formatEventDate(m.date)} · ` : ""}{m.time}
              {m.location && <><MapPin size={12} /> {m.location}</>}
            </span>
          </span>
          {m.final && <span className="db-badge final">Final</span>}
          {live && <span className="db-badge live"><i className="db-live-dot" /> Live</span>}
        </button>
      </li>
    );
  };

  const decidedToday = todaysMatches.filter(m => m.final).length;

  const MatchList = ({ items, showDate, empty }) => (
    loading ? (
      <ul className="db-match-list">{[0, 1, 2].map(i => <li key={i} className="db-skeleton" />)}</ul>
    ) : items.length ? (
      <ul className="db-match-list">{items.map((m, i) => <MatchCard key={i} m={m} showDate={showDate} />)}</ul>
    ) : (
      <div className="db-empty"><CalendarX2 size={22} /> {empty}</div>
    )
  );

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <MainLayout dark>
      <div className="db">

        {/* Greeting */}
        <section className="db-hero">
          <Embers count={14} />
          <Emblem className="db-hero-emblem" />
          <div className="db-hero-text">
            <p className="db-eyebrow"><Swords size={13} /> War room · {user?.institution}</p>
            <h2>{greeting()}, <span>{user?.playerName || user?.name || "Organizer"}</span></h2>
            <p className="db-sub">
              {loading ? "Gathering your forces…" : `${todaysMatches.length} battle${todaysMatches.length === 1 ? "" : "s"} on today's schedule across ${eventsSummary.length} active event${eventsSummary.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <div className="db-hero-actions">
            {user?.role === "admin" && (
              <button type="button" className="sh-btn primary" onClick={() => navigate("/admin/event/create")}>
                <Plus size={16} /> New event
              </button>
            )}
            <button type="button" className="sh-btn ghost" onClick={() => navigate("/admin/event")}>
              View events <ArrowRight size={16} />
            </button>
          </div>
          <Meander className="db-hero-meander" height={14} />
        </section>

        {/* Main board: everything important fits on one screen */}
        <section className="db-board">
          <div className="db-card db-fill db-calendar-card">
            <div className="db-stats">
              {stats.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className={`db-stat ${tone}`}>
                  <span className="db-stat-icon"><Icon size={18} /></span>
                  <div>
                    <div className="db-stat-value">{loading ? "—" : <CountUp value={value} />}</div>
                    <div className="db-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="db-card-head">
              <h3 className="db-title">Battle calendar</h3>
              <span className="db-legend"><i /> Has matches · click a day for details</span>
            </div>
            <Calendar
              onChange={setDate}
              value={date}
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="db-calendar"
              showNeighboringMonth={false}
              onClickDay={handleDateClick}
              prev2Label={null}
              next2Label={null}
            />
          </div>

          <div className="db-col">
          <div className="db-card db-fill">
            <div className="db-card-head">
              <h3 className="db-title"><Flame size={16} className="db-flame" /> Today's battles</h3>
              <span className="db-head-right">
                {!loading && todaysMatches.length > 0 && (
                  <span className="db-decided" title="Matches decided today">
                    <Ring value={decidedToday / todaysMatches.length} size={34} stroke={3}>{decidedToday}/{todaysMatches.length}</Ring>
                  </span>
                )}
                <button type="button" className="db-link" onClick={() => openListModal("ongoing")}>View all</button>
              </span>
            </div>
            <MatchList items={todaysMatches.slice(0, 4)} empty="No matches scheduled for today." />
          </div>

            <div className="db-card db-fill">
              <div className="db-card-head">
                <h3 className="db-title">Upcoming clashes</h3>
                <button type="button" className="db-link" onClick={() => openListModal("upcoming")}>View all</button>
              </div>
              <MatchList items={upcomingMatches.slice(0, 4)} showDate empty="No upcoming matches." />
            </div>
          </div>

        <div className="db-card db-camps-card">
              <div className="db-card-head">
                <h3 className="db-title">Active campaigns</h3>
                <span className="db-muted">{eventsSummary.length} running</span>
              </div>
              {loading ? (
                <div className="db-camps">{[0, 1].map(i => <div key={i} className="db-skeleton" />)}</div>
              ) : eventsSummary.length === 0 ? (
                <div className="db-empty"><CalendarX2 size={22} /> No active events found.</div>
              ) : (
                <div className="db-camps">
                  {eventsSummary.map(s => (
                    <button
                      type="button"
                      key={s.title}
                      className="db-camp"
                      style={{ "--event-color": s.color || "#ce892c" }}
                      onClick={() => navigate(`/admin/event/${encodeURIComponent(s.title)}`)}
                    >
                      <span className="db-camp-top">
                        <span className="db-camp-name">{s.title}</span>
                        <span className={`db-badge ${s.isOngoing ? "live" : "soon"}`}>{s.isOngoing ? "Ongoing" : "Upcoming"}</span>
                      </span>
                      <span className="db-camp-meta">
                        <CalendarCheck size={12} /> {fmt(s.start)} – {fmt(s.end)}
                        {s.location && <><MapPin size={12} /> {s.location}</>}
                      </span>
                      <span className="db-progress" aria-label={`${Math.round(s.progress * 100)}% complete`}>
                        <span style={{ width: `${Math.max(4, Math.round(s.progress * 100))}%` }} />
                      </span>
                      <span className="db-camp-foot">
                        <span className="db-progress-label">
                          {s.isOngoing
                            ? `Day ${Math.floor((new Date() - s.start) / 86400000) + 1} of ${Math.round((s.end - s.start) / 86400000)}`
                            : `Starts in ${Math.ceil((s.start - new Date()) / 86400000)} days`}
                        </span>
                        <span className="db-camp-metrics">
                          <span title="Games"><Trophy size={12} /> {s.gamesCount}</span>
                          <span title="Teams"><Shield size={12} /> {s.teamsCount}</span>
                          <span title="Players"><Users size={12} /> {s.registeredPlayersCount}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
        </div>
        </section>

        {/* Day Modal */}
        {isModalOpen && (
          <div className="sh-modal-overlay" onClick={closeModal}>
            <div className="sh-modal db-modal" onClick={(e) => e.stopPropagation()}>
              <div className="db-modal-head">
                <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                <button type="button" className="db-icon-btn" onClick={closeModal} aria-label="Close"><X size={18} /></button>
              </div>
              <ul className="db-match-list scroll">
                {selectedDateMatches.map((m, i) => <MatchCard key={i} m={m} />)}
              </ul>
            </div>
          </div>
        )}

        {/* List Modal for Today/Upcoming */}
        {showListModal && (
          <div className="sh-modal-overlay" onClick={closeListModal}>
            <div className="sh-modal db-modal" onClick={(e) => e.stopPropagation()}>
              <div className="db-modal-head">
                <h3>{listModalTitle}</h3>
                <button type="button" className="db-icon-btn" onClick={closeListModal} aria-label="Close"><X size={18} /></button>
              </div>
              {listModalItems.length ? (
                <ul className="db-match-list scroll">
                  {listModalItems.map((m, i) => <MatchCard key={i} m={m} showDate />)}
                </ul>
              ) : (
                <div className="db-empty"><CalendarX2 size={22} /> No matches.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default Dashboard;
