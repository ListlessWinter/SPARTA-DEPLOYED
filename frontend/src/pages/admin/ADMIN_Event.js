import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowUpRight, CalendarDays, MapPin, MoreVertical, Plus, Search } from "lucide-react";
import { MdEventNote } from "react-icons/md";
import { Meander } from "../../components/SpartanDecor";
import { IoIosInformationCircleOutline } from "react-icons/io";
import "../../styles/ADMIN_Event.css";
import "../../styles/ArenaPages.css";
import "../../styles/skeleton.css";
import { API_URL } from "../../config";

const Event = () => {

  useEffect(() => { document.title = "SPARTA | Event"; }, []);

  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [, setNewSubOrganizer] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const user = JSON.parse(localStorage.getItem("auth"));

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true); // show skeleton
      try {
        const response = await fetch(`${API_URL}/api/active-events?institution=${user?.institution}&email=${user.email}&role=${user.role}`);
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false); // hide skeleton
      }
    };
    fetchEvents();
  }, [user?.institution, user.email, user.role]);

  // Add Event button nav
  const handleAddEvent = () => {
    navigate("./create");
  };

  // Selected Event button nav
  const handleEventClick = (event) => {
    navigate(`/admin/event/${encodeURIComponent(event.eventName)}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (event) => {
    setDeleteTarget(event);
    setDeleteModalOpen(true);
  };

  // Perform delete
  const performDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API_URL}/api/event/${deleteTarget._id}`, { method: "DELETE" });
      setEvents(events.filter((e) => e._id !== deleteTarget._id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // Edit event
  const handleEditSave = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/event/${editEvent._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editEvent),
        }
      );
      const { updatedEvent } = await res.json();
      setEvents(events.map((e) => (e._id === updatedEvent._id ? updatedEvent : e)));
      setEditEvent(null);
      setNewSubOrganizer("");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // Filter events
  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout dark>
      <section className="arena-page events-page">
        <header className="arena-hero">
          <div className="arena-hero-copy">
            <span className="arena-eyebrow">Current season</span>
            <h2>Events</h2>
            <p>Command active tournaments, schedules, teams, and match operations.</p>
          </div>
          <div className="arena-hero-stat" aria-label={`${events.length} active events`}>
            <strong>{events.length}</strong>
            <span>Active campaigns</span>
          </div>
          <Meander className="arena-hero-key" height={10} />
        </header>

        <div className="arena-toolbar">
          <label className="arena-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search active events"
              aria-label="Search active events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <span className="arena-result-count">{filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}</span>
          {user.role === "admin" && (
            <button className="arena-primary-btn" onClick={handleAddEvent}>
              <Plus size={18} /> New event
            </button>
          )}
        </div>

        {loading ? (
          <div className="arena-event-grid" aria-label="Loading events">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="arena-event-card arena-card-skeleton">
                <div className="arena-skeleton-block" />
                <div className="arena-skeleton-line wide" />
                <div className="arena-skeleton-line" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="arena-empty-state">
            <span className="arena-empty-icon"><MdEventNote size={30} /></span>
            <h3>No active events</h3>
            <p>{user.role === "admin" ? "Create an event to open a new campaign." : "There are no ongoing events for your institution."}</p>
            {user.role === "admin" && <button className="arena-primary-btn" onClick={handleAddEvent}><Plus size={18} /> Create event</button>}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="arena-empty-state compact">
            <span className="arena-empty-icon"><Search size={27} /></span>
            <h3>No matching events</h3>
            <p>Try another event name.</p>
          </div>
        ) : (
          <div className="arena-event-grid">
            {filteredEvents.map((event) => (
              <article key={event._id} className="arena-event-card" style={{ "--event-accent": event.eventColor || "#c3982b" }}>
                <div className={`arena-event-band ${new Date(event.eventStartDate) > new Date() ? "is-upcoming" : ""}`}>
                  <span className="arena-status-dot" />
                  <span>{new Date(event.eventStartDate) > new Date() ? "Upcoming" : "In progress"}</span>
                  {user.role === "admin" && (
                    <div className="arena-card-menu">
                      <button type="button" className="arena-icon-btn" aria-label={`Manage ${event.eventName}`} onClick={() => setMenuOpen(menuOpen === event._id ? null : event._id)}>
                        <MoreVertical size={18} />
                      </button>

                      {menuOpen === event._id && (
                        <div className="arena-menu" role="menu">
                          <button type="button" role="menuitem" onClick={() => { setMenuOpen(null); setEditEvent(event); }}>Edit event</button>
                          <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(null); openDeleteModal(event); }}>Delete event</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="button" className="arena-event-open" onClick={() => handleEventClick(event)}>
                  <span className="arena-card-kicker">Tournament</span>
                  <span className="arena-event-title">{event.eventName}<ArrowUpRight size={19} /></span>
                  <span className="arena-card-meta">
                    <span><CalendarDays size={15} />{event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "TBA"} – {event?.eventEndDate ? new Date(event.eventEndDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "TBA"}</span>
                    {event.location && <span><MapPin size={15} />{event.location}</span>}
                  </span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>


      {/* Edit Modal */}
      {editEvent && (
        <div className="modal-event-overlay">
          <div className="event-modal">
            <h2>EDIT EVENT</h2>
            <form
              className="event-forms-modal"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              <label>
                Event Name:
                <input
                  type="text"
                  value={editEvent.eventName}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, eventName: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Event Duration:
                <div className="event-duration-inputs">
                  <input
                    type="date"
                    value={editEvent.eventStartDate?.substring(0, 10)}
                    onChange={(e) =>
                      setEditEvent({
                        ...editEvent,
                        eventStartDate: e.target.value,
                      })
                    }
                    required
                  />
                  <span> to </span>
                  <input
                    type="date"
                    value={editEvent.eventEndDate?.substring(0, 10)}
                    onChange={(e) =>
                      setEditEvent({
                        ...editEvent,
                        eventEndDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </label>

              <label>
                Location:
                <input
                  type="text"
                  value={editEvent.location || ""}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, location: e.target.value })
                  }
                  required
                />
              </label>

              <label className="color-picker">
                Event Color:
                <input
                  type="color"
                  value={editEvent.eventColor}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, eventColor: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Description:
                <textarea
                  value={editEvent.description || ""}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, description: e.target.value })
                  }
                  rows="4"
                  required
                />
              </label>

              {/* Co & Sub-organizers just like CreateEvent */}
              <hr />
              <div style={{ display: "flex", flexDirection: "row", gap: "5px", alignItems: "center", justifyContent: "center" }}>
                <h4>CO & SUB-ORGANIZERS</h4>
                <div className="info-icon" tabIndex={0} aria-describedby="coord-types-tooltip">
                  <IoIosInformationCircleOutline />
                  <div className="hover-modal" role="tooltip" id="coord-types-tooltip">
                    <strong>Coordinator Types</strong>
                    <ul style={{ listStyle: "none", textAlign: "left" }}>
                      <li>
                        <b>Co-Organizer</b> — can create teams and games, accepts players into institutions and teams and can access scoreboard. They can also view player data such as the player's submitted requirements.
                      </li>
                      <li>
                        <b>Sub-Organizer</b> — can manage teams and players within an event and game. However, they aren't allowed to create events and games.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <p style={{ color: "#66666e", fontSize: "10px" }}>
                *You may add multiple Co & Sub-organizers*
              </p>
              <button
                type="button"
                className="add-coordinator-btn"
                onClick={() =>
                  setEditEvent({
                    ...editEvent,
                    coordinators: [
                      ...(editEvent.coordinators || []),
                      { name: "", email: "", role: "co-organizer" },
                    ],
                  })
                }
              >
                + ADD COORDINATOR
              </button>

              <div>
                {(editEvent.coordinators || []).map((coord, idx) => (
                  <div
                    key={idx}
                    className="coordinator-row"
                  >
                    <label>
                      Role:
                      <select
                        value={coord.role}
                        onChange={(e) => {
                          const updated = [...editEvent.coordinators];
                          updated[idx].role = e.target.value;
                          setEditEvent({ ...editEvent, coordinators: updated });
                        }}
                      >
                        <option value="co-organizer">Co-Organizer</option>
                        <option value="sub-organizer">Sub-Organizer</option>
                      </select>
                    </label>

                    <label>
                      Email:
                      <input
                        type="email"
                        value={coord.email}
                        onChange={(e) => {
                          const updated = [...editEvent.coordinators];
                          updated[idx].email = e.target.value;
                          setEditEvent({ ...editEvent, coordinators: updated });
                        }}
                      />
                    </label>

                    <label>
                      Full Name:
                      <input
                        type="text"
                        value={coord.name}
                        onChange={(e) => {
                          const updated = [...editEvent.coordinators];
                          updated[idx].name = e.target.value;
                          setEditEvent({ ...editEvent, coordinators: updated });
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      style={{
                        background: "#e5cb8a",
                        color: "white",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const updated = editEvent.coordinators.filter(
                          (_, i) => i !== idx
                        );
                        setEditEvent({ ...editEvent, coordinators: updated });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="event-modal-actions">
                <button className="modal-cancel-btn" type="button" onClick={() => setEditEvent(null)}>
                  Cancel
                </button>
                <button className="modal-save-btn" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="modal-event-overlay" onClick={cancelDelete}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete the event "<strong>{deleteTarget.eventName}</strong>"? This action cannot be undone.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
              <button className="modal-cancel-btn" type="button" onClick={cancelDelete}>Cancel</button>
              <button className="modal-save-btn" type="button" onClick={performDelete} style={{ background: "#e5cb8a" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
};

export default Event;
