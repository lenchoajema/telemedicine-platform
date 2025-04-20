import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import DoctorService from '../../api/DoctorService';
//import DoctorCard from '../../components/doctors/DoctorCard';
//import SearchFilters from '../../components/doctors/SearchFilters';
//import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './DoctorsPage.css';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await DoctorService.getAllDoctors();
        setDoctors(response.data);
        setFilteredDoctors(response.data);
      } catch (err) {
        addNotification('Failed to load doctors', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [addNotification]);

  useEffect(() => {
    let results = doctors;
    
    if (searchTerm) {
      results = results.filter(doctor => 
        doctor.profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (specialtyFilter) {
      results = results.filter(doctor => 
        doctor.specialization === specialtyFilter
      );
    }
    
    setFilteredDoctors(results);
  }, [searchTerm, specialtyFilter, doctors]);

  const specialties = [...new Set(doctors.map(d => d.specialization))];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="doctors-page">
      <h1>Find Your Doctor</h1>
      
      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        specialtyFilter={specialtyFilter}
        onSpecialtyChange={setSpecialtyFilter}
        specialties={specialties}
      />
      
      <div className="doctors-grid">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map(doctor => (
            <DoctorCard 
              key={doctor._id}
              doctor={doctor}
              onBookAppointment={() => {/* Implement booking */}}
            />
          ))
        ) : (
          <div className="empty-state">
            No doctors found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
