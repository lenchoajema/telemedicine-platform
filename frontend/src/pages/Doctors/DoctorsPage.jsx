import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContextCore";
import DoctorCard from "../../components/doctors/DoctorCard";
import SearchFilters from "../../components/doctors/SearchFilters";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./DoctorsPage.css";

const DoctorsPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [specialties, setSpecialties] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors`);
        if (!response.ok) {
          throw new Error(`Failed to fetch doctors: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Ensure data is an array and add mock ratings if not present
        const doctorsArray = Array.isArray(data) ? data.map(doctor => ({
          ...doctor,
          rating: doctor.rating || (Math.random() * 2 + 3.5).toFixed(1), // Random rating between 3.5-5.5
          reviewCount: doctor.reviewCount || Math.floor(Math.random() * 100 + 10),
          location: doctor.location || 'Remote',
          isAvailable: doctor.isAvailable !== undefined ? doctor.isAvailable : Math.random() > 0.3
        })) : [];
        
        setDoctors(doctorsArray);
        
        // Extract unique specialties
        const uniqueSpecialties = [...new Set(doctorsArray
          .filter(doctor => doctor.specialization)
          .map(doctor => doctor.specialization))];
        
        setSpecialties(uniqueSpecialties);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        addNotification("Failed to load doctors. Please try again later.", "error");
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [addNotification]);

  useEffect(() => {
    // Filter and sort doctors based on all criteria
    let filtered = doctors.filter(doctor => {
      const fullName = `${doctor.user?.profile?.firstName || ''} ${doctor.user?.profile?.lastName || ''}`.toLowerCase();
      const nameMatch = fullName.includes(searchTerm.toLowerCase()) || 
                       doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const specialtyMatch = !specialtyFilter || doctor.specialization === specialtyFilter;
      
      const ratingMatch = !ratingFilter || parseFloat(doctor.rating) >= parseFloat(ratingFilter);
      
      const experienceMatch = !experienceFilter || 
        (doctor.experience && parseInt(doctor.experience) >= parseInt(experienceFilter));
      
      const locationMatch = !locationFilter || 
        doctor.location?.toLowerCase().includes(locationFilter.toLowerCase());
      
      return nameMatch && specialtyMatch && ratingMatch && experienceMatch && locationMatch;
    });

    // Sort doctors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
        case 'experience':
          return parseInt(b.experience || 0) - parseInt(a.experience || 0);
        case 'name':
          const nameA = `${a.user?.profile?.firstName || ''} ${a.user?.profile?.lastName || ''}`;
          const nameB = `${b.user?.profile?.firstName || ''} ${b.user?.profile?.lastName || ''}`;
          return nameA.localeCompare(nameB);
        case 'availability':
          return b.isAvailable - a.isAvailable;
        default:
          return 0;
      }
    });
    
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, specialtyFilter, ratingFilter, experienceFilter, locationFilter, sortBy]);

  const handleBookAppointment = (doctorId) => {
    navigate(`/appointments/new?doctorId=${doctorId}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSpecialtyFilter("");
    setRatingFilter("");
    setExperienceFilter("");
    setLocationFilter("");
    setSortBy("rating");
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="doctors-page">
      <div className="page-header">
        <h1>Find a Doctor</h1>
        <p>Connect with qualified healthcare professionals</p>
      </div>
      
      <div className="search-filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Specialization:</label>
            <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
              <option value="">All Specializations</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Minimum Rating:</label>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Experience:</label>
            <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)}>
              <option value="">Any Experience</option>
              <option value="5">5+ Years</option>
              <option value="10">10+ Years</option>
              <option value="15">15+ Years</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="name">Name (A-Z)</option>
              <option value="availability">Available Now</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="results-summary">
        <p>Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}</p>
      </div>
      
      {filteredDoctors.length > 0 ? (
        <div className="doctors-grid">
          {filteredDoctors.map(doctor => (
            <div key={doctor._id} className="doctor-card-enhanced">
              <div className="doctor-avatar">
                <img 
                  src={doctor.user?.profile?.photo || '/default-doctor.png'} 
                  alt={`${doctor.user?.profile?.firstName} ${doctor.user?.profile?.lastName}`}
                  onError={(e) => { e.target.src = '/default-doctor.png'; }}
                />
                {doctor.isAvailable && <div className="availability-badge">Available</div>}
              </div>
              
              <div className="doctor-info">
                <h3>{doctor.user?.profile?.firstName} {doctor.user?.profile?.lastName}</h3>
                <p className="specialization">{doctor.specialization}</p>
                
                <div className="doctor-stats">
                  <div className="stat-item">
                    <span className="rating">
                      ⭐ {doctor.rating} ({doctor.reviewCount} reviews)
                    </span>
                  </div>
                  {doctor.experience && (
                    <div className="stat-item">
                      <span className="experience">{doctor.experience} years experience</span>
                    </div>
                  )}
                  <div className="stat-item">
                    <span className="location">📍 {doctor.location}</span>
                  </div>
                </div>

                {doctor.bio && (
                  <p className="doctor-bio">{doctor.bio.substring(0, 100)}...</p>
                )}

                <div className="doctor-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleBookAppointment(doctor._id)}
                  >
                    Book Appointment
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate(`/doctors/${doctor._id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No doctors found matching your criteria.</p>
          <button className="btn btn-primary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;