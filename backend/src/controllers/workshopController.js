const Workshop = require('../models/Workshop');
const WorkshopTemplate = require('../models/WorkshopTemplate');
const WorkshopTemplateTask = require('../models/WorkshopTemplateTask');
const DepartmentalTemplateTask = require('../models/DepartmentalTemplateTask');
const WorkshopTask = require('../models/WorkshopTask');
const Holiday = require('../models/Holiday');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const mongoose = require('mongoose');

/**
 * Helper function to get dates between two dates
 */
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  while (currentDate <= lastDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Helper function to check if a date is a holiday or Sunday
 * @param {Date} date - The date to check
 * @param {Array} holidays - Array of holiday dates
 * @returns {boolean} - True if the date is a holiday or Sunday
 */
const isHolidayOrSunday = (date, holidays) => {
  // Check if it's Sunday (0 is Sunday in getDay())
  if (date.getDay() === 0) {
    return true;
  }

  // Check if it's a holiday
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(holiday => 
    new Date(holiday.date).toISOString().split('T')[0] === dateStr
  );
};

/**
 * @desc    Initialize a workshop from template
 * @route   POST /api/workshop/plan
 * @access  Plan & Launch permission required
 */
exports.initializeWorkshop = async (req, res) => {
  let workshop = null;
  
  try {
    console.log("Received payload:", JSON.stringify(req.body, null, 2));
    
    const {
      templateId,
      announcementDate,
      eventDate,
      type,
      location,
      venue,
      code,
      processCoordinator,
      executiveAssistant,
      taskDoers // Map of taskId to doerId
    } = req.body;

    // Ensure all required fields are present
    if (!templateId || !announcementDate || !eventDate || !type) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['templateId', 'announcementDate', 'eventDate', 'type']
      });
    }
    if ((type === 'Offline' || type === 'Hybrid') && !location) {
      return res.status(400).json({
        message: 'Location is required for Offline and Hybrid workshops',
        required: ['location']
      });
    }

    // Parse dates
    // console.log("Parsing dates:", { announcementDate, eventDate });
    
    // Ensure consistent date format
    const prepDate = new Date(announcementDate + 'T00:00:00Z');
    const evtDate = new Date(eventDate + 'T00:00:00Z');
    const today = new Date();
    
    console.log("Parsed dates:", { 
      prepDate: prepDate.toISOString(), 
      evtDate: evtDate.toISOString(),
      isValidPrepDate: !isNaN(prepDate.getTime()),
      isValidEventDate: !isNaN(evtDate.getTime())
    });

    // Validate dates are valid
    if (isNaN(prepDate.getTime()) || isNaN(evtDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    // Validate prep date is today or in the future
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const prepDateStart = new Date(prepDate);
    prepDateStart.setHours(0, 0, 0, 0);
    
    if (prepDateStart < todayStart) {
      return res.status(400).json({
        message: 'Announcement date cannot be in the past'
      });
    }

    // Validate event date is after prep date
    if (evtDate <= prepDate) {
      return res.status(400).json({
        message: 'Event date must be after announcement date'
      });
    }

    // Get template
    const template = await WorkshopTemplate.findById(templateId).populate('workshopName');
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    const workshopType = template.workshopName;
    if (!workshopType || !workshopType.abbreviation) {
      return res.status(400).json({ message: 'Workshop type abbreviation not found in template.' });
    }

    const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
    if (normalizedCode && !/^[A-Z0-9]+$/.test(normalizedCode)) {
      return res.status(400).json({ message: 'Code must be alphanumeric' });
    }
    if (normalizedCode.length > 5) {
      return res.status(400).json({ message: 'Code cannot exceed 5 characters' });
    }

    // Determine initial status based on dates
    let status = 'Upcoming';
    
    if (prepDateStart <= todayStart) {
      status = 'Ongoing';
    }

    // Generate workshopId
    const typeAbbr = workshopType.abbreviation;
    const locAbbr = (type === 'Online') ? 'ONL' : (location || '').slice(0, 3).toUpperCase();
    const day = String(evtDate.getDate()).padStart(2, '0');
    const month = evtDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = evtDate.getFullYear();
    const workshopId = `${typeAbbr}-${locAbbr}-${day}-${month}-${year}${normalizedCode ? `-${normalizedCode}` : ''}`;
    
    // Check for uniqueness
    const existingWorkshop = await Workshop.findOne({ workshopId });
    if (existingWorkshop) {
      return res.status(400).json({ 
        message: `Workshop ID ${workshopId} already exists. Please choose a different date or location.` 
      });
    }

    // Get all holidays for date checking
    const holidays = await Holiday.find({}, { date: 1 });

    // Get individual and departmental template tasks BEFORE creating workshop
    const [templateTasks, departmentalTemplateTasks] = await Promise.all([
      WorkshopTemplateTask.find({ workshopTemplate: templateId })
        .populate('department', 'name')
        .populate('doer', 'name email'),
      DepartmentalTemplateTask.find({ workshopTemplate: templateId })
        .populate('department', 'name')
    ]);

    if (templateTasks.length === 0 && departmentalTemplateTasks.length === 0) {
      return res.status(400).json({ message: 'Template has no tasks' });
    }

    // Validate that no individually-selected doer is soft-deleted
    const doerIds = templateTasks
      .map(task => {
        const override = taskDoers && taskDoers[task._id.toString()];
        return override || (task.doer ? task.doer._id || task.doer : null);
      })
      .filter(Boolean);

    const uniqueDoerIds = [...new Set(doerIds.map(id => id.toString()))];

    if (uniqueDoerIds.length > 0) {
      const deletedDoers = await Employee.find({
        _id: { $in: uniqueDoerIds },
        isDeleted: true
      }).select('name email');

      if (deletedDoers.length > 0) {
        const names = deletedDoers.map(e => e.name).join(', ');
        return res.status(400).json({
          message: `Workshop cannot be initialized. The following assigned doers no longer exist: ${names}. Please assign doers to those tasks.`
        });
      }
    }

    // Validate minimum gap for T-X frequency across both task types
    const allTemplateTasks = [...templateTasks, ...departmentalTemplateTasks];
    const tasksWithTMinus = allTemplateTasks.filter(task => task.frequency === 'T-X');
    if (tasksWithTMinus.length > 0) {
      const maxDuration = Math.max(...tasksWithTMinus.map(task => task.duration || 0));
      const daysBetween = Math.ceil((evtDate - prepDate) / (1000 * 60 * 60 * 24));

      if (daysBetween < maxDuration) {
        return res.status(400).json({
          message: `Event date must be at least ${maxDuration} days after announcement date due to task timings`
        });
      }
    }

    // Create workshop
    workshop = new Workshop({
      workshopId,
      workshopTemplate: templateId,
      announcementDate: prepDate,
      eventDate: evtDate,
      type: type,
      location,
      venue,
      code: normalizedCode || undefined,
      processCoordinator: processCoordinator || template.processCoordinator,
      executiveAssistant: executiveAssistant || template.executiveAssistant,
      status
    });

    // Save workshop
    await workshop.save();

    // Create workshop tasks with unique task IDs
    const createdTasks = [];
    let taskCounter = 1;
    let dailyTaskSubCounter = 1; // Counter for daily task sub-IDs

    console.log('Starting task creation with template tasks:', templateTasks.map(t => ({
      frequency: t.frequency,
      narration: t.narration
    })));

    try {
      for (const templateTask of templateTasks) {
        console.log(`Processing task with frequency: ${templateTask.frequency}`);
        
        // Format checklist items to match the schema
        const formattedChecklist = (templateTask.checklist || []).map(item => ({
          item: typeof item === 'string' ? item : item.item,
          checked: false
        }));
        
        if (templateTask.frequency === 'Daily') {
          // For daily tasks, create one task per day between day after prep date and event date
          const dayAfterPrepDate = new Date(prepDate);
          dayAfterPrepDate.setDate(dayAfterPrepDate.getDate() + 1);
          const dates = getDatesBetween(dayAfterPrepDate, evtDate);
          console.log(`Creating daily tasks for dates:`, dates.map(d => d.toISOString()));
          
          // Reset sub-counter for each new daily task
          dailyTaskSubCounter = 1;
          const baseTaskId = `${workshopId}-T-${String(taskCounter).padStart(4, '0')}`;
          console.log(`Base task ID for daily task: ${baseTaskId}`);
          
          for (const date of dates) {
            // Skip if the date is a holiday or Sunday
            if (isHolidayOrSunday(date, holidays)) {
              console.log(`Skipping task creation for ${date.toISOString()} as it's a holiday or Sunday`);
              continue;
            }

            const taskId = `${baseTaskId}/${String(dailyTaskSubCounter).padStart(4, '0')}`;
            console.log(`Creating daily task with ID: ${taskId}`);
            dailyTaskSubCounter++;
            
            const task = new WorkshopTask({
              taskId,
              workshop: workshop._id,
              workshopTemplateTask: templateTask._id,
              narration: templateTask.narration,
              department: templateTask.department,
              frequency: templateTask.frequency,
              duration: templateTask.duration,
              isCritical: templateTask.isCritical,
              checklist: formattedChecklist,
              doer: taskDoers[templateTask._id] || templateTask.doer,
              status: 'Pending',
              endDate: date // For daily tasks, end date is the specific day
            });

            await task.save();
            createdTasks.push(task);
          }
          // Increment task counter after all daily tasks are created
          taskCounter++;
          console.log(`Completed daily task group. New task counter: ${taskCounter}`);
        } else {
          // For non-daily tasks, create a single task
          const taskId = `${workshopId}-T-${String(taskCounter).padStart(4, '0')}`;
          console.log(`Creating non-daily task with ID: ${taskId}`);
          taskCounter++;

          let endDate;
          
          switch (templateTask.frequency) {
            case 'From Announcement Date':
              endDate = new Date(prepDate.getTime() + templateTask.duration * 24 * 60 * 60 * 1000);
              break;
            case 'T+X':
              endDate = new Date(evtDate.getTime() + templateTask.duration * 24 * 60 * 60 * 1000);
              break;
            case 'T-X':
              endDate = new Date(evtDate.getTime() - templateTask.duration * 24 * 60 * 60 * 1000);
              break;
            case 'Event Date':
              endDate = evtDate;
              break;
          }

          const task = new WorkshopTask({
            taskId,
            workshop: workshop._id,
            workshopTemplateTask: templateTask._id,
            narration: templateTask.narration,
            department: templateTask.department,
            frequency: templateTask.frequency,
            duration: templateTask.duration,
            isCritical: templateTask.isCritical,
            checklist: formattedChecklist,
            doer: taskDoers[templateTask._id] || templateTask.doer,
            status: 'Pending',
            endDate
          });

          await task.save();
          createdTasks.push(task);
        }
      }

      // ── Departmental tasks ────────────────────────────────────────────────
      // Departmental tasks are only assigned to employees whose role is "Doer"
      const doerRole = await Role.findOne({ name: 'Doer' }).select('_id');

      for (const deptTask of departmentalTemplateTasks) {
        const formattedChecklist = (deptTask.checklist || []).map(item => ({
          item: typeof item === 'string' ? item : item.item,
          checked: false
        }));

        // Fetch all active, non-deleted, Doer-role employees in this department
        const deptEmployees = doerRole
          ? await Employee.find({
              departments: deptTask.department._id,
              isActive: true,
              isDeleted: false,
              role: doerRole._id
            }).select('_id')
          : [];

        if (deptEmployees.length === 0) {
          console.log(`No active Doer-role employees in department ${deptTask.department._id}, skipping departmental task.`);
          taskCounter++;
          continue;
        }

        const baseCounter = taskCounter;
        taskCounter++;

        if (deptTask.frequency === 'Daily') {
          const dayAfterPrepDate = new Date(prepDate);
          dayAfterPrepDate.setDate(dayAfterPrepDate.getDate() + 1);
          const dates = getDatesBetween(dayAfterPrepDate, evtDate);

          for (let empIdx = 0; empIdx < deptEmployees.length; empIdx++) {
            const employee = deptEmployees[empIdx];
            const empNumber = empIdx + 1;
            const baseTaskId = `${workshopId}-T-${String(baseCounter).padStart(4, '0')}-D-${empNumber}`;

            let daySubCounter = 1;
            for (const date of dates) {
              if (isHolidayOrSunday(date, holidays)) continue;

              const taskId = `${baseTaskId}/${String(daySubCounter).padStart(4, '0')}`;
              daySubCounter++;

              const task = new WorkshopTask({
                taskId,
                workshop: workshop._id,
                departmentalTemplateTask: deptTask._id,
                narration: deptTask.narration,
                department: deptTask.department,
                frequency: deptTask.frequency,
                duration: deptTask.duration,
                isCritical: deptTask.isCritical,
                checklist: formattedChecklist,
                doer: employee._id,
                status: 'Pending',
                endDate: date
              });

              await task.save();
              createdTasks.push(task);
            }
          }
        } else {
          let endDate;
          switch (deptTask.frequency) {
            case 'From Announcement Date':
              endDate = new Date(prepDate.getTime() + deptTask.duration * 24 * 60 * 60 * 1000);
              break;
            case 'T+X':
              endDate = new Date(evtDate.getTime() + deptTask.duration * 24 * 60 * 60 * 1000);
              break;
            case 'T-X':
              endDate = new Date(evtDate.getTime() - deptTask.duration * 24 * 60 * 60 * 1000);
              break;
            case 'Event Date':
              endDate = evtDate;
              break;
          }

          for (let empIdx = 0; empIdx < deptEmployees.length; empIdx++) {
            const employee = deptEmployees[empIdx];
            const empNumber = empIdx + 1;
            const taskId = `${workshopId}-T-${String(baseCounter).padStart(4, '0')}-D-${empNumber}`;

            const task = new WorkshopTask({
              taskId,
              workshop: workshop._id,
              departmentalTemplateTask: deptTask._id,
              narration: deptTask.narration,
              department: deptTask.department,
              frequency: deptTask.frequency,
              duration: deptTask.duration,
              isCritical: deptTask.isCritical,
              checklist: formattedChecklist,
              doer: employee._id,
              status: 'Pending',
              endDate
            });

            await task.save();
            createdTasks.push(task);
          }
        }
      }

      console.log('Final created tasks:', createdTasks.map(t => ({
        taskId: t.taskId,
        frequency: t.frequency,
        narration: t.narration
      })));

      // Get updated workshop with populated fields
      await workshop.populate([
        { path: 'workshopTemplate', select: 'name' },
        { path: 'processCoordinator', select: 'name email' },
        { path: 'executiveAssistant', select: 'name email' }
      ]);

      return res.status(201).json({
        workshop: {
          ...workshop.toObject(),
          tasks: createdTasks
        }
      });

    } catch (taskError) {
      // If task creation fails, delete the workshop and throw the error
      console.error('Error creating tasks, rolling back workshop creation:', taskError);
      if (workshop && workshop._id) {
        await Workshop.findByIdAndDelete(workshop._id);
        console.log('Workshop deleted due to task creation failure');
      }
      throw taskError; // Re-throw to be caught by outer catch block
    }
    
  } catch (err) {
    console.error('Error initializing workshop:', err);
    return res.status(500).json({ message: 'Failed to initialize workshop' });
  }
};

/**
 * @desc    Get workshop details
 * @route   GET /api/workshop/:id
 * @access  Plan & Launch permission required
 */
exports.getWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id)
      .populate('workshopTemplate', 'name')
      .populate('processCoordinator', 'name email')
      .populate('executiveAssistant', 'name email');

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const tasks = await WorkshopTask.find({ workshop: id })
      .populate('department', 'name')
      .populate('doer', 'name email');

    return res.status(200).json({
      workshop: {
        ...workshop.toObject(),
        tasks
      }
    });
  } catch (err) {
    console.error('Error fetching workshop:', err);
    return res.status(500).json({ message: 'Failed to fetch workshop' });
  }
};

/**
 * @desc    Update workshop details (only allowed fields)
 * @route   PUT /api/workshop/:id
 * @access  Plan & Launch permission required
 */
exports.updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const { processCoordinator, executiveAssistant, taskDoers, venue } = req.body;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Only allow updates if workshop is in upcoming or ongoing status
    if (!['Upcoming', 'Ongoing'].includes(workshop.status)) {
      return res.status(400).json({
        message: 'Cannot update workshop in current status'
      });
    }

    // Update workshop fields
    if (processCoordinator) workshop.processCoordinator = processCoordinator;
    if (executiveAssistant) workshop.executiveAssistant = executiveAssistant;
    if (venue !== undefined) workshop.venue = venue; // Allow empty string to clear venue

    await workshop.save();

    // Update task doers if provided
    if (taskDoers && Object.keys(taskDoers).length > 0) {
      if (workshop.status === 'Ongoing') {
        // For ongoing workshops, only allow updating incomplete tasks
        const tasks = await WorkshopTask.find({ workshop: id });
        const completedTaskIds = tasks
          .filter(task => task.status === 'Completed')
          .map(task => task._id.toString());

        console.log('All Tasks:', tasks.map(t => ({ id: t._id, status: t.status })));
        console.log('Completed Task IDs:', completedTaskIds);
        console.log('Attempting to update tasks:', Object.keys(taskDoers));

        // Check if any completed tasks are being modified
        const attemptedCompletedTaskUpdate = Object.keys(taskDoers).some(
          taskId => completedTaskIds.includes(taskId)
        );

        if (attemptedCompletedTaskUpdate) {
          return res.status(400).json({
            message: 'Cannot update doers for completed tasks in ongoing workshops'
          });
        }
      }

      // Update the tasks
      const updatePromises = Object.entries(taskDoers).map(([taskId, doerId]) =>
        WorkshopTask.findOneAndUpdate(
          { _id: taskId, workshop: id },
          { doer: doerId },
          { new: true }
        )
      );

      await Promise.all(updatePromises);
    }

    // Get updated workshop with populated fields
    await workshop.populate([
      { path: 'workshopTemplate', select: 'name' },
      { path: 'processCoordinator', select: 'name email' },
      { path: 'executiveAssistant', select: 'name email' }
    ]);

    const tasks = await WorkshopTask.find({ workshop: id })
      .populate('department', 'name')
      .populate('doer', 'name email');

    return res.status(200).json({
      workshop: {
        ...workshop.toObject(),
        tasks
      }
    });
  } catch (err) {
    console.error('Error updating workshop:', err);
    return res.status(500).json({ message: 'Failed to update workshop' });
  }
};

/**
 * @desc    Delete workshop and its tasks
 * @route   DELETE /api/workshop/:id
 * @access  Plan & Launch permission required
 */
exports.deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Only allow deletion of upcoming or stopped workshops
    const status = workshop.status ? workshop.status.toLowerCase() : '';
    if (!['upcoming', 'stopped'].includes(status)) {
      return res.status(400).json({
        message: 'Only upcoming or stopped workshops can be deleted'
      });
    }

    // Delete all tasks associated with the workshop
    await WorkshopTask.deleteMany({ workshop: id });

    // Delete the workshop
    await workshop.deleteOne();

    return res.status(200).json({
      message: 'Workshop and associated tasks deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting workshop:', err);
    return res.status(500).json({ message: 'Failed to delete workshop' });
  }
};

/**
 * @desc    Stop workshop and delete all tasks
 * @route   PUT /api/workshop/:id/stop
 * @access  Plan & Launch permission required
 */
exports.stopWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    if (workshop.status !== 'Ongoing') {
      return res.status(400).json({ message: 'Only ongoing workshops can be stopped' });
    }

    // Delete all tasks associated with the workshop
    await WorkshopTask.deleteMany({ workshop: workshop._id });

    // Update workshop status to Stopped and set endDate
    workshop.status = 'Stopped';
    workshop.endDate = new Date();
    await workshop.save({ validateBeforeSave: false });

    // Get updated workshop with populated fields
    await workshop.populate([
      { path: 'workshopTemplate', select: 'name' },
      { path: 'processCoordinator', select: 'name email' },
      { path: 'executiveAssistant', select: 'name email' }
    ]);

    res.json({
      message: 'Workshop stopped successfully',
      workshop: {
        ...workshop.toObject(),
        tasks: [] // Return empty tasks array since all tasks are deleted
      }
    });
  } catch (error) {
    console.error('Error stopping workshop:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Complete workshop
 * @route   PUT /api/workshop/:id/complete
 * @access  Plan & Launch permission required
 */
exports.completeWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Only allow completion if workshop is ongoing
    if (workshop.status !== 'Ongoing') {
      return res.status(400).json({
        message: 'Only ongoing workshops can be marked as completed'
      });
    }

    // Check if all tasks are completed
    const pendingTasks = await WorkshopTask.find({
      workshop: id,
      status: { $ne: 'Completed' }
    });

    if (pendingTasks.length > 0) {
      return res.status(400).json({
        message: 'Cannot complete workshop with pending tasks',
        pendingTaskIds: pendingTasks.map(task => task._id)
      });
    }

    // Update workshop status to completed and set endDate
    workshop.status = 'Completed';
    workshop.endDate = new Date();
    await workshop.save();

    // Get updated workshop with populated fields
    await workshop.populate([
      { path: 'workshopTemplate', select: 'name' },
      { path: 'processCoordinator', select: 'name email' },
      { path: 'executiveAssistant', select: 'name email' }
    ]);

    const tasks = await WorkshopTask.find({ workshop: id })
      .populate('department', 'name')
      .populate('doer', 'name email');

    return res.status(200).json({
      workshop: {
        ...workshop.toObject(),
        tasks
      }
    });
  } catch (err) {
    console.error('Error completing workshop:', err);
    return res.status(500).json({ message: 'Failed to complete workshop' });
  }
};

/**
 * @desc    Update task doer
 * @route   PUT /api/workshop/:id/tasks/:taskId/doer
 * @access  Plan & Launch permission required
 */
exports.updateTaskDoer = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { doerId } = req.body;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Only allow updates for live workshops
    if (workshop.status !== 'live') {
      return res.status(400).json({
        message: 'Can only update task doers for live workshops'
      });
    }

    // Get the task
    const task = await WorkshopTask.findOne({
      _id: taskId,
      workshop: id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is completed
    if (task.status === 'completed') {
      return res.status(400).json({
        message: 'Cannot update doer for completed tasks'
      });
    }

    // Update the task doer
    task.doer = doerId;
    await task.save();

    // Get updated task with populated fields
    await task.populate([
      { path: 'department', select: 'name' },
      { path: 'doer', select: 'name email' }
    ]);

    return res.status(200).json({ task });
  } catch (err) {
    console.error('Error updating task doer:', err);
    return res.status(500).json({ message: 'Failed to update task doer' });
  }
};

/**
 * @desc    Get all workshops with optional status filter
 * @route   GET /api/workshop
 * @access  Plan & Launch permission required
 */
exports.getWorkshops = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status) {
      // Allow filtering by multiple statuses
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }

    const workshops = await Workshop.find(filter)
      .populate('workshopTemplate', 'name workshopTemplateId')
      .populate('processCoordinator', 'name email')
      .populate('executiveAssistant', 'name email')
      .sort({ announcementDate: 1 }) // Sort by announcement date
      .select('-__v');

    return res.status(200).json({
      workshops
    });
  } catch (err) {
    console.error('Error fetching workshops:', err);
    return res.status(500).json({ message: 'Failed to fetch workshops' });
  }
};

/**
 * @desc    Get count of pending tasks for a doer
 * @route   GET /api/workshop/tasks/count/:doerId
 * @access  Private
 */
exports.getDoerTaskCount = async (req, res) => {
  try {
    const { doerId } = req.params;

    // Count pending tasks for the doer
    const count = await WorkshopTask.countDocuments({
      doer: doerId,
      status: 'Pending'
    });

    res.json({ count });
  } catch (err) {
    console.error('Error getting doer task count:', err);
    res.status(500).json({ message: 'Error getting doer task count' });
  }
};

/**
 * @desc    Mark a task as completed
 * @route   PUT /api/workshop/tasks/:taskId/status
 * @access  Plan & Launch permission required
 */
exports.markTaskCompleted = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, NARemark } = req.body;
    if (status !== 'Completed') {
      return res.status(400).json({ message: 'Invalid status update' });
    }
    const task = await WorkshopTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    task.status = 'Completed';
    task.completedOn = new Date();
    // Set NARemark if provided
    if (NARemark !== undefined) {
      task.NARemark = NARemark;
    }
    await task.save();
    return res.status(200).json({ task });
  } catch (err) {
    console.error('Error marking task as completed:', err);
    return res.status(500).json({ message: 'Failed to mark task as completed' });
  }
}; 
 