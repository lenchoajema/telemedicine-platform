import React from 'react';
import Header from './Header';
import Footer from './Footer';
import NotificationBar from './NotificationBar';

export default function Layout({ children }) {
  return (
    <div className="app-container">
      <Header />
      <NotificationBar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}