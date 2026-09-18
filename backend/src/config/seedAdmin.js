require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Role = require('../models/Role');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bci_bms';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'superadmin@bci.com';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '9999999999';

async function seedAdmin() {
  await mongoose.connect(MONGO_URI);
  try {
    // Ensure Admin role exists with all permissions
    const allPermissions = [
      'Admin',
      'Setup',
      'Workshop Template',
      'Plan & Launch',
      'Doer',
      'Workshop History',
    ];
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        permissions: allPermissions,
        canDelete: false,
      });
      console.log('Created Admin role');
    }

    // Check if admin user exists
    let admin = await Employee.findOne({ email: ADMIN_EMAIL });
    if (admin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    admin = await Employee.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      masterEmail: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      departments: [],
      role: adminRole._id,
      isActive: true,
      isFirstLogin: true,
    });
    console.log('Admin user created successfully.');
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
