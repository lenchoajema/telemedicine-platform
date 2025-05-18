import React, { useState, useEffect } from 'react';
import './SearchFilters.css';

export default function SearchFilters({ onFilterChange = () => {} }) {
  const [filters, setFilters] = useState({
    specialization: '',
    name: '',
    rating: '',
    availability: false
  });
  
  const [specializations, setSpecializations] = useState([]);
  
  useEffect(() => {
    // Fetch available specializations
    const fetchSpecializations = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/specializations`);
        if (response.ok) {
          const data = await response.json();
          setSpecializations(data);
        } else {
          // If API fails, use default specializations
          setSpecializations([
            'General Medicine',
            'Cardiology',
            'Dermatology',
            'Neurology',
            'Orthopedics',
            'Pediatrics',
            'Psychiatry',
            'Ophthalmology',
            'Family Medicine'
          ]);
          console.warn('Using default specializations due to API error');
        }
      } catch (error) {
        console.error('Error fetching specializations:', error);
        // If API fails, use default specializations
        setSpecializations([
          'General Medicine',
          'Cardiology',
          'Dermatology',
          'Neurology',
          'Orthopedics',
          'Pediatrics',
          'Psychiatry',
          'Ophthalmology',
          'Family Medicine'
        ]);
      }
    };
    
    fetchSpecializations();
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFilters(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };
  
  const clearFilters = () => {
    setFilters({
      specialization: '',
      name: '',
      rating: '',
      availability: false
    });
    onFilterChange({});
  };
  
  return (
    <div className="search-filters">
      <h2>Find Doctors</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="filter-row">
          <div className="filter-field">
            <label htmlFor="name">Doctor Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={filters.name}
              onChange={handleChange}
              placeholder="Search by name"
            />
          </div>
          
          <div className="filter-field">
            <label htmlFor="specialization">Specialization</label>
            <select
              id="specialization"
              name="specialization"
              value={filters.specialization}
              onChange={handleChange}
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-field">
            <label htmlFor="rating">Minimum Rating</label>
            <select
              id="rating"
              name="rating"
              value={filters.rating}
              onChange={handleChange}
            >
              <option value="">Any Rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>
          
          <div className="filter-field checkbox">
            <input
              type="checkbox"
              id="availability"
              name="availability"
              checked={filters.availability}
              onChange={handleChange}
            />
            <label htmlFor="availability">Available Today</label>
          </div>
        </div>
        
        <div className="filter-actions">
          <button type="button" onClick={clearFilters} className="btn-clear">
            Clear Filters
          </button>
          <button type="submit" className="btn-search">
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
