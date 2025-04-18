import React from 'react';
import { Link } from 'react-router-dom';
//import './NotFoundPage.css'; // Optional: Add custom styles for the page

const NotFoundPage = () => {
    return (
        <div className="not-found-page">
            <h1>404 - Page Not Found</h1>
            <p>Sorry, the page you are looking for does not exist.</p>
            <Link to="/" className="home-link">
                Go Back to Home
            </Link>
        </div>
    );
};

export default NotFoundPage;