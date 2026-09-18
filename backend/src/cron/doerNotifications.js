const cron = require('node-cron');
const moment = require('moment');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const WorkshopTask = require('../models/WorkshopTask');
const Notification = require('../models/Notification');
const Workshop = require('../models/Workshop');
// Import io and connectedUsers for real-time notifications
const { getIo, getConnectedUsers } = require('../socket');
// const sendEmail = require('../services/sendMail');

// Cron job: 9 AM and 3 PM every day
cron.schedule('0 9,15 * * *', async () => {
  try {
    // Find the Doer role
    const doerRole = await Role.findOne({ name: 'Doer' });
    if (!doerRole) return;

    // Find all active employees with Doer role
    const doers = await Employee.find({ role: doerRole._id, isActive: true, isDeleted: false });
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'day');

    for (const doer of doers) {
      // Find ongoing workshops for this doer
      const doerTasks = await WorkshopTask.find({ doer: doer._id }).select('workshop');
      const workshopIds = [...new Set(doerTasks.map(t => t.workshop.toString()))];
      const ongoingWorkshopIds = (await Workshop.find({ _id: { $in: workshopIds }, status: 'Ongoing' }).select('_id')).map(w => w._id);
      const taskFilter = { doer: doer._id, workshop: { $in: ongoingWorkshopIds } };

      // Total active tasks
      const totalActiveTasks = await WorkshopTask.countDocuments({
        ...taskFilter,
        $or: [
          // Daily tasks: only count if endDate is today
          {
            frequency: 'Daily',
            endDate: { $gte: today.toDate(), $lt: tomorrow.toDate() },
            status: { $in: ['Pending', 'In Progress'] }
          },
          // Non-daily tasks: count as before
          {
            frequency: { $ne: 'Daily' },
            endDate: { $gte: today.toDate() },
            status: { $in: ['Pending', 'In Progress'] }
          }
        ]
      });

      // Total overdue tasks
      const totalOverdueTasks = await WorkshopTask.countDocuments({
        ...taskFilter,
        endDate: { $lt: today.toDate() },
        status: { $in: ['Pending', 'In Progress'] }
      });

      // Tasks assigned today
      const totalTodaysTasks = await WorkshopTask.countDocuments({
        ...taskFilter,
        endDate: { $gte: today.toDate(), $lt: tomorrow.toDate() },
        status: { $in: ['Pending', 'In Progress'] }
      });

      // Create notification message
      const message = `Task Summary:\nActive Tasks: ${totalActiveTasks}\nOverdue Tasks: ${totalOverdueTasks}\nTasks Assigned Today: ${totalTodaysTasks}`;

      // Create notification
      await Notification.create({
        user: doer._id,
        message
      });

      // // Send daily email notification
      // await sendEmail(
      //   doer.masterEmail,
      //   'Your Daily Task Summary',
      //   'daily-doer',
      //   {
      //     name: doer.name,
      //     totalActiveTasks,
      //     totalOverdueTasks,
      //     totalTodaysTasks,
      //     dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      //   }
      // );

      // Emit real-time notification if user is connected
      const connectedUsers = getConnectedUsers();
      const io = getIo();
      const socketId = connectedUsers[doer._id.toString()];
      if (socketId) {
        io.to(socketId).emit('notification', { message: "Daily Notification: Please check your inbox." });
      }
    }
    console.log(`[CRON] Doer notifications sent at ${moment().format('YYYY-MM-DD HH:mm')}`);
  } catch (err) {
    console.error('[CRON] Error sending doer notifications:', err);
  }
}); 