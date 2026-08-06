// seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const adminEmail = 'semiadmin@gmail.com';
  const adminPassword = 'admin123';

  const adminExists = await User.findOne({ email: adminEmail });
  if (adminExists) {
    if (adminExists.role !== 'superadmin') {
      adminExists.role = 'superadmin';
      await adminExists.save();
      console.log('✅ User exists, upgraded to Super Admin');
    } else {
        console.log('✅ Super Admin already exists');
    }
    console.log(`👉 Email: ${adminEmail}`);
    // console.log(`👉 Password: ${adminPassword}`); // Password unknown if existing
    process.exit();
  }

  const admin = new User({
    name: 'Super Admin',
    email: adminEmail,
    password: adminPassword, // Will be hashed by model
    role: 'superadmin'
  });

  await admin.save();

  console.log('✅ Admin created successfully!');
  console.log('🔐 Login credentials:');
  console.log(`👉 Email: ${adminEmail}`);
  console.log(`👉 Password: ${adminPassword}`);
  process.exit();
};

seedAdmin();
