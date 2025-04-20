import React from 'react';

export default function AppointmentFilter({ 
  filterOptions, 
  onFilterChange 
}) {
  return (
    <div className="appointment-filters">
      <div className="filter-group">
        <label>Status:</label>
        <select 
          value={filterOptions.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          <option value="all">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No Show</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label>Date:</label>
        <select
          value={filterOptions.date}
          onChange={(e) => onFilterChange({ date: e.target.value })}
        >
          <option value="all">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label>Sort by:</label>
        <select
          value={filterOptions.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value })}
        >
          <option value="date-asc">Date (Oldest First)</option>
          <option value="date-desc">Date (Newest First)</option>
        </select>
      </div>
    </div>
  );
}