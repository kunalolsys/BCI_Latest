const cron = require('node-cron');
const moment = require('moment');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Workshop = require('../models/Workshop');
const WorkshopTask = require('../models/WorkshopTask');
const Notification = require('../models/Notification');
const { getIo, getConnectedUsers } = require('../socket');
// const sendEmail = require('../services/sendMail');

// Cron job: 9 AM every day
cron.schedule('0 9 * * *', async () => {
  try {
    // Find the EA and PC roles
    const eaRole = await Role.findOne({ name: 'EA' });
    const pcRole = await Role.findOne({ name: 'PC' });
    if (!eaRole && !pcRole) return;

    // Find all active EAs and PCs
    const eas = eaRole ? await Employee.find({ role: eaRole._id, isActive: true, isDeleted: false }) : [];
    const pcs = pcRole ? await Employee.find({ role: pcRole._id, isActive: true, isDeleted: false }) : [];
    const users = [...eas, ...pcs];
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'day');

    for (const user of users) {
      // Find all ongoing workshops for this EA/PC
      const workshopFilter = user.role.equals(eaRole._id)
        ? { executiveAssistant: user._id, status: 'Ongoing' }
        : { processCoordinator: user._id, status: 'Ongoing' };
      const ongoingWorkshopIds = (await Workshop.find(workshopFilter).select('_id')).map(w => w._id);
      const taskFilter = { workshop: { $in: ongoingWorkshopIds } };

      // Total active tasks
      const totalActiveTasks = await WorkshopTask.countDocuments({
        ...taskFilter,
        $or: [
          { frequency: 'Daily', endDate: { $gte: today.toDate(), $lt: tomorrow.toDate() }, status: { $in: ['Pending', 'In Progress'] } },
          { frequency: { $ne: 'Daily' }, endDate: { $gte: today.toDate() }, status: { $in: ['Pending', 'In Progress'] } }
        ]
      });
      // Total completed tasks
      const totalCompletedTasks = await WorkshopTask.countDocuments({
        ...taskFilter,
        status: 'Completed'
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
      const message = `Task Summary:\nActive Tasks: ${totalActiveTasks}\nCompleted Tasks: ${totalCompletedTasks}\nOverdue Tasks: ${totalOverdueTasks}\nTasks Assigned Today: ${totalTodaysTasks}`;

      // Create notification
      await Notification.create({
        user: user._id,
        message
      });
      // Send daily email notification
      // await sendEmail(
      //   user.masterEmail,
      //   'Your Daily Task Summary',
      //   'daily-eapc',
      //   {
      //     name: user.name,
      //     totalActiveTasks,
      //     totalCompletedTasks,
      //     totalOverdueTasks,
      //     totalTodaysTasks,
      //     dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      //   }
      // );

      // Emit real-time notification if user is connected
      const connectedUsers = getConnectedUsers();
      const io = getIo();
      const socketId = connectedUsers[user._id.toString()];
      if (socketId) {
        io.to(socketId).emit('notification', { message : "Daily Notification: Please check your inbox."});
      }
    }
    console.log(`[CRON] EA/PC notifications sent at ${moment().format('YYYY-MM-DD HH:mm')}`);
  } catch (err) {
    console.error('[CRON] Error sending EA/PC notifications:', err);
  }
}); 