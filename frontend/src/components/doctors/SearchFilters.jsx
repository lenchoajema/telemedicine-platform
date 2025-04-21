import React from 'react';
import './SearchFilters.css';

const SearchFilters = ({ searchTerm, specialtyFilter, onSearchChange, onSpecialtyChange, specialties = [] }) => {
  return (
    <div className="search-filters">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search doctors by name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <div className="specialty-filter">
        <select 
          value={specialtyFilter}
          onChange={(e) => onSpecialtyChange(e.target.value)}
        >
          <option value="">All Specialties</option>
          {specialties.map((specialty, index) => (
            <option key={index} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchFilters;