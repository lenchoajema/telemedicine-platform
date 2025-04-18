import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} TeleMed. All rights reserved.</p>
      </div>
    </footer>
  );
}