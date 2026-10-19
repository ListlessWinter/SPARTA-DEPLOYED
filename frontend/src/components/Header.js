import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, UserPen, LogOut, CalendarDays } from 'lucide-react';
import '../styles/Header.css'; // also holds .dropdown-item, used by other pages
import '../styles/AppShell.css';
import { API_URL } from "../config";

// First matching rule names the page
const PAGE_TITLES = [
  [/\/approval$/, 'Approvals'],
  [/\/event\/create$/, 'Create Event'],
  [/\/addteam$/, 'Add Team'],
  [/\/addgame$/, 'Add Game'],
  [/\/pending$/, 'Pending Players'],
  [/\/profile$/, 'Profile'],
  [/\/players$/, 'Team Players'],
  [/\/team$/, 'Teams'],
  [/\/game\/[^/]+$/, 'Game Bracket'],
  [/\/game$/, 'Games'],
  [/\/liveScores$/, 'Live Scores'],
  [/\/feedback$/, 'Feedback'],
  [/\/ranking$/, 'Rankings'],
  [/pantheon/, 'Pantheon'],
  [/dashboard$/, 'Dashboard'],
  [/\/event\/[^/]+$/, 'Event Details'],
  [/\/event$/, 'Events'],
];

const getTitle = (pathname) => (PAGE_TITLES.find(([re]) => re.test(pathname)) || [null, 'SPARTA'])[1];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = getTitle(location.pathname);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const rawUser = JSON.parse(localStorage.getItem("auth")) || {};
  const [user, setUser] = useState(rawUser);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // edit form state
  const [playerName, setplayerName] = useState(user?.playerName || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(user?.profilePic || null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    setplayerName(user?.playerName || '');
    setPreviewSrc(user?.profilePic || null);
  }, [user]);

  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/');
  };

  const openEdit = () => {
    setDropdownOpen(false);
    setShowEditModal(true);
    setplayerName(user?.playerName || '');
    setPreviewSrc(user?.profilePic || null);
    setPhotoFile(null);
  };

  const onPhotoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPreviewSrc(URL.createObjectURL(f));
  };

  // Update Name and pic
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Formdata for files
      const formData = new FormData();
      formData.append('playerName', playerName);
      
      // Only append the file if the user actually selected a new one
      if (photoFile) {
        formData.append('profilePic', photoFile); 
      }

      // Send to Backend
      const response = await fetch(`${API_URL}/api/players/users/${user._id || user.id}`, {
        method: 'PUT',
        body: formData, 
      });

      if (response.ok) {
        const updatedUserFromDB = await response.json();

        // Update Local Storage
        const newAuthData = { 
          ...user, 
          ...updatedUserFromDB,
          playerName: updatedUserFromDB.playerName,
          profilePic: updatedUserFromDB.profilePic 
        };
        
        localStorage.setItem('auth', JSON.stringify(newAuthData));
        setUser(newAuthData);
        setShowEditModal(false);
        
        alert("Profile updated successfully!");
      } else {
        const errData = await response.json();
        console.error("Failed to update profile:", errData);
        alert(`Failed: ${errData.message}`);
      }

    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const avatarSrc = user?.profilePic || '/SPARTA_Logo.png';
  const displayName = user?.playerName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sh-topbar">
      <div className="sh-topbar-title">
        <h1>{currentTitle}</h1>
        <span className="sh-date"><CalendarDays size={14} /> {today}</span>
      </div>

      <div className="sh-user" ref={dropdownRef}>
        <button
          className="sh-user-btn"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
        >
          <img src={avatarSrc} alt="" className="sh-avatar" />
          <span className="sh-user-meta">
            <span className="sh-user-name">{displayName}</span>
            <span className="sh-user-role">{user.role}</span>
          </span>
          <ChevronDown size={16} className={`sh-chevron ${dropdownOpen ? 'open' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="sh-menu" role="menu">
            <button className="sh-menu-item" role="menuitem" onClick={openEdit}><UserPen size={16} /> Edit profile</button>
            <div className="sh-menu-divider" />
            <button className="sh-menu-item danger" role="menuitem" onClick={handleLogout}><LogOut size={16} /> Log out</button>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="sh-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="sh-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit profile</h3>
            <form onSubmit={handleSave} className="sh-form">
              <div className="sh-photo-row">
                <img src={previewSrc || '/SPARTA_Logo.png'} alt="" className="sh-photo" />
                <label className="sh-btn ghost">
                  Choose photo
                  <input type="file" accept="image/*" onChange={onPhotoChange} hidden />
                </label>
              </div>

              <label className="sh-field">
                <span>Nickname</span>
                <input type="text" placeholder='Enter nickname' value={playerName} onChange={(e) => setplayerName(e.target.value)} />
              </label>

              <dl className="sh-readonly">
                <div><dt>Email</dt><dd>{user?.email || 'N/A'}</dd></div>
                <div><dt>Institution</dt><dd>{user?.institution?.name || user?.institution || 'N/A'}</dd></div>
              </dl>

              <div className="sh-form-actions">
                <button type="button" className="sh-btn ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="sh-btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;