import MainLayout from "../../components/MainLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Landmark, MapPin, MoreVertical, Search, Trophy } from "lucide-react";
import { Meander } from "../../components/SpartanDecor";
import "../../styles/ADMIN_Event.css";
import "../../styles/ArenaPages.css";
import { API_URL } from "../../config";

const Pantheon = () => {

  useEffect(() => {document.title = "SPARTA | Pantheon";},[]);

  const navigate= useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [, setNewSubOrganizer] = useState(""); 
  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;
 
  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/past-events?institution=${userInstitution}`);
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch past events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [userInstitution]);


  // Event button nav
  const handleClickEvent = (event) => {
    navigate(`/admin/pantheon/${encodeURIComponent(event.eventName)}/ranking`);
  };

  // Delete event
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await fetch(`${API_URL}/api/event/${id}`, { method: "DELETE" });
      setEvents(events.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
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

  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout dark>
      <section className="arena-page pantheon-page">
        <header className="arena-hero pantheon-hero">
          <span className="pantheon-hero-mark" aria-hidden="true"><Landmark size={34} /></span>
          <div className="arena-hero-copy">
            <span className="arena-eyebrow">Hall of champions</span>
            <h2>Pantheon</h2>
            <p>Return to completed campaigns and revisit the teams that earned their place in history.</p>
          </div>
          <div className="arena-hero-stat" aria-label={`${events.length} archived events`}>
            <strong>{events.length}</strong>
            <span>Archived campaigns</span>
          </div>
          <Meander className="arena-hero-key" height={10} />
        </header>

        <div className="arena-toolbar">
          <label className="arena-search">
            <Search size={18} />
            <input type="search" placeholder="Search the archives" aria-label="Search archived events" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </label>
          <span className="arena-result-count">{filteredEvents.length} {filteredEvents.length === 1 ? "record" : "records"}</span>
        </div>

        {loading ? (
          <div className="pantheon-grid" aria-label="Loading archived events">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="pantheon-card arena-card-skeleton"><div className="arena-skeleton-block" /><div className="arena-skeleton-line wide" /><div className="arena-skeleton-line" /></div>)}
          </div>
        ) : events.length === 0 ? (
          <div className="arena-empty-state">
            <span className="arena-empty-icon"><Landmark size={30} /></span>
            <h3>The Pantheon awaits</h3>
            <p>Completed events will be preserved here with their final rankings.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="arena-empty-state compact"><span className="arena-empty-icon"><Search size={27} /></span><h3>No matching records</h3><p>Try another event name.</p></div>
        ) : (
          <div className="pantheon-grid">
            {filteredEvents.map((event) => (
              <article key={event._id} className="pantheon-card" style={{ "--event-accent": event.eventColor || "#c3982b" }}>
                <div className="pantheon-card-top">
                  <span className="pantheon-medallion"><Trophy size={20} /></span>
                  <span className="pantheon-state">Completed</span>
                  {user.role === "admin" && (
                    <div className="arena-card-menu">
                      <button type="button" className="arena-icon-btn" aria-label={`Manage ${event.eventName}`} onClick={() => setMenuOpen(menuOpen === event._id ? null : event._id)}><MoreVertical size={18} /></button>
                      {menuOpen === event._id && (
                        <div className="arena-menu" role="menu">
                          <button type="button" role="menuitem" onClick={() => { setMenuOpen(null); setEditEvent(event); }}>Edit record</button>
                          <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(null); handleDelete(event._id); }}>Delete record</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="button" className="pantheon-card-open" onClick={() => handleClickEvent(event)}>
                  <span className="arena-card-kicker">Final standings</span>
                  <span className="pantheon-card-title">{event.eventName}</span>
                  <span className="arena-card-meta">
                    <span><CalendarDays size={15} />{event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Date unavailable"}</span>
                    {event.location && <span><MapPin size={15} />{event.location}</span>}
                  </span>
                  <span className="pantheon-card-link">View final rankings <ArrowRight size={16} /></span>
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
              <h4>CO & SUB-ORGANIZERS</h4>
              <p style={{ color: "#66666e", fontSize: "10px" }}>
                *Optional – you may add multiple*
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
                <button className="modal-save-btn" type="submit">Save</button>
                <button className="modal-cancel-btn" type="button" onClick={() => setEditEvent(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
};

export default Pantheon;
