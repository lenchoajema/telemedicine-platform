import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  const location = useLocation();

  // Check if current path matches the link
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Navigation Bar - Only show for non-authenticated users */}
      {!user && (
        <div className="mobile-bottom-nav">
          <Link 
            to="/" 
            className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
          >
            <div className="mobile-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
            </div>
            <span className="mobile-nav-label">Home</span>
          </Link>
          
          <Link 
            to="/about" 
            className={`mobile-nav-item ${isActive('/about') ? 'active' : ''}`}
          >
            <div className="mobile-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <path d="M12 17h.01"></path>
              </svg>
            </div>
            <span className="mobile-nav-label">About</span>
          </Link>
          
          <Link 
            to="/services" 
            className={`mobile-nav-item ${isActive('/services') ? 'active' : ''}`}
          >
            <div className="mobile-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <span className="mobile-nav-label">Services</span>
          </Link>
          
          <Link 
            to="/contact" 
            className={`mobile-nav-item ${isActive('/contact') ? 'active' : ''}`}
          >
            <div className="mobile-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <span className="mobile-nav-label">Contact</span>
          </Link>
        </div>
      )}
      
      {/* Regular Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} TeleMed. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}