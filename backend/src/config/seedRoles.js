require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bci_bms';

const FIXED_ROLES = [
  // Admin has access to all permissions
  {
    name: 'Admin',
    permissions: [
      'Admin',
      'Setup',
      'Workshop Template',
      'Plan & Launch',
      'Doer',
      'Workshop History',
    ],
    canDelete: false,
  },
  { name: 'MD', permissions: ['Plan & Launch', 'Doer'], canDelete: false },
  { name: 'EA', permissions: ['Plan & Launch', 'Doer'], canDelete: false },
  { name: 'PC', permissions: ['Plan & Launch', 'Doer'], canDelete: false },
  { name: 'Doer', permissions: ['Doer'], canDelete: false },
];

async function seedRoles() {
  await mongoose.connect(MONGO_URI);
  try {
    for (const roleData of FIXED_ROLES) {
      const exists = await Role.findOne({ name: roleData.name });
      if (!exists) {
        await Role.create(roleData);
        console.log(`Seeded role: ${roleData.name}`);
      }
    }
    console.log('Roles seeded successfully.');
  } catch (err) {
    console.error('Error seeding roles:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedRoles();
// module.exports = seedRoles;
