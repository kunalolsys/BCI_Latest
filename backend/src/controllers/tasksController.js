const WorkshopTask = require('../models/WorkshopTask');
const Workshop = require('../models/Workshop');
const moment = require('moment');
const Comment = require('../models/Comments');
const Employee = require('../models/Employee');
const { getIo, getConnectedUsers } = require('../socket');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * @desc    Get all tasks assigned to a doer
 * @route   GET /api/tasks/my-tasks
 * @access  Doer permission required
 */
exports.getMyTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = 'endDate' } = req.query;
    const doerId = req.user._id; // Get logged in user's ID

    // Build filter object
    const filter = { doer: doerId };
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }

    // Parse pagination params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Get total count for pagination
    const total = await WorkshopTask.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Fetch tasks with pagination and populate references
    const tasks = await WorkshopTask.find(filter)
      .populate('workshop', 'name status workshopId')
      .populate('department', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format response
    const formattedTasks = tasks.map(task => ({
      _id: task._id,
      narration: task.narration,
      status: task.status,
      endDate: task.endDate,
      isCritical: task.isCritical,
      checklist: task.checklist,
      workshop: {
        _id: task.workshop?._id,
        name: task.workshop?.name,
        status: task.workshop?.status,
        workshopId: task.workshop?.workshopId
      },
      department: task.department?.name
    }));

    return res.status(200).json({
      tasks: formattedTasks,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    });
  } catch (err) {
    console.error('Error fetching doer tasks:', err);
    return res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

/**
 * @desc    Get task details by ID
 * @route   GET /api/tasks/:taskId
 * @access  Doer permission required
 */
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const doerId = req.user._id;

    const task = await WorkshopTask.findOne({
      _id: taskId,
      doer: doerId
    })
      .populate('workshop', 'name status workshopId announcementDate eventDate')
      .populate('department', 'name')
      .lean();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Format response
    const formattedTask = {
      _id: task._id,
      narration: task.narration,
      status: task.status,
      endDate: task.endDate,
      isCritical: task.isCritical,
      checklist: task.checklist,
      workshop: {
        _id: task.workshop?._id,
        name: task.workshop?.name,
        status: task.workshop?.status,
        workshopId: task.workshop?.workshopId,
        announcementDate: task.workshop?.announcementDate,
        eventDate: task.workshop?.eventDate
      },
      department: task.department?.name
    };

    return res.status(200).json({ task: formattedTask });
  } catch (err) {
    console.error('Error fetching task details:', err);
    return res.status(500).json({ message: 'Failed to fetch task details' });
  }
};

/**
 * @desc    Update task status and checklist
 * @route   PUT /api/tasks/:taskId
 * @access  Doer permission required
 */
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, checklist } = req.body;
    // const doerId = req.user._id;

    // Find task and verify ownership
    const task = await WorkshopTask.findOne({
      _id: taskId,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify workshop is ongoing
    const workshop = await Workshop.findById(task.workshop);
    if (!workshop || workshop.status !== 'Ongoing') {
      return res.status(400).json({
        message: 'Can only update tasks for ongoing workshops'
      });
    }

    // Update task
    if (status) task.status = status;
    if (checklist) task.checklist = checklist;

    await task.save();

    // Populate and format response
    await task.populate([
      { path: 'workshop', select: 'name status workshopId announcementDate eventDate' },
      { path: 'department', select: 'name' }
    ]);

    const formattedTask = {
      _id: task._id,
      narration: task.narration,
      status: task.status,
      endDate: task.endDate,
      isCritical: task.isCritical,
      checklist: task.checklist,
      workshop: {
        _id: task.workshop?._id,
        name: task.workshop?.name,
        status: task.workshop?.status,
        workshopId: task.workshop?.workshopId,
        announcementDate: task.workshop?.announcementDate,
        eventDate: task.workshop?.eventDate
      },
      department: task.department?.name
    };

    return res.status(200).json({ task: formattedTask });
  } catch (err) {
    console.error('Error updating task:', err);
    return res.status(500).json({ message: 'Failed to update task' });
  }
};

/**
 * @desc    Get current tasks (active and overdue) for the logged-in user
 * @route   GET /api/tasks/current
 * @access  Doer/EA/PC/MD permission required
 */
exports.getCurrentTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role.name;
    // Optional ?type=active|overdue to fetch only one bucket. Omit to get both (back-compat).
    const { type } = req.query;
    const wantActive = type !== 'overdue';
    const wantOverdue = type !== 'active';
    let tasks = [];

    // Different logic based on user role
    if (userRole === 'Doer') {
      // For Doer: fetch tasks directly assigned to them
      tasks = await WorkshopTask.find({
        doer: userId,
        status: 'Pending'
      })
        .populate('workshop', 'name status workshopId announcementDate eventDate')
        .populate('department', 'name')
        .lean();
    } else if (['EA', 'PC'].includes(userRole)) {
      // For EA/PC: fetch tasks from their workshops
      const workshops = await Workshop.find({
        [userRole === 'EA' ? 'executiveAssistant' : 'processCoordinator']: userId,
        status: 'Ongoing'
      }).select('_id');
      
      const workshopIds = workshops.map(w => w._id);
      tasks = await WorkshopTask.find({
        workshop: { $in: workshopIds },
        status: 'Pending'
      })
        .populate('workshop', 'name status workshopId announcementDate eventDate')
        .populate('department', 'name')
        .lean();
    } else if (userRole === 'MD') {
      // For MD: fetch all pending tasks
      tasks = await WorkshopTask.find({
        status: 'Pending'
      })
        .populate('workshop', 'name status workshopId announcementDate eventDate')
        .populate('department', 'name')
        .lean();
    }

    // Populate doer
    for (const task of tasks) {
      if (task.doer && (!task.doer.name || !task.doer._id)) {
        const doerEmp = await Employee.findById(task.doer).select('name');
        task.doer = doerEmp ? { _id: doerEmp._id, name: doerEmp.name } : null;
      }
      // Populate PC and EA from the workshop
      if (task.workshop) {
        const ws = await Workshop.findById(task.workshop._id || task.workshop).select('processCoordinator executiveAssistant').populate('processCoordinator', 'name').populate('executiveAssistant', 'name');
        task.pc = ws && ws.processCoordinator ? { _id: ws.processCoordinator._id, name: ws.processCoordinator.name } : null;
        task.ea = ws && ws.executiveAssistant ? { _id: ws.executiveAssistant._id, name: ws.executiveAssistant.name } : null;
      } else {
        task.pc = null;
        task.ea = null;
      }
    }

    const today = moment().startOf('day');
    const activeTasks = [];
    const overdueTasks = [];

    for (const task of tasks) {
      // Only include tasks whose workshop status is 'Ongoing'
      if (!task.workshop || task.workshop.status !== 'Ongoing') continue;
      // Use endDate as the planned date
      if (!task.endDate) continue;
      const plannedDate = moment(task.endDate).startOf('day');
      // Calculate days to close/delayed
      const daysDiff = plannedDate.diff(today, 'days');
      const formattedTask = {
        ...task,
        taskId: task.taskId,
        workshopName: task.workshop?.name,
        endDate: task.endDate, // keep as Date
        daysToClose: daysDiff > 0 ? daysDiff : 0,
        daysDelayed: daysDiff < 0 ? Math.abs(daysDiff) : 0,
        department: task.department?.name
      };
      if (task.frequency === 'Daily') {
        if (plannedDate.isSame(today, 'day')) {
          if (wantActive) activeTasks.push(formattedTask);
        } else if (plannedDate.isBefore(today, 'day')) {
          if (wantOverdue) overdueTasks.push(formattedTask);
        }
        // Do not push future daily tasks
        continue;
      }
      // Non-daily tasks: keep existing logic
      if (daysDiff >= 0) {
        if (wantActive) activeTasks.push(formattedTask);
      } else {
        if (wantOverdue) overdueTasks.push(formattedTask);
      }
    }

    // For each task, add a 'comments' boolean field (only for the bucket(s) being returned)
    for (const task of activeTasks) {
      const commentCount = await Comment.countDocuments({ taskId: task._id });
      task.comments = commentCount > 0;
    }
    for (const task of overdueTasks) {
      const commentCount = await Comment.countDocuments({ taskId: task._id });
      task.comments = commentCount > 0;
    }

    const response = {};
    if (wantActive) response.activeTasks = activeTasks;
    if (wantOverdue) response.overdueTasks = overdueTasks;
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching current tasks:', err);
    return res.status(500).json({ message: 'Failed to fetch current tasks' });
  }
};

/**
 * @desc    Get completed tasks for the logged-in user
 * @route   GET /api/tasks/completed
 * @access  Doer/EA/PC/MD permission required
 */
exports.getCompletedTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role?.name || req.user.role;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const {
      workshop,
      doer,
      department,
      pc,
      ea,
      critical,
      documents,
      escalation,
      comments,
      naRemark,
      startDate,
      endDate
    } = req.query;

    // 1. Base Index Filter
    let queryFilter = { status: 'Completed' };

    // Role Security
    if (userRole === 'Doer') {
      queryFilter.doer = new mongoose.Types.ObjectId(userId);
    } else if (['EA', 'PC'].includes(userRole)) {
      const workshops = await Workshop.find({
        [userRole === 'EA' ? 'executiveAssistant' : 'processCoordinator']: userId
      }).select('_id').lean();

      queryFilter.workshop = { $in: workshops.map(w => w._id) };
    } else if (userRole !== 'MD') {
      return res.status(200).json({
        completedTasks: [],
        pagination: { totalTasks: 0, page, limit, totalPages: 0 }
      });
    }

    // Direct Field Filters (Uses Index)
    if (doer && doer !== 'all' && mongoose.Types.ObjectId.isValid(doer)) {
      queryFilter.doer = new mongoose.Types.ObjectId(doer);
    }

    if (department && department !== 'all' && mongoose.Types.ObjectId.isValid(department)) {
      queryFilter.department = new mongoose.Types.ObjectId(department);
    }

    if (critical && critical !== 'all') {
      queryFilter.isCritical = critical === 'Yes' || critical === 'true';
    }

    if (documents && documents !== 'all') {
      if (documents === 'Yes') {
        queryFilter['documents.0'] = { $exists: true };
      } else {
        queryFilter.$or = [{ documents: { $exists: false } }, { documents: { $size: 0 } }];
      }
    }

    if (escalation && escalation !== 'all') {
      queryFilter.escalationId = escalation === 'Yes' ? { $ne: null } : null;
    }

    if (naRemark && naRemark !== 'all') {
      if (naRemark === 'Yes') {
        queryFilter.NARemark = { $exists: true, $ne: '' };
      } else {
        queryFilter.$or = [{ NARemark: { $exists: false } }, { NARemark: null }, { NARemark: '' }];
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryFilter.endDate = { $gte: start, $lte: end };
    }

    // Direct Workshop/PC/EA Pre-Filtering
    if ((workshop && workshop !== 'all') || (pc && pc !== 'all') || (ea && ea !== 'all')) {
      let wsQuery = {};
      if (workshop && workshop !== 'all') wsQuery.workshopId = workshop;
      if (pc && pc !== 'all' && mongoose.Types.ObjectId.isValid(pc)) wsQuery.processCoordinator = new mongoose.Types.ObjectId(pc);
      if (ea && ea !== 'all' && mongoose.Types.ObjectId.isValid(ea)) wsQuery.executiveAssistant = new mongoose.Types.ObjectId(ea);

      const matchedWorkshops = await Workshop.find(wsQuery).select('_id').lean();
      const matchedWsIds = matchedWorkshops.map(w => w._id);

      if (queryFilter.workshop) {
        queryFilter.workshop.$in = queryFilter.workshop.$in.filter(id => 
          matchedWsIds.some(mId => mId.equals(id))
        );
      } else {
        queryFilter.workshop = { $in: matchedWsIds };
      }
    }

    // 2. Count Matching Tasks
    const totalTasks = await WorkshopTask.countDocuments(queryFilter);

    if (totalTasks === 0) {
      return res.status(200).json({
        completedTasks: [],
        pagination: { totalTasks: 0, page, limit, totalPages: 0 }
      });
    }

    // 3. Fast Paginated Fetch (Only 20 items loaded into memory)
    const rawTasks = await WorkshopTask.find(queryFilter)
      .sort({ completedOn: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'workshop',
        select: 'name status workshopId announcementDate eventDate processCoordinator executiveAssistant',
        populate: [
          { path: 'processCoordinator', select: 'name _id' },
          { path: 'executiveAssistant', select: 'name _id' }
        ]
      })
      .populate('doer', 'name _id')
      .populate('department', 'name _id')
      .lean();

    // 4. Batch Comments Check (Only for current page's 20 items)
    const taskIds = rawTasks.map(t => t._id);
    const commentCounts = await Comment.aggregate([
      { $match: { taskId: { $in: taskIds } } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);

    const commentSet = new Set(commentCounts.map(c => c._id.toString()));

    // Filter Comments in memory if filter applied
    let finalTasks = rawTasks.map(task => {
      const ws = task.workshop;
      const hasComment = commentSet.has(task._id.toString());

      return {
        ...task,
        taskId: task.taskId,
        doer: task.doer ? { _id: task.doer._id, name: task.doer.name } : null,
        pc: ws?.processCoordinator ? { _id: ws.processCoordinator._id, name: ws.processCoordinator.name } : null,
        ea: ws?.executiveAssistant ? { _id: ws.executiveAssistant._id, name: ws.executiveAssistant.name } : null,
        workshopName: ws?.name || null,
        plannedDate: task.endDate ? moment(task.endDate).format('YYYY-MM-DD') : null,
        department: task.department?.name || null,
        comments: hasComment
      };
    });

    if (comments && comments !== 'all') {
      const isYes = comments === 'Yes';
      finalTasks = finalTasks.filter(t => t.comments === isYes);
    }

    return res.status(200).json({
      completedTasks: finalTasks,
      pagination: {
        totalTasks,
        page,
        limit,
        totalPages: Math.ceil(totalTasks / limit) || 1
      }
    });

  } catch (err) {
    console.error('Error fetching completed tasks:', err);
    return res.status(500).json({ message: 'Failed to fetch completed tasks' });
  }
};

// Add a comment to a task
exports.addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { comment } = req.body;
        const employeeId = req.user._id; // Get employee ID from authenticated user

        // Validate input
        if (!comment || comment.trim() === '') {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        // Check if task exists
        const task = await WorkshopTask.findById(taskId).populate('workshop').populate('doer', 'name');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Get PC and EA from the workshop
        const workshop = await Workshop.findById(task.workshop._id).select('processCoordinator executiveAssistant');
        // Get Doer from the task
        const doerId = task.doer?._id?.toString();
        const pcId = workshop?.processCoordinator?.toString();
        const eaId = workshop?.executiveAssistant?.toString();
        // Exclude the commenter
        const originUserId = employeeId.toString();
        const recipients = [doerId, pcId, eaId].filter(uid => uid && uid !== originUserId);
        // Notification content
        const notifMsg = `Task: ${task.taskId}\nComment: ${comment.trim()}\nBy: ${req.user.name || req.user.email}`;
        // Send notification to each recipient
        const uniqueRecipients = [...new Set(recipients)];
        for (const userId of uniqueRecipients) {
            await require('../models/Notification').create({
                user: userId,
                message: notifMsg,
                type: 'comment',
                taskId: taskId
            });
            // Emit real-time notification if user is connected
            const connectedUsers = getConnectedUsers();
            const io = getIo();
            const socketId = connectedUsers[userId];
            if (socketId) {
                io.to(socketId).emit('notification', { message: "Comment Added: Please check your inbox.", type: 'comment' });
            }
        }
        // Create new comment
        const newComment = new Comment({
            taskId,
            employeeId,
            comment: comment.trim()
        });
        await newComment.save();
        // Populate employee details for response
        await newComment.populate({
            path: 'employeeId',
            select: 'firstName lastName email' // Only select necessary fields
        });
        res.status(201).json({
            message: 'Comment added successfully',
            comment: newComment
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

// Get all comments for a task
exports.getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Check if task exists
        const task = await WorkshopTask.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Get comments with employee details
        const comments = await Comment.find({ taskId })
            .populate({
                path: 'employeeId',
                select: 'name' // Only select necessary fields
            })
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json({
            message: 'Comments retrieved successfully',
            comments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

/**
 * @desc    Fetch unread notifications for the logged-in user (type: comment, document, escalation)
 * @route   GET /api/tasks/unread-notifications
 * @access  Authenticated users
 */
exports.fetchUnreadNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    // Only fetch notifications of type comment, document, escalation and unread
    const notifications = await Notification.find({
      user: userId,
      read: false,
      type: { $in: ['comment', 'document', 'escalation'] }
    }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (err) {
    console.error('Error fetching unread notifications:', err);
    res.status(500).json({ message: 'Failed to fetch unread notifications' });
  }
};

/**
 * @desc    Mark a notification as read by its ID
 * @route   PATCH /api/tasks/notification/:notificationId/read
 * @access  Authenticated users
 */
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json({ notification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}; 