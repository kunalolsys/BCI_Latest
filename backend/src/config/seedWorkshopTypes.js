require('dotenv').config();

const mongoose = require('mongoose');
const WorkshopType = require('../models/WorkshopType');

const workshopTypesToSeed = [
  { abbreviation: 'DYP', name: 'Double Your Profit' },
  { abbreviation: 'BMI', name: 'Business Mastery Intensive' },
  { abbreviation: 'BMP', name: 'Business Mastery Program' },
  { abbreviation: 'MANI', name: 'Manifestation & The Law of Attraction' },
  { abbreviation: 'AMANI', name: 'Advance Manifestation' },
  { abbreviation: 'ASMP', name: 'Advance Sales & Marketing Program' },
  { abbreviation: 'DM5', name: 'Profits Explosion Mastery' },
  { abbreviation: 'DM4', name: 'Profit Attraction System' },
  { abbreviation: 'LNSN', name: 'LinkedIn Sales Navigator' },
  { abbreviation: 'TES', name: 'Tech Essential' },
  { abbreviation: 'AI', name: 'AI Workshop' },
  { abbreviation: 'ALM12', name: 'Alumni - 12 Months' },
  { abbreviation: 'ALM6', name: 'Alumni - 6 Months' },
  { abbreviation: 'ESS', name: 'Effective Selling Skills' },
  { abbreviation: 'MSO', name: 'Managing Self & Others' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding workshop types...');

    // Clear existing workshop types to avoid duplicates if re-running
    // Optional: you might want to skip this or add more sophisticated update logic
    await WorkshopType.deleteMany({});
    console.log('Existing workshop types cleared.');

    if (workshopTypesToSeed.length === 0) {
      console.log(
        'No workshop types provided in workshopTypesToSeed array. Seeding skipped.'
      );
      return;
    }

    const insertedTypes = await WorkshopType.insertMany(workshopTypesToSeed);
    console.log(`${insertedTypes.length} workshop types seeded successfully!`);
  } catch (error) {
    console.error('Error seeding workshop types:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

// To run this seed script: node backend/src/config/seedWorkshopTypes.js
// Make sure to add this command to your package.json scripts if needed

seedDB();
