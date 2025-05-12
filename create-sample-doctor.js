// Create a sample doctor and user in the database
db.users.insertOne({
  firstName: "John",
  lastName: "Smith",
  email: "drsmith@example.com",
  password: "$2a$10$XL.uAIRWwRrQQU5DGsXkPeoHU9OvZ1J9QegJNTQNKzBpSW6XFTB9.", // hashed password for "password123"
  role: "doctor",
  status: "active",
  verificationStatus: "approved",
  specialty: "Cardiologist",
  createdAt: new Date(),
  updatedAt: new Date(),
  phoneNumber: "555-123-4567",
  address: "123 Medical Center Blvd"
});

// Get the ID of the newly created doctor user
var doctorId = db.users.findOne({email: "drsmith@example.com"})._id;

// Create a doctor profile
db.doctors.insertOne({
  user: doctorId,
  specialization: "Cardiology",
  licenseNumber: "MD12345678",
  education: "Harvard Medical School",
  experience: "15 years",
  verificationDocuments: [
    {
      type: "license",
      url: "https://example.com/license-doc.pdf",
      verificationStatus: "verified"
    }
  ],
  languages: ["English", "Spanish"],
  consultationFee: 150,
  verificationStatus: "approved",
  bio: "Board-certified cardiologist with over 15 years of experience in treating heart conditions.",
  createdAt: new Date(),
  updatedAt: new Date()
});
