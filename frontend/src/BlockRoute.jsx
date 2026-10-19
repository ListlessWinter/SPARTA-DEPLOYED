import { useLocation } from 'react-router-dom';
import { getDemoUser } from './mock/mockApi';

// Demo mode: no login required. Visiting a page without a session signs in the demo account for that section.
export default function BlockRoute({ children }) {
  const { pathname } = useLocation();
  let auth = null;
  try { auth = JSON.parse(localStorage.getItem('auth')); } catch (e) { }

  if (!auth || !auth.email) {
    const demoUser = getDemoUser(pathname.startsWith('/admin') ? 'admin' : 'player');
    localStorage.setItem('auth', JSON.stringify(demoUser));
  }

  return children;
}
