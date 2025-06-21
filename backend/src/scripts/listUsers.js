import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/telemedicine";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Define User schema (simplified, just for querying)
const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  profile: {
    firstName: String,
    lastName: String,
    fullName: String,
    isVerified: Boolean
  },
  isActive: Boolean
}, { timestamps: true });

// Create User model
const User = mongoose.model("User", UserSchema);

async function listAllUsers() {
  try {
    const users = await User.find({}).select("email role profile.firstName profile.lastName profile.isVerified isActive createdAt");
    
    console.log("=".repeat(80));
    console.log("REGISTERED USERS".padStart(45, " "));
    console.log("=".repeat(80));
    console.log("EMAIL".padEnd(30) + "ROLE".padEnd(15) + "NAME".padEnd(25) + "VERIFIED".padEnd(10) + "STATUS");
    console.log("-".repeat(80));
    
    users.forEach(user => {
      const firstName = user.profile?.firstName || "";
      const lastName = user.profile?.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      const isVerified = user.profile?.isVerified ? "✅" : "❌";
      const status = user.isActive ? "Active" : "Inactive";
      
      console.log(
        user.email.padEnd(30) + 
        (user.role || "").padEnd(15) + 
        fullName.padEnd(25) + 
        isVerified.padEnd(10) + 
        status
      );
    });
    
    console.log("-".repeat(80));
    console.log(`Total users: ${users.length}`);
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

// Execute the function
listAllUsers();