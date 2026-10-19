import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LiaGhostSolid } from "react-icons/lia";
import "../../styles/ADMIN_TeamPlayers.css";
import { API_URL } from "../../config";

const SpectatorTeamPlayers = () => {
  const { institution, eventName, teamName } = useParams();
  const decodedInstitution = decodeURIComponent(institution);
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);

  useEffect(() => { document.title = "SPARTA | " + decodedTeam + " Players"; }, [decodedTeam]);

  const [players, setPlayers] = useState([]);
  const [teamColor, setTeamColor] = useState("#808080");
  const [teamRank, setTeamRank] = useState(null);

  useEffect(() => {
    const query = `institution=${encodeURIComponent(decodedInstitution)}`;
    fetch(`${API_URL}/api/players?${query}&eventName=${encodeURIComponent(decodedEvent)}&team=${encodeURIComponent(decodedTeam)}`)
      .then((res) => res.json())
      .then((data) => setPlayers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching players:", err));

    fetch(`${API_URL}/api/team?${query}&event=${encodeURIComponent(decodedEvent)}&teamName=${encodeURIComponent(decodedTeam)}`)
      .then((res) => res.json())
      .then((data) => setTeamColor(data.teamColor || "#808080"))
      .catch((err) => console.error("Error fetching team details:", err));

    fetch(`${API_URL}/api/teams/scores?${query}&event=${encodeURIComponent(decodedEvent)}`)
      .then((res) => res.json())
      .then((data) => {
        const rankIndex = Array.isArray(data) ? data.findIndex((t) => t.teamName === decodedTeam) : -1;
        setTeamRank(rankIndex !== -1 ? rankIndex + 1 : null);
      })
      .catch((err) => console.error("Error fetching team rankings:", err));
  }, [decodedInstitution, decodedEvent, decodedTeam]);

  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <div className="teams-main-container">
      <div className="spectator-header">
        <div className="header-text">
          SPARTA SPECTATOR LIVE VIEWING
        </div>
      </div>

      <div className="logo-div">
        <div className="logo-container">
          <img src="/SPARTA_Logo.png" alt="SPARTA Logo" className="spectator-logo" />
        </div>
      </div>

      <div className="team-players-container">
        <div className='team-players-header'>
          <div className='team-players-team' style={{ background: teamColor }}>
            <h2>{decodedTeam}</h2>
          </div>

          <div className='team-players-total'>
            <h3 style={{ textDecoration: "underline" }}> TOTAL PLAYERS </h3>
            <h1> {players.length} </h1>
          </div>

          <div className='team-ranking-event'>
            <h3 style={{ textDecoration: "underline" }}> {decodedEvent} RANK </h3>
            <h1>{teamRank ? getOrdinal(teamRank) : "N/A"}</h1>
          </div>
        </div>

        <div className='team-players-table'>
          {players.length === 0 ? (
            <div className='no-players-found'>
              <LiaGhostSolid size={48} />
              <p>No players registered yet.</p>
            </div>
          ) : (
            <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Course</th>
                  <th>Sport</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player._id}>
                    <td>{player.playerName}</td>
                    <td>{player.course || "N/A"}</td>
                    <td>{Array.isArray(player.game) ? player.game.join(", ") : player.game || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpectatorTeamPlayers;
