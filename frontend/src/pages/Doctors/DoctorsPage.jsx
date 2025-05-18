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
        
        // Ensure data is an array
        const doctorsArray = Array.isArray(data) ? data : [];
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
    // Filter doctors based on search term and specialty
    const filtered = doctors.filter(doctor => {
      const nameMatch = `${doctor.profile?.firstName} ${doctor.profile?.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const specialtyMatch = !specialtyFilter || doctor.specialization === specialtyFilter;
      
      return nameMatch && specialtyMatch;
    });
    
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, specialtyFilter]);

  const handleBookAppointment = (doctorId) => {
    navigate(`/appointments/new?doctor=${doctorId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="doctors-page">
      <h1>Find a Doctor</h1>
      
      <SearchFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        specialtyFilter={specialtyFilter}
        onSpecialtyChange={setSpecialtyFilter}
        specialties={specialties}
        onFilterChange={(filters) => {
          if (filters.name) setSearchTerm(filters.name);
          if (filters.specialization) setSpecialtyFilter(filters.specialization);
        }}
      />
      
      {filteredDoctors.length > 0 ? (
        <div className="doctors-grid">
          {Array.isArray(filteredDoctors) && filteredDoctors.map(doctor => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              onBookAppointment={handleBookAppointment}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No doctors found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
export default DoctorsPage;