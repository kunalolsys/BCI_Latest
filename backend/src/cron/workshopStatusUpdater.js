const cron = require('node-cron');
const Workshop = require('../models/Workshop');

/**
 * Updates workshop statuses based on announcement date
 * Runs every day at midnight
 * Only changes status to 'live' when announcement date is reached
 * Completion status must be set manually by user
 */
const updateWorkshopStatuses = async () => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Update workshops that should be live (only when announcement date is reached)
    await Workshop.updateMany(
      {
        status: 'Upcoming',
        announcementDate: { $lte: today }
      },
      {
        $set: { status: 'Ongoing' }
      }
    );

    console.log('Workshop statuses updated successfully');
  } catch (error) {
    console.error('Error updating workshop statuses:', error);
  }
};

// Schedule the job to run at midnight every day
const scheduleWorkshopStatusUpdates = () => {
  cron.schedule('0 0 * * *', () => {
    console.log('Running workshop status update job...');
    updateWorkshopStatuses();
  });
};

module.exports = scheduleWorkshopStatusUpdates; 
//checking branch