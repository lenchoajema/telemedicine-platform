import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import NotificationBar from './NotificationBar';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="layout-container">
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Notification Bar */}
      <NotificationBar />
      
      <div className="layout-content">
        {/* Sidebar - only show when user is logged in */}
        {user && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        
        {/* Main Content */}
        <main className={`main-content ${user ? 'with-sidebar' : 'without-sidebar'}`}>
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}