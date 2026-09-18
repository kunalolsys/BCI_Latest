const WorkshopTask = require('../models/WorkshopTask');
const Workshop = require('../models/Workshop');

/**
 * @desc    Get task count for a doer
 * @route   GET /api/doers/:doerId/task-count
 * @access  Plan & Launch permission required
 */
exports.getDoerTaskCount = async (req, res) => {
  try {
    const { doerId } = req.params;

    // Get task count and details for the doer
    const doerTasks = await WorkshopTask.find({
      doer: doerId,
      status: { $ne: 'completed' }
    })
    .populate('workshop', 'name status')
    .select('_id narration status endDate workshop');

    const tasksWithWorkshop = doerTasks.map(task => ({
      taskId: task._id,
      narration: task.narration,
      status: task.status,
      dueDate: task.endDate,
      workshop: {
        name: task.workshop?.name || 'Unknown',
        status: task.workshop?.status || 'Unknown'
      }
    }));

    return res.status(200).json({
      doerId,
      totalTasks: doerTasks.length,
      tasks: tasksWithWorkshop
    });
  } catch (err) {
    console.error('Error fetching doer task count:', err);
    return res.status(500).json({ message: 'Failed to fetch doer task count' });
  }
}; 