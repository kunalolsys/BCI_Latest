const Workshop = require('../models/Workshop');
const WorkshopTask = require('../models/WorkshopTask');
const Escalation = require('../models/Escalation');
const Comment = require('../models/Comments');
const moment = require('moment');

/**
 * @desc    Get dashboard data for the logged-in user
 * @route   GET /api/dashboard
 * @access  Authenticated (role-based logic inside)
 */
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role.name;
    const allowedRoles = ['Doer', 'EA', 'PC', 'MD'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message:
          'Access denied: Dashboard data is only available for Doer, EA, PC, and MD roles.',
      });
    }
    const today = moment().startOf('day');

    let workshopFilter = {};
    let taskFilter = {};
    let escalationTaskIds = [];
    let ongoingWorkshopIds = [];

    if (userRole === 'Doer') {
      // Workshops: any workshop with a task assigned to this doer
      const doerTasks = await WorkshopTask.find({ doer: userId }).select(
        'workshop'
      );
      const workshopIds = [
        ...new Set(doerTasks.map((t) => t.workshop.toString())),
      ];
      // Only include Ongoing workshops
      ongoingWorkshopIds = (
        await Workshop.find({
          _id: { $in: workshopIds },
          status: 'Ongoing',
        }).select('_id')
      ).map((w) => w._id);
      workshopFilter = { _id: { $in: ongoingWorkshopIds } };
      taskFilter = { doer: userId, workshop: { $in: ongoingWorkshopIds } };
    } else if (userRole === 'EA') {
      // Workshops: assigned as EA
      workshopFilter = { executiveAssistant: userId, status: 'Ongoing' };
      ongoingWorkshopIds = (
        await Workshop.find(workshopFilter).select('_id')
      ).map((w) => w._id);
      taskFilter = { workshop: { $in: ongoingWorkshopIds } };
    } else if (userRole === 'PC') {
      // Workshops: assigned as PC
      workshopFilter = { processCoordinator: userId, status: 'Ongoing' };
      ongoingWorkshopIds = (
        await Workshop.find(workshopFilter).select('_id')
      ).map((w) => w._id);
      taskFilter = { workshop: { $in: ongoingWorkshopIds } };
    } else if (userRole === 'MD') {
      // All ongoing workshops/tasks
      workshopFilter = { status: 'Ongoing' };
      ongoingWorkshopIds = (
        await Workshop.find(workshopFilter).select('_id')
      ).map((w) => w._id);
      taskFilter = { workshop: { $in: ongoingWorkshopIds } };
    }

    // 1. Total workshops assigned
    const totalWorkshops = await Workshop.countDocuments(workshopFilter);
    // 2. Total tasks assigned
    const totalTasks = await WorkshopTask.countDocuments(taskFilter);
    // 3. Total completed tasks
    const totalCompletedTasks = await WorkshopTask.countDocuments({
      ...taskFilter,
      status: 'Completed',
    });
    // 4. Total active tasks (endDate >= today, not completed/cancelled)
    const totalActiveTasks = await WorkshopTask.countDocuments({
      ...taskFilter,
      $or: [
        // Daily tasks: only count if endDate is today
        {
          frequency: 'Daily',
          endDate: {
            $gte: today.toDate(),
            $lt: moment(today).add(1, 'day').toDate(),
          },
          status: { $in: ['Pending', 'In Progress'] },
        },
        // Non-daily tasks: count as before
        {
          frequency: { $ne: 'Daily' },
          endDate: { $gte: today.toDate() },
          status: { $in: ['Pending', 'In Progress'] },
        },
      ],
    });
    // 5. Total overdue tasks (endDate < today, not completed/cancelled)
    const totalOverdueTasks = await WorkshopTask.countDocuments({
      ...taskFilter,
      endDate: { $lt: today.toDate() },
      status: { $in: ['Pending', 'In Progress'] },
    });
    // 6. Today's tasks (endDate == today)
    const totalTodaysTasks = await WorkshopTask.countDocuments({
      ...taskFilter,
      endDate: {
        $gte: today.toDate(),
        $lt: moment(today).add(1, 'day').toDate(),
      },
      status: { $in: ['Pending', 'In Progress'] },
    });
    // 7. Escalations (tasks associated with user, only for pending tasks)
    let totalEscalations = 0;
    let pendingTaskIds = (
      await WorkshopTask.find({ ...taskFilter, status: 'Pending' }).select(
        '_id'
      )
    ).map((t) => t._id);
    if (userRole === 'Doer') {
      // Escalations for pending tasks assigned to this doer
      totalEscalations = await Escalation.countDocuments({
        taskId: { $in: pendingTaskIds },
      });
    } else if (userRole === 'EA' || userRole === 'PC' || userRole === 'MD') {
      totalEscalations = await Escalation.countDocuments({
        taskId: { $in: pendingTaskIds },
      });
    }

    // 8. LateTasksMarked: completed tasks where completedOn > endDate
    const totalLateTasksMarked = await WorkshopTask.countDocuments({
      ...taskFilter,
      status: 'Completed',
      $expr: { $gt: ['$completedOn', '$endDate'] },
    });
    // 9. Critical Overdue tasks (not for Doer)
    let totalCriticalOverdueTasks = 0;
    if (userRole !== 'Doer') {
      totalCriticalOverdueTasks = await WorkshopTask.countDocuments({
        ...taskFilter,
        isCritical: true,
        endDate: { $lt: today.toDate() },
        status: { $in: ['Pending', 'In Progress'] },
      });
    }

    // 10. Total pending tasks with comments
    const totalPendingTasksWithComments = await Comment.distinct('taskId', {
      taskId: { $in: pendingTaskIds },
    }).then((ids) => ids.length);

    // 11. Total pending tasks with documents uploaded
    // Count pending tasks with non-empty documents array in WorkshopTask
    let totalPendingTasksWithDocuments = await WorkshopTask.countDocuments({
      _id: { $in: pendingTaskIds },
      documents: { $exists: true, $not: { $size: 0 } },
    });

    return res.json({
      totalWorkshops,
      totalTasks,
      totalCompletedTasks,
      totalActiveTasks,
      totalOverdueTasks,
      totalTodaysTasks,
      totalEscalations,
      totalLateTasksMarked,
      totalCriticalOverdueTasks,
      totalPendingTasksWithComments,
      totalPendingTasksWithDocuments,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};
