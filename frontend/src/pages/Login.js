import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight, LoaderCircle,
  CircleCheck, CircleAlert,
} from 'lucide-react';
import LoginScene from '../components/LoginScene';
import DemoToasts from '../components/DemoToasts';
import { Meander } from '../components/SpartanDecor';
import '../styles/Login.css'; // shared classes (role buttons, modals) still used by other pages
import '../styles/LoginPage.css';
import { API_URL } from "../config";
const spartaLogo = "/assets/SPARTA_Logo.svg";

const ADMIN_ROLES = [
  { value: 'admin', label: 'Main Admin' },
  { value: 'co-organizer', label: 'Co-Organizer' },
  { value: 'sub-organizer', label: 'Sub-Organizer' },
];

const ROLE_LABELS = {
  admin: 'Admin',
  'co-organizer': 'Co-Organizer',
  'sub-organizer': 'Sub-Organizer',
  player: 'Player',
};

export default function LoginPage() {
  const [role, setRole] = useState('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accessKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [showLoginFailed, setShowLoginFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  useEffect(() => { document.title = "SPARTA | Login"; }, []);
  const isAdminGroup = role !== 'player';
  const usesAccessKey = role === 'co-organizer' || role === 'sub-organizer';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Payload
    const payload = {
      email: formData.email,
    };

    // Password check for admin and player
    if (!usesAccessKey) {
      payload.password = formData.password;
    }

    // AccessKey for co-organizer or sub-organizer
    if (usesAccessKey) {
      payload.accessKey = formData.accessKey;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setShowLoginSuccess(true);
        localStorage.setItem('auth', JSON.stringify(data.user));

        setTimeout(() => {
          navigate(role === 'player' ? '/dashboard' : '/admin/dashboard');
        }, 1000);
      } else {
        setErrorMessage(data.message || "Login failed. Please try again.");
        setShowLoginFailed(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("Something went wrong. Please try again.");
      setShowLoginFailed(true);
      setLoading(false);
    }
  };

  return (
    <div className="lp">
      <DemoToasts
        toasts={[
          { icon: 'construction', text: 'Under construction: UI/UX redesigning in progress...' },
          { icon: 'info', text: 'This is a demo presentation. No authorization required.' },
        ]}
      />
      {/* Success Modal */}
      {showLoginSuccess && (
        <div className="lp-modal-overlay">
          <div className="lp-modal" role="status">
            <div className="lp-modal-icon success"><CircleCheck size={30} /></div>
            <h2>Login successful!</h2>
            <p>Welcome back. Taking you to your dashboard…</p>
            <div className="lp-progress"><span /></div>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showLoginFailed && (
        <div className="lp-modal-overlay" onClick={() => setShowLoginFailed(false)}>
          <div className="lp-modal" role="alertdialog" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-icon error"><CircleAlert size={30} /></div>
            <h2>Login failed</h2>
            <p>{errorMessage}</p>
            <button type="button" className="lp-btn lp-btn-primary" onClick={() => setShowLoginFailed(false)}>
              Try again
            </button>
          </div>
        </div>
      )}

      <LoginScene />

      <main className="lp-main">
        <div className="lp-temple">
          <div className="lp-pediment" aria-hidden="true">
            <svg viewBox="0 0 600 64" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lp-pediment-stone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#424249" />
                  <stop offset="0.55" stopColor="#29292d" />
                  <stop offset="1" stopColor="#1a1a1d" />
                </linearGradient>
              </defs>
              <polygon className="lp-pediment-roof" points="300,2 596,62 4,62" />
              <polygon className="lp-pediment-relief" points="300,12 544,56 56,56" />
              <path className="lp-pediment-line" d="M78 53 L300 17 L522 53" />
            </svg>
          </div>
          <div className="lp-entablature" aria-hidden="true"><Meander height={12} /></div>
          <div className="lp-portico">
            <span className="lp-col outer" aria-hidden="true"><i /></span>
            <span className="lp-col" aria-hidden="true"><i /></span>
            <div className="lp-card">
              <header className="lp-card-head">
                <div className="lp-brand">
                  <img src={spartaLogo} alt="" />
                  <span>SPARTA</span>
                </div>
                <span className="lp-kicker">Sports command center</span>
                <h1>Enter the arena</h1>
                <p>Command events, rally teams, and track every victory.</p>
              </header>

              <div className="lp-segment" role="tablist" aria-label="Account type">
                <span className={`lp-segment-thumb ${isAdminGroup ? '' : 'right'}`} aria-hidden="true" />
                <button
                  type="button"
                  role="tab"
                  aria-selected={isAdminGroup}
                  className={isAdminGroup ? 'active' : ''}
                  onClick={() => !isAdminGroup && setRole('admin')}
                >
                  Organizer
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isAdminGroup}
                  className={!isAdminGroup ? 'active' : ''}
                  onClick={() => setRole('player')}
                >
                  Player
                </button>
              </div>

              <div className={`lp-subroles ${isAdminGroup ? 'open' : ''}`} aria-hidden={!isAdminGroup}>
                <div className="lp-subroles-inner">
                  {ADMIN_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      tabIndex={isAdminGroup ? 0 : -1}
                      className={`lp-chip ${role === r.value ? 'active' : ''}`}
                      onClick={() => setRole(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="lp-form" noValidate>
                <label className="lp-field">
                  <span className="lp-label">Email</span>
                  <span className="lp-input">
                    <Mail size={18} />
                    <input
                      type="email"
                      name="email"
                      placeholder="you@school.edu.ph"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </span>
                </label>

                {/* Password for Admin and Player, Access Key for Co/Sub Organizer */}
                {usesAccessKey ? (
                  <label className="lp-field" key="accessKey">
                    <span className="lp-label">Access key</span>
                    <span className="lp-input">
                      <KeyRound size={18} />
                      <input
                        type="text"
                        name="accessKey"
                        placeholder="Key from your invitation email"
                        autoComplete="one-time-code"
                        required
                        value={formData.accessKey}
                        onChange={handleChange}
                      />
                    </span>
                  </label>
                ) : (
                  <label className="lp-field" key="password">
                    <span className="lp-label">Password</span>
                    <span className="lp-input">
                      <Lock size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="lp-icon-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </span>
                  </label>
                )}

                <button type="submit" className="lp-btn lp-btn-primary lp-submit" disabled={loading}>
                  {loading ? (
                    <><LoaderCircle size={18} className="lp-spin" /> Signing in…</>
                  ) : (
                    <>Sign in as {ROLE_LABELS[role]} <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <div className="lp-divider"><span>or</span></div>

              <button type="button" className="lp-btn lp-btn-ghost" onClick={() => navigate('/spectator/institution')}>
                <Eye size={18} /> Continue as Spectator
              </button>

              <p className="lp-footnote">
                Don't have an account?
                <button type="button" className="lp-link" onClick={() => navigate('/register')}>
                  Register here
                </button>
              </p>
            </div>
            <span className="lp-col" aria-hidden="true"><i /></span>
            <span className="lp-col outer" aria-hidden="true"><i /></span>
          </div>
          <div className="lp-steps" aria-hidden="true"><i /><i /><i /></div>
        </div>
      </main>
    </div>
  );
}
