import React from 'react';
import PlayerSideMenu from './P_SideMenu';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import '../styles/MainLayout.css';
import '../styles/AppShell.css';

// dark: opt-in dark content area for pages that have been redesigned
const PlayerMainLayout = ({ children, dark = false }) => {
  return (
    <div className={`sh ${dark ? 'sh--dark' : ''}`}>
      <PlayerSideMenu />
      <Header />
      <main className="sh-main">
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
};

export default PlayerMainLayout;
