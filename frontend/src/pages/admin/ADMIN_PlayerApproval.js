import MainLayout from "../../components/MainLayout";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Inbox, ShieldCheck, X } from "lucide-react";
import { Meander } from "../../components/SpartanDecor";
import '../../styles/ArenaPages.css';
import { API_URL } from "../../config";

const Approval = () => {

  useEffect(() => {document.title = "SPARTA | Player Approvals";},[]);

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 10;

  const user = JSON.parse(localStorage.getItem("auth"));
  // A primitive dependency: the parsed user object is new on every render and would refetch forever
  const institution = user?.institution;
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "" });
  const [declineConfirm, setDeclineConfirm] = useState({ show: false, playerId: null });

  // Fetch pending players
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/players/pending?institution=${encodeURIComponent(institution)}`);
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
      } finally {
        setLoading(false);
      }
    };
    if (institution) {
      fetchPlayers();
    } else {
      setLoading(false);
    }
  }, [institution]);

  // Toast handler
  const showToastMessage = (message, type) => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Approve player
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/players/approve/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        showToastMessage("Approved Player", "success");
        setPlayers(players.filter((p) => p._id !== id));
      } else {
        showToastMessage("Failed to approve player", "error");
      }
    } catch (err) {
      console.error("Error approving player:", err);
      showToastMessage("Something went wrong", "error");
    }
  };

  // Open decline confirmation modal
  const openDeclineConfirm = (id) => {
    setDeclineConfirm({ show: true, playerId: id });
  };

  const closeDeclineConfirm = () => {
    setDeclineConfirm({ show: false, playerId: null });
  };

  // Confirm decline
  const confirmDecline = async () => {
    const id = declineConfirm.playerId;
    closeDeclineConfirm();

    try {
      const res = await fetch(`${API_URL}/api/players/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToastMessage("Declined Player", "error");
        setPlayers(players.filter((p) => p._id !== id));
      } else {
        showToastMessage("Failed to delete player", "error");
      }
    } catch (err) {
      console.error("Error declining player:", err);
      showToastMessage("Something went wrong", "error");
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(players.length / playersPerPage);
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const paginatedPlayers = players.slice(indexOfFirstPlayer, indexOfLastPlayer);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <MainLayout dark>
      <section className="arena-page approvals-page">
        <header className="arena-hero">
          <div className="arena-hero-copy">
            <span className="arena-eyebrow">Institution gate</span>
            <h2>Player Approvals</h2>
            <p>Review registrations before players enter official team rosters.</p>
          </div>
          <div className="arena-hero-stat" aria-label={`${players.length} pending approvals`}>
            <strong>{players.length}</strong>
            <span>Awaiting review</span>
          </div>
          <Meander className="arena-hero-key" height={10} />
        </header>

        {loading ? (
          <div className="arena-panel arena-card-skeleton" aria-label="Loading approval queue">
            <div className="arena-skeleton-block" />
            <div className="arena-skeleton-line wide" />
            <div className="arena-skeleton-line" />
          </div>
        ) : players.length === 0 ? (
          <div className="arena-empty-state">
            <span className="arena-empty-icon"><Inbox size={30} /></span>
            <h3>The gate is clear</h3>
            <p>No pending player registrations for your institution.</p>
          </div>
        ) : (
          <div className="arena-panel arena-approval-panel">
            <div className="arena-panel-head">
              <div>
                <span className="arena-eyebrow">Review queue</span>
                <h3>Pending registrations</h3>
              </div>
              <span className="arena-queue-badge"><ShieldCheck size={15} /> {players.length} pending</span>
            </div>

            <div className="arena-table-wrap">
              <table className="arena-approval-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Requested event</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlayers.map((player) => (
                    <tr key={player._id}>
                      <td data-label="Player">
                        <span className="arena-player">
                          <span className="arena-player-avatar">{player.email?.charAt(0).toUpperCase() || "P"}</span>
                          <span><strong>{player.email}</strong><small>Pending registration</small></span>
                        </span>
                      </td>
                      <td data-label="Requested event"><span className="arena-event-tag">{player.eventName || "Unassigned"}</span></td>
                      <td data-label="Decision">
                        <span className="arena-row-actions">
                          <button className="arena-approve-btn" onClick={() => handleApprove(player._id)}><Check size={16} /> Approve</button>
                          <button className="arena-decline-btn" onClick={() => openDeclineConfirm(player._id)}><X size={16} /> Decline</button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="arena-pagination" aria-label="Approval pages">
                <button onClick={handlePrevPage} disabled={currentPage === 1} aria-label="Previous page"><ChevronLeft size={17} /></button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => handlePageClick(i + 1)} className={currentPage === i + 1 ? "active" : ""} aria-current={currentPage === i + 1 ? "page" : undefined}>{i + 1}</button>
                ))}
                <button onClick={handleNextPage} disabled={currentPage === totalPages} aria-label="Next page"><ChevronRight size={17} /></button>
              </nav>
            )}
          </div>
        )}
      </section>

      {/*Decline Confirmation Modal */}
      {declineConfirm.show && (
        <div className="arena-modal-overlay">
          <div className="arena-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="decline-title">
            <span className="arena-confirm-icon danger"><X size={24} /></span>
            <h3 id="decline-title">Decline this player?</h3>
            <p>The registration will be removed from the approval queue.</p>
            <div className="arena-confirm-actions">
              <button onClick={closeDeclineConfirm} className="arena-secondary-btn">Keep pending</button>
              <button onClick={confirmDecline} className="arena-danger-btn">Decline player</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast.show && (
        <div
          className={`arena-toast ${showToast.type === "success" ? "success" : "error"}`}
          role="status"
          aria-live="polite"
        >
          {showToast.message}
        </div>
      )}
    </MainLayout>
  );
};

export default Approval;
