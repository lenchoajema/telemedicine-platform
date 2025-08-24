import apiClient from './apiClient';

// Fetch all active doctors; backend returns plain array of User docs (role: doctor)
export async function fetchAllDoctors() {
  try {
    const res = await apiClient.get('/doctors');
    const raw = res.data;
    console.debug('[doctorService] /doctors raw response:', raw);
    const list = Array.isArray(raw) ? raw : (raw && raw.success && Array.isArray(raw.data) ? raw.data : []);
    if (!Array.isArray(list)) return [];
    return list.map(d => {
      const profile = d.profile || d.user?.profile || {};
      const firstName = profile.firstName || d.firstName || '';
      const lastName = profile.lastName || d.lastName || '';
      let fullName = profile.fullName || d.fullName || `${firstName} ${lastName}`.trim();
      if (!fullName.trim() && d.name) fullName = d.name;
      const hasDoctorDoc = !!d.user; // Doctor collection doc (populated user) vs fallback user
      return {
        doctorDocId: hasDoctorDoc ? d._id : null,
        userId: hasDoctorDoc ? d.user?._id : d._id,
        doctorId: hasDoctorDoc ? d._id : null, // convenience for booking endpoints expecting Doctor _id
        firstName,
        lastName,
        fullName: fullName.trim(),
        specialization: profile.specialization || d.specialization || 'General Medicine',
        avatar: profile.photo || d.avatar || profile.avatar,
        experience: d.experience || profile.experience
      };
    });
  } catch (e) {
    console.error('[doctorService] fetchAllDoctors failed:', e);
    return [];
  }
}
