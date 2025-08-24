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

  const isDoctorBookable = (doctor) => {
    const approved =
      typeof doctor?.verificationStatus === "string"
        ? /^(approved)$/i.test(doctor.verificationStatus)
        : true;
    const active =
      typeof doctor?.user?.status === "string"
        ? /^(active)$/i.test(doctor.user.status)
        : true;
    // Only approved + active doctors are considered bookable/eligible
    return approved && active;
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/doctors`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch doctors: ${response.statusText}`);
        }

        // Unwrap JSON response (API returns { success, data: [...] })
        const json = await response.json();
        // Support multiple response shapes: [], { data: [...] }, { data: { doctors: [...] } }, { users/doctors: [...] }
        const rawDoctors = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.data?.doctors)
          ? json.data.doctors
          : Array.isArray(json?.data?.users)
          ? json.data.users
          : Array.isArray(json?.doctors)
          ? json.doctors
          : Array.isArray(json?.users)
          ? json.users
          : [];
        // Process real doctor data
        const doctorsArray =
          rawDoctors.map((doctor) => ({
            ...doctor,
            // Use real rating data or default to 0 if not available
            rating: doctor.rating || 0,
            reviewCount: doctor.reviewCount || 0,
            // Extract specialization from different possible sources
            specialization:
              doctor.specialization ||
              doctor.profile?.specialization ||
              "General Medicine",
            // Get doctor name from user profile or direct fields
            name: doctor.user
              ? `Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`
              : `Dr. ${doctor.firstName || "Doctor"} ${doctor.lastName || ""}`,
            firstName: doctor.user?.profile?.firstName || doctor.firstName,
            lastName: doctor.user?.profile?.lastName || doctor.lastName,
            email: doctor.user?.email || doctor.email,
            // Add additional fields for UI
            location: doctor.location || "Remote",
            isAvailable:
              doctor.isAvailable !== undefined ? doctor.isAvailable : true,
            verificationStatus: doctor.verificationStatus || "pending",
          })) || [];

        // Keep only approved + active doctors for patient booking view
        const eligibleDoctors = doctorsArray.filter(isDoctorBookable);
        setDoctors(eligibleDoctors);

        // Extract unique specialties
        const uniqueSpecialties = [
          ...new Set(
            eligibleDoctors
              .filter((doctor) => doctor.specialization)
              .map((doctor) => doctor.specialization)
          ),
        ];

        setSpecialties(uniqueSpecialties);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        addNotification(
          "Failed to load doctors. Please try again later.",
          "error"
        );
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [addNotification]);

  useEffect(() => {
    // Filter and sort doctors based on all criteria
    let filtered = doctors.filter((doctor) => {
      const fullName = `${doctor.user?.profile?.firstName || ""} ${
        doctor.user?.profile?.lastName || ""
      }`.toLowerCase();
      const nameMatch =
        fullName.includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

      const specialtyMatch =
        !specialtyFilter || doctor.specialization === specialtyFilter;

      const ratingMatch =
        !ratingFilter || parseFloat(doctor.rating) >= parseFloat(ratingFilter);

      const experienceMatch =
        !experienceFilter ||
        (doctor.experience &&
          parseInt(doctor.experience) >= parseInt(experienceFilter));

      const locationMatch =
        !locationFilter ||
        doctor.location?.toLowerCase().includes(locationFilter.toLowerCase());

      return (
        nameMatch &&
        specialtyMatch &&
        ratingMatch &&
        experienceMatch &&
        locationMatch
      );
    });

    // Sort doctors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
        case "experience":
          return parseInt(b.experience || 0) - parseInt(a.experience || 0);
        case "name":
          const nameA = `${a.user?.profile?.firstName || ""} ${
            a.user?.profile?.lastName || ""
          }`;
          const nameB = `${b.user?.profile?.firstName || ""} ${
            b.user?.profile?.lastName || ""
          }`;
          return nameA.localeCompare(nameB);
        case "availability":
          return b.isAvailable - a.isAvailable;
        default:
          return 0;
      }
    });

    setFilteredDoctors(filtered);
  }, [
    doctors,
    searchTerm,
    specialtyFilter,
    ratingFilter,
    experienceFilter,
    locationFilter,
    sortBy,
  ]);

  const handleBookAppointment = (doctorId) => {
    navigate(`/appointments/new?doctorId=${doctorId}`);
  };

  // isDoctorBookable helper moved above to reuse for initial filtering

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
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option value="">All Specializations</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Minimum Rating:</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Experience:</label>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
            >
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
        <p>
          Found {filteredDoctors.length} doctor
          {filteredDoctors.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filteredDoctors.length > 0 ? (
        <div className="doctors-grid">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="doctor-card-enhanced">
              <div className="doctor-avatar">
                <img
                  src={doctor.user?.profile?.photo || "/default-doctor.png"}
                  alt={`${doctor.user?.profile?.firstName} ${doctor.user?.profile?.lastName}`}
                  onError={(e) => {
                    e.target.src = "/default-doctor.png";
                  }}
                />
                {doctor.isAvailable && (
                  <div className="availability-badge">Available</div>
                )}
              </div>

              <div className="doctor-info">
                <h3>
                  {doctor.user?.profile?.firstName}{" "}
                  {doctor.user?.profile?.lastName}
                </h3>
                <p className="specialization">{doctor.specialization}</p>

                <div className="doctor-stats">
                  <div className="stat-item">
                    <span className="rating">
                      ⭐ {doctor.rating} ({doctor.reviewCount} reviews)
                    </span>
                  </div>
                  {doctor.experience && (
                    <div className="stat-item">
                      <span className="experience">
                        {doctor.experience} years experience
                      </span>
                    </div>
                  )}
                  <div className="stat-item">
                    <span className="location">📍 {doctor.location}</span>
                  </div>
                </div>

                {doctor.bio && (
                  <p className="doctor-bio">
                    {doctor.bio.substring(0, 100)}...
                  </p>
                )}

                <div className="doctor-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleBookAppointment(doctor._id)}
                    disabled={!isDoctorBookable(doctor)}
                    title={
                      !isDoctorBookable(doctor)
                        ? "Doctor not available for booking"
                        : ""
                    }
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
