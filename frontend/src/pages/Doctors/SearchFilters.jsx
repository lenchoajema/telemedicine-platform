import './SearchFilters.css';

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  specialtyFilter,
  onSpecialtyChange,
  specialties
}) {
  return (
    <div className="search-filters">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search doctors by name or specialty..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <i className="icon-search"></i>
      </div>
      
      <div className="filter-controls">
        <select
          value={specialtyFilter}
          onChange={(e) => onSpecialtyChange(e.target.value)}
        >
          <option value="">All Specialties</option>
          {specialties.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>
    </div>
  );
}