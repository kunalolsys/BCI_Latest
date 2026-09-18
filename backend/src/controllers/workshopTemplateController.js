// controllers/workshopTemplateController.js
// Controller for workshop template management
// Uses projection to fetch only required fields

const WorkshopTemplate = require('../models/WorkshopTemplate');
const Workshop = require('../models/Workshop');
const WorkshopTemplateTask = require('../models/WorkshopTemplateTask');
const DepartmentalTemplateTask = require('../models/DepartmentalTemplateTask');

/**
 *    Fetch all workshop templates
 *   GET /api/workshop/templates
 *  Workshop Template permission required
 */
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await WorkshopTemplate.find({})
      .select('templateId name workshopName processCoordinator executiveAssistant')
      .populate('workshopName', 'name abbreviation')
      .populate('processCoordinator', 'name email')
      .populate('executiveAssistant', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      templates
    });
  } catch (err) {
    console.error('Error fetching workshop templates:', err);
    return res.status(500).json({ message: 'Failed to fetch workshop templates' });
  }
};

/**
 * @desc    Create a new workshop template
 * @route   POST /api/workshop/templates
 * @access  Workshop Template permission required
 */
exports.createTemplate = async (req, res) => {
  try {
    const { name, workshopName, processCoordinator, executiveAssistant, tasks } = req.body;

    if (!name || !workshopName || !processCoordinator || !executiveAssistant) {
      return res.status(400).json({
        message: 'Name, Workshop Type, Process Coordinator, and Executive Assistant are required'
      });
    }

    if (tasks && !Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Tasks must be an array' });
    }

    const template = await WorkshopTemplate.create({
      name,
      workshopName,
      processCoordinator,
      executiveAssistant
    });

    if (tasks && tasks.length > 0) {
      const individualTasks = tasks.filter(t => t.doer);
      const departmentalTasks = tasks.filter(t => !t.doer);

      for (const taskData of individualTasks) {
        const task = new WorkshopTemplateTask({ ...taskData, workshopTemplate: template._id });
        await task.save();
      }
      for (const taskData of departmentalTasks) {
        const task = new DepartmentalTemplateTask({ ...taskData, workshopTemplate: template._id });
        await task.save();
      }
    }

    await template.populate([
      { path: 'workshopName', select: 'name abbreviation' },
      { path: 'processCoordinator', select: 'name email' },
      { path: 'executiveAssistant', select: 'name email' }
    ]);

    const createdTasks = await WorkshopTemplateTask.find({ workshopTemplate: template._id })
      .populate('department', 'name')
      .populate('doer', 'name email')
      .lean();

    const createdDepartmentalTasks = await DepartmentalTemplateTask.find({ workshopTemplate: template._id })
      .populate('department', 'name')
      .lean();

    return res.status(201).json({
      template: {
        templateId: template.templateId,
        name: template.name,
        workshopName: template.workshopName,
        processCoordinator: template.processCoordinator,
        executiveAssistant: template.executiveAssistant,
        tasks: createdTasks,
        departmentalTasks: createdDepartmentalTasks
      }
    });
  } catch (err) {
    console.error('Error creating workshop template:', err);
    return res.status(500).json({ message: 'Failed to create workshop template' });
  }
};

/**
 * @desc    Update a workshop template (only if no active workshops)
 * @route   PUT /api/workshop/templates/:id
 * @access  Workshop Template permission required
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, workshopName, processCoordinator, executiveAssistant, tasks } = req.body;

    if (!name || !workshopName || !processCoordinator || !executiveAssistant) {
      return res.status(400).json({
        message: 'Name, Workshop Type, Process Coordinator, and Executive Assistant are required'
      });
    }

    const template = await WorkshopTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Workshop template not found' });
    }

    const updatedTemplate = await WorkshopTemplate.findByIdAndUpdate(
      id,
      { name, workshopName, processCoordinator, executiveAssistant },
      { new: true, runValidators: true }
    ).populate([
      { path: 'workshopName', select: 'name abbreviation' },
      { path: 'processCoordinator', select: 'name email' },
      { path: 'executiveAssistant', select: 'name email' }
    ]);

    if (tasks && Array.isArray(tasks)) {
      await WorkshopTemplateTask.deleteMany({ workshopTemplate: id });
      await DepartmentalTemplateTask.deleteMany({ workshopTemplate: id });

      const individualTasks = tasks.filter(t => t.doer);
      const departmentalTasks = tasks.filter(t => !t.doer);

      for (const taskData of individualTasks) {
        const task = new WorkshopTemplateTask({ ...taskData, workshopTemplate: id });
        await task.save();
      }
      for (const taskData of departmentalTasks) {
        const task = new DepartmentalTemplateTask({ ...taskData, workshopTemplate: id });
        await task.save();
      }
    }

    const updatedTasks = await WorkshopTemplateTask.find({ workshopTemplate: id })
      .populate('department', 'name')
      .populate('doer', 'name email')
      .lean();

    const updatedDepartmentalTasks = await DepartmentalTemplateTask.find({ workshopTemplate: id })
      .populate('department', 'name')
      .lean();

    return res.status(200).json({
      template: {
        templateId: updatedTemplate.templateId,
        name: updatedTemplate.name,
        workshopName: updatedTemplate.workshopName,
        processCoordinator: updatedTemplate.processCoordinator,
        executiveAssistant: updatedTemplate.executiveAssistant,
        tasks: updatedTasks,
        departmentalTasks: updatedDepartmentalTasks
      }
    });
  } catch (err) {
    console.error('Error updating workshop template:', err);
    return res.status(500).json({ message: 'Failed to update workshop template' });
  }
};

/**
 * @desc    Delete a workshop template (only if no workshops linked)
 * @route   DELETE /api/workshop/templates/:id
 * @access  Workshop Template permission required
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await WorkshopTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Workshop template not found' });
    }

    await WorkshopTemplateTask.deleteMany({ workshopTemplate: id });
    await DepartmentalTemplateTask.deleteMany({ workshopTemplate: id });
    await WorkshopTemplate.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Workshop template deleted successfully' });
  } catch (err) {
    console.error('Error deleting workshop template:', err);
    return res.status(500).json({ message: 'Failed to delete workshop template' });
  }
};

/**
 * @desc    Get a single workshop template by ID
 * @route   GET /api/workshop/templates/:id
 * @access  Workshop Template permission required
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await WorkshopTemplate.findById(id)
      .populate('workshopName', 'name abbreviation')
      .populate('processCoordinator', 'name email')
      .populate('executiveAssistant', 'name email')
      .lean();

    if (!template) {
      return res.status(404).json({ message: 'Workshop template not found' });
    }

    const tasks = await WorkshopTemplateTask.find({ workshopTemplate: id })
      .populate('department', 'name')
      .populate('doer', 'name email')
      .lean();

    const departmentalTasks = await DepartmentalTemplateTask.find({ workshopTemplate: id })
      .populate('department', 'name')
      .lean();

    return res.status(200).json({
      template: {
        ...template,
        tasks,
        departmentalTasks
      }
    });
  } catch (err) {
    console.error('Error fetching workshop template:', err);
    return res.status(500).json({ message: 'Failed to fetch workshop template' });
  }
};

/**
 * @desc    Add a new task to a workshop template
 *          Tasks with a doer are individual; tasks without a doer are departmental.
 * @route   POST /api/workshop/templates/:id/tasks
 * @access  Workshop Template permission required
 */
exports.addTask = async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = req.body;

    const template = await WorkshopTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Workshop template not found' });
    }

    const hasActiveWorkshops = await Workshop.exists({
      workshopTemplate: id,
      status: { $in: ['pending', 'in_progress'] }
    });

    if (hasActiveWorkshops) {
      return res.status(400).json({ message: 'Cannot modify template with active workshops' });
    }

    if (taskData.doer) {
      const task = new WorkshopTemplateTask({ ...taskData, workshopTemplate: id });
      await task.save();
      await task.populate([
        { path: 'department', select: 'name' },
        { path: 'doer', select: 'name email' }
      ]);
      return res.status(201).json({ task });
    } else {
      const task = new DepartmentalTemplateTask({ ...taskData, workshopTemplate: id });
      await task.save();
      await task.populate({ path: 'department', select: 'name' });
      return res.status(201).json({ task });
    }
  } catch (err) {
    console.error('Error adding task:', err);
    return res.status(500).json({ message: 'Failed to add task' });
  }
};

/**
 * @desc    Update a task in a workshop template
 *          Checks both WorkshopTemplateTask and DepartmentalTemplateTask collections.
 * @route   PUT /api/workshop/templates/:id/tasks/:taskId
 * @access  Workshop Template permission required
 */
exports.updateTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const taskData = req.body;

    const template = await WorkshopTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Workshop template not found' });
    }

    const hasActiveWorkshops = await Workshop.exists({
      workshopTemplate: id,
      status: { $in: ['pending', 'in_progress'] }
    });

    if (hasActiveWorkshops) {
      return res.status(400).json({ message: 'Cannot modify template with active workshops' });
    }

    if (taskId.endsWith('-D')) {
      const task = await DepartmentalTemplateTask.findOneAndUpdate(
        { taskId, workshopTemplate: id },
        taskData,
        { new: true, runValidators: true }
      ).populate({ path: 'department', select: 'name' });

      if (!task) return res.status(404).json({ message: 'Departmental task not found' });
      return res.status(200).json({ task });
    }

    const task = await WorkshopTemplateTask.findOneAndUpdate(
      { taskId, workshopTemplate: id },
      taskData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'department', select: 'name' },
      { path: 'doer', select: 'name email' }
    ]);

    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.status(200).json({ task });
  } catch (err) {
    console.error('Error updating task:', err);
    return res.status(500).json({ message: 'Failed to update task' });
  }
};

/**
 * @desc    Delete a task from a workshop template
 *          Checks both WorkshopTemplateTask and DepartmentalTemplateTask collections.
 * @route   DELETE /api/workshop/templates/:id/tasks/:taskId
 * @access  Workshop Template permission required
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;

    const template = await WorkshopTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Workshop template not found' });
    }

    const hasActiveWorkshops = await Workshop.exists({
      workshopTemplate: id,
      status: { $in: ['pending', 'in_progress'] }
    });

    if (hasActiveWorkshops) {
      return res.status(400).json({ message: 'Cannot modify template with active workshops' });
    }

    if (taskId.endsWith('-D')) {
      const deleted = await DepartmentalTemplateTask.findOneAndDelete({ taskId, workshopTemplate: id });
      if (!deleted) return res.status(404).json({ message: 'Departmental task not found' });
      return res.status(200).json({ message: 'Task deleted successfully' });
    }

    const deleted = await WorkshopTemplateTask.findOneAndDelete({ taskId, workshopTemplate: id });
    if (!deleted) return res.status(404).json({ message: 'Task not found' });
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    return res.status(500).json({ message: 'Failed to delete task' });
  }
};
