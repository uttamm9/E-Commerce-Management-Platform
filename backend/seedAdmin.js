require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

/**
 * Seed script to create initial Admin account.
 * Reads credentials securely from environment variables.
 */
const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be defined in .env');
    process.exit(1);
  }

  if (!MONGO_URI) {
    console.error('Error: MONGO_URI must be defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for admin seeding.');

    const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`Admin account already exists for ${normalizedEmail}. No action needed.`);
      } else {
        console.warn(
          `A user with email ${normalizedEmail} already exists with role '${existingUser.role}'. Never silently promoting an existing user.`
        );
      }
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: normalizedEmail,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isActive: true,
    });

    console.log(`Admin account successfully created: ${admin.email} (ID: ${admin._id})`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
