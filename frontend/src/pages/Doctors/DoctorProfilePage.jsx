import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import './DoctorPages.css';

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    bio: '',
    education: [],
    experience: []
  });
  const [newEducation, setNewEducation] = useState({ institution: '', degree: '', year: '' });
  const [newExperience, setNewExperience] = useState({ position: '', organization: '', years: '' });
  
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        
        // Initialize the form with existing data
        setProfile({
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          phone: data.profile?.phone || '',
          specialization: data.profile?.specialization || '',
          licenseNumber: data.profile?.licenseNumber || '',
          bio: data.profile?.bio || '',
          education: data.profile?.education || [],
          experience: data.profile?.experience || []
        });
      } catch (error) {
        addNotification(`Error: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [addNotification]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setNewEducation({
      ...newEducation,
      [name]: value
    });
  };

  const handleExperienceChange = (e) => {
    const { name, value } = e.target;
    setNewExperience({
      ...newExperience,
      [name]: value
    });
  };

  const addEducation = () => {
    // Validate
    if (!newEducation.institution || !newEducation.degree) {
      addNotification('Please fill in institution and degree', 'error');
      return;
    }
    
    setProfile({
      ...profile,
      education: [...profile.education, { ...newEducation, id: Date.now() }]
    });
    
    // Reset form
    setNewEducation({ institution: '', degree: '', year: '' });
  };

  const removeEducation = (id) => {
    setProfile({
      ...profile,
      education: profile.education.filter(edu => edu.id !== id)
    });
  };

  const addExperience = () => {
    // Validate
    if (!newExperience.position || !newExperience.organization) {
      addNotification('Please fill in position and organization', 'error');
      return;
    }
    
    setProfile({
      ...profile,
      experience: [...profile.experience, { ...newExperience, id: Date.now() }]
    });
    
    // Reset form
    setNewExperience({ position: '', organization: '', years: '' });
  };

  const removeExperience = (id) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter(exp => exp.id !== id)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ profile })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      addNotification('Profile updated successfully', 'success');
      
      // If they haven't completed verification and just added required fields, redirect
      if (!user.profile?.isVerified && profile.licenseNumber && profile.specialization) {
        navigate('/doctor/verification');
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="doctor-page profile-page">
      <h1>Doctor Profile</h1>
      <p>Manage your profile information visible to patients.</p>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
              />
            </div>
            
            <div className="form-group">
              <label>Specialization</label>
              <select
                name="specialization"
                value={profile.specialization}
                onChange={handleProfileChange}
                required
              >
                <option value="">Select Specialization</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Gastroenterology">Gastroenterology</option>
                <option value="Neurology">Neurology</option>
                <option value="Obstetrics">Obstetrics</option>
                <option value="Oncology">Oncology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Urology">Urology</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={profile.licenseNumber}
                onChange={handleProfileChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>About You</h2>
          <div className="form-group">
            <label>Professional Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleProfileChange}
              rows="4"
              placeholder="Tell patients about yourself, your approach to medicine, and what they can expect from your care."
            ></textarea>
          </div>
        </div>

        <div className="form-section">
          <h2>Education</h2>
          
          <div className="items-list">
            {profile.education.map((edu, index) => (
              <div key={edu.id || index} className="list-item">
                <div className="item-content">
                  <h4>{edu.degree}</h4>
                  <p>{edu.institution} {edu.year ? `- ${edu.year}` : ''}</p>
                </div>
                <button
                  type="button"
                  className="btn-sm danger"
                  onClick={() => removeEducation(edu.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <div className="add-item-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={newEducation.institution}
                  onChange={handleEducationChange}
                />
              </div>
              
              <div className="form-group">
                <label>Degree/Certificate</label>
                <input
                  type="text"
                  name="degree"
                  value={newEducation.degree}
                  onChange={handleEducationChange}
                />
              </div>
              
              <div className="form-group">
                <label>Year</label>
                <input
                  type="text"
                  name="year"
                  value={newEducation.year}
                  onChange={handleEducationChange}
                />
              </div>
            </div>
            
            <button
              type="button"
              className="btn secondary"
              onClick={addEducation}
            >
              Add Education
            </button>
          </div>
        </div>

        <div className="form-section">
          <h2>Experience</h2>
          
          <div className="items-list">
            {profile.experience.map((exp, index) => (
              <div key={exp.id || index} className="list-item">
                <div className="item-content">
                  <h4>{exp.position}</h4>
                  <p>{exp.organization} {exp.years ? `- ${exp.years}` : ''}</p>
                </div>
                <button
                  type="button"
                  className="btn-sm danger"
                  onClick={() => removeExperience(exp.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <div className="add-item-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={newExperience.position}
                  onChange={handleExperienceChange}
                />
              </div>
              
              <div className="form-group">
                <label>Organization</label>
                <input
                  type="text"
                  name="organization"
                  value={newExperience.organization}
                  onChange={handleExperienceChange}
                />
              </div>
              
              <div className="form-group">
                <label>Years</label>
                <input
                  type="text"
                  name="years"
                  value={newExperience.years}
                  onChange={handleExperienceChange}
                  placeholder="e.g. 2018-2022"
                />
              </div>
            </div>
            
            <button
              type="button"
              className="btn secondary"
              onClick={addExperience}
            >
              Add Experience
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary">
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
