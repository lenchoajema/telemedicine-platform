import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContextCore';
import './VerificationForm.css';

export default function VerificationForm() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    specialization: '',
    licenseNumber: '',
    education: [{ institution: '', degree: '', year: '' }],
    experience: [{ hospital: '', position: '', startYear: '', endYear: '' }]
  });
  
  const [files, setFiles] = useState({
    license: null,
    degree: null,
    certification: null,
    identity: null
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index][field] = value;
    setFormData({ ...formData, education: updatedEducation });
  };
  
  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[index][field] = value;
    setFormData({ ...formData, experience: updatedExperience });
  };
  
  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { institution: '', degree: '', year: '' }]
    });
  };
  
  const removeEducation = (index) => {
    const updatedEducation = formData.education.filter((_, i) => i !== index);
    setFormData({ ...formData, education: updatedEducation });
  };
  
  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { hospital: '', position: '', startYear: '', endYear: '' }]
    });
  };
  
  const removeExperience = (index) => {
    const updatedExperience = formData.experience.filter((_, i) => i !== index);
    setFormData({ ...formData, experience: updatedExperience });
  };
  
  const handleFileChange = (e, type) => {
    setFiles({ ...files, [type]: e.target.files[0] });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('You must be logged in to submit verification', 'error');
      return;
    }
    
    // Validate required fields
    if (!formData.specialization || !formData.licenseNumber || !files.license) {
      addNotification('Please fill all required fields and upload license document', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // First upload files
      const uploadPromises = [];
      const uploadedFiles = {};
      
      for (const [type, file] of Object.entries(files)) {
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', type);
          
          const uploadRequest = fetch(`${import.meta.env.VITE_API_URL}/doctors/upload-document`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          }).then(res => res.json());
          
          uploadPromises.push(
            uploadRequest.then(data => {
              uploadedFiles[type] = data.fileUrl;
            })
          );
        }
      }
      
      await Promise.all(uploadPromises);
      
      // Create verification documents array
      const verificationDocuments = Object.entries(uploadedFiles).map(([type, fileUrl]) => ({
        type,
        fileUrl
      }));
      
      // Submit doctor verification
      const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          verificationDocuments
        })
      });
      
      if (!response.ok) {
        throw new Error('Verification submission failed');
      }
      
      addNotification('Verification submitted successfully! We will review your application.', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Verification error:', error);
      addNotification(error.message || 'Failed to submit verification', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="verification-page">
      <div className="verification-container">
        <h1>Doctor Verification</h1>
        <p className="subtitle">
          Please provide your professional information for verification
        </p>
        
        <form className="verification-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>Professional Information</h2>
            
            <div className="form-group">
              <label htmlFor="specialization">Medical Specialization *</label>
              <select
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
              >
                <option value="">Select Specialization</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT">ENT</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="licenseNumber">Medical License Number *</label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
              />
            </div>
          </section>
          
          <section className="form-section">
            <h2>Education</h2>
            {formData.education.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="form-group">
                  <label>Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={edu.year}
                    onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                    required
                  />
                </div>
                
                {index > 0 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeEducation(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-button"
              onClick={addEducation}
            >
              Add Education
            </button>
          </section>
          
          <section className="form-section">
            <h2>Experience</h2>
            {formData.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="form-group">
                  <label>Hospital/Clinic</label>
                  <input
                    type="text"
                    value={exp.hospital}
                    onChange={(e) => handleExperienceChange(index, 'hospital', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Start Year</label>
                  <input
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={exp.startYear}
                    onChange={(e) => handleExperienceChange(index, 'startYear', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>End Year (or Current)</label>
                  <input
                    type="text"
                    placeholder="YYYY or 'Present'"
                    value={exp.endYear}
                    onChange={(e) => handleExperienceChange(index, 'endYear', e.target.value)}
                    required
                  />
                </div>
                
                {index > 0 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeExperience(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-button"
              onClick={addExperience}
            >
              Add Experience
            </button>
          </section>
          
          <section className="form-section">
            <h2>Required Documents</h2>
            <p className="document-instructions">
              Please upload scanned copies of the following documents.
              Accepted formats: PDF, JPG, PNG (max 5MB each)
            </p>
            
            <div className="document-upload">
              <label>
                Medical License *
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'license')}
                  required
                />
                {files.license && <span className="file-selected">{files.license.name}</span>}
              </label>
            </div>
            
            <div className="document-upload">
              <label>
                Medical Degree
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'degree')}
                />
                {files.degree && <span className="file-selected">{files.degree.name}</span>}
              </label>
            </div>
            
            <div className="document-upload">
              <label>
                Professional Certifications
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'certification')}
                />
                {files.certification && <span className="file-selected">{files.certification.name}</span>}
              </label>
            </div>
            
            <div className="document-upload">
              <label>
                ID Document
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'identity')}
                />
                {files.identity && <span className="file-selected">{files.identity.name}</span>}
              </label>
            </div>
          </section>
          
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
