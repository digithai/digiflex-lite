import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// ====== MongoDB Connection ======
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Exiting.");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);

console.log("Connected to MongoDB");

// ====== User Schema ======
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  position: String,
  team: String,
  office: String,
  country: String,
  wfhWeekly: Number,
  leaveCounts: {
    sickLeave: Number,
    timeOff: Number,
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
}, {
    collection: 'user'
  }
);

const User = mongoose.model("User", userSchema);

// ====== Create Admin User ======
const createAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set. Exiting.");
    process.exit(1);
  }

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const adminUser = new User({
      name: process.env.ADMIN_NAME || "Admin",
      email,
      password: hash,
      role: "admin",
      position: "Administrator",
      team: "Management",
      office: "HQ",
      country: "US",
      wfhWeekly: 1,
      leaveCounts: { sickLeave: 15, timeOff: 15 },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await adminUser.save();
    console.log("Admin user created successfully:");
    console.log(adminUser);
  } catch (err) {
    console.error("Error creating admin user:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

await createAdminUser();