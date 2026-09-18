const Escalation = require('../models/Escalation');
const WorkshopTask = require('../models/WorkshopTask');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const { getIo, getConnectedUsers } = require('../socket');
const Notification = require('../models/Notification');
// console.log('escalationController: connectedUsers at import:', getConnectedUsers());

/**
 * Fetch an escalation by task ID
 * @route GET /api/escalations/task/:taskId
 */
exports.getEscalationByTaskId = async (req, res) => {
    try {
        const { taskId } = req.params;

        const escalation = await Escalation.findOne({ taskId })
            .populate({ path: 'escalationChain.raisedBy', select: 'name role', populate: { path: 'role', select: 'name' } })
            .populate({ path: 'escalationChain.raisedTo', select: 'name role', populate: { path: 'role', select: 'name' } });

        if (!escalation) {
            return res.status(404).json({ message: 'No escalation found for this task' });
        }

        // Format escalationChain to include role name and not email
        const formattedEscalation = escalation.toObject();
        formattedEscalation.escalationChain = formattedEscalation.escalationChain.map(entry => ({
            ...entry,
            raisedBy: entry.raisedBy ? { _id: entry.raisedBy._id, name: entry.raisedBy.name, role: entry.raisedBy.role?.name } : null,
            raisedTo: entry.raisedTo ? { _id: entry.raisedTo._id, name: entry.raisedTo.name, role: entry.raisedTo.role?.name } : null
        }));
        res.status(200).json({
            success: true,
            data: formattedEscalation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching escalation',
            error: error.message
        });
    }
};

/**
 * Fetch all MDs and EA associated with a task
 * @route GET /api/escalations/task/:taskId/contacts
 */
exports.getTaskContacts = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Find the task and its workshop
        const task = await WorkshopTask.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Find the MD role ID
        const mdRole = await Role.findOne({ name: 'MD' });
        const mds = mdRole
            ? await Employee.find({ role: mdRole._id, isDeleted: false, isActive: true }).select('name email')
            : [];

        // Find the EA associated with the workshop of this task
        let ea = null;
        if (task.workshop) {
            const Workshop = require('../models/Workshop');
            const workshop = await Workshop.findById(task.workshop).select('executiveAssistant');
            if (workshop && workshop.executiveAssistant) {
                ea = await Employee.findOne({ _id: workshop.executiveAssistant, isDeleted: false, isActive: true }).select('name email');
            }
        }

        res.status(200).json({
            success: true,
            data: {
                mds,
                ea
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts',
            error: error.message
        });
    }
};

/**
 * Create a new escalation
 * @route POST /api/escalations
 */
exports.createEscalation = async (req, res) => {
    try {
        const { taskId, workshopId, escalationChain, raisedTo, comment } = req.body;
        const raisedBy = req.user._id;

        // Check if task exists and doesn't already have an escalation
        const task = await WorkshopTask.findById(taskId).populate('doer', 'name email role').populate('workshop', 'name');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (task.escalationId) {
            return res.status(400).json({ message: 'Task already has an escalation' });
        }

        // Build escalation chain
        let chain = [];
        if (Array.isArray(escalationChain) && escalationChain.length > 0) {
            chain = escalationChain.map(entry => ({
                raisedBy,
                raisedTo: entry.raisedTo,
                comment: entry.comment,
                timestamp: new Date()
            }));
        } else if (raisedTo && comment) {
            chain = [{
                raisedBy,
                raisedTo,
                comment,
                timestamp: new Date()
            }];
        } else {
            return res.status(400).json({ message: 'raisedTo and comment are required.' });
        }

        // Create new escalation entry
        const escalation = new Escalation({
            taskId,
            workshopId,
            escalationChain: chain
        });

        await escalation.save();

        // Update the task with the escalation ID
        task.escalationId = escalation._id;
        await task.save();

        // --- Notification Logic ---
        // Get origin role
        const userWithRole = await Employee.findById(req.user._id).populate('role');
        const originRole = userWithRole.role.name;
        // Task details for message
        const taskDetails = `Task: ${task.narration}\nDue: ${task.endDate ? new Date(task.endDate).toLocaleDateString() : ''}\nWorkshop: ${task.workshop?.name || ''}`;
        // Escalation comment
        const escalationComment = chain[0]?.comment || comment || '';
        // Notification message
        const notifMsg = `${taskDetails}\nEscalation Comment: ${escalationComment}\nOrigin: ${originRole}`;
        // Recipients
        const originUserId = userWithRole._id.toString();
        const notifications = [];
        // Always notify Doer (unless originator is Doer)
        if (task.doer._id.toString() !== originUserId) {
            notifications.push(task.doer._id.toString());
        }
        // Add raisedTo recipients, but never the originator
        if (Array.isArray(escalationChain)) {
            for (const entry of escalationChain) {
                if (entry.raisedTo && entry.raisedTo.toString() !== originUserId) {
                    notifications.push(entry.raisedTo.toString());
                }
            }
        } else if (raisedTo && raisedTo.toString() !== originUserId) {
            notifications.push(raisedTo.toString());
        }
        // Remove duplicates
        const uniqueRecipients = [...new Set(notifications)];
        console.log('Preparing to notify recipients:', uniqueRecipients);
        console.log('escalationController: connectedUsers before notification:', getConnectedUsers());
        for (const userId of uniqueRecipients) {
            await Notification.create({
                user: userId,
                message: notifMsg,
                type: 'escalation',
                taskId: taskId
            });
            console.log('Notification created in DB for user:', userId);
            // Emit real-time notification if user is connected
            const connectedUsers = getConnectedUsers();
            const io = getIo();
            console.log('Checking socket connection for user:', userId, connectedUsers);
            if (connectedUsers && typeof connectedUsers === 'object') {
                const socketId = connectedUsers[userId];
                if (socketId) {
                    console.log('Attempting to notify user:', userId, 'Socket:', connectedUsers[userId]);
                    io.to(socketId).emit('notification', { message: "Escalation Raised: Please check your inbox.", type: 'escalation' });
                } else {
                    console.warn(`[Notification] User ${userId} not connected, skipping real-time emit.`);
                }
            }
        }
        // --- End Notification Logic ---

        res.status(201).json({
            success: true,
            data: escalation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating escalation',
            error: error.message
        });
    }
};

/**
 * Update an escalation by adding to the chain
 * @route PUT /api/escalations/:id
 */
exports.updateEscalation = async (req, res) => {
    try {
        const { id } = req.params;
        const { raisedTo, comment } = req.body;
        const raisedBy = req.user._id;

        const escalation = await Escalation.findById(id);
        if (!escalation) {
            return res.status(404).json({ message: 'Escalation not found' });
        }

        // Add new entry to escalation chain
        escalation.escalationChain.push({
            raisedBy,
            raisedTo,
            comment,
            timestamp: new Date()
        });

        await escalation.save();

        // --- Notification Logic ---
        // Get task and doer
        const task = await WorkshopTask.findById(escalation.taskId).populate('doer', 'name email role').populate('workshop', 'name');
        const userWithRole = await Employee.findById(req.user._id).populate('role');
        const originRole = userWithRole.role.name;
        const taskDetails = `Task: ${task.narration}\nDue: ${task.endDate ? new Date(task.endDate).toLocaleDateString() : ''}\nWorkshop: ${task.workshop?.name || ''}`;
        const escalationComment = comment || '';
        const notifMsg = `${taskDetails}\nEscalation Comment: ${escalationComment}\nOrigin: ${originRole}`;
        const originUserId = userWithRole._id.toString();
        const notifications = [];
        if (task.doer._id.toString() !== originUserId) {
            notifications.push(task.doer._id.toString());
        }
        if (raisedTo && raisedTo.toString() !== originUserId) {
            notifications.push(raisedTo.toString());
        }
        console.log('notifications:', raisedTo);
        const uniqueRecipients = [...new Set(notifications)];
        // console.log('Preparing to notify recipients:', uniqueRecipients);
        // console.log('escalationController: connectedUsers before notification:', getConnectedUsers());
        for (const userId of uniqueRecipients) {
            // console.log('userId:', userId);
            await Notification.create({
                user: userId,
                message: notifMsg,
                type: 'escalation',
                taskId: escalation.taskId
            });
            // console.log('Notification created in DB for user:', userId);
            const connectedUsers = getConnectedUsers();
            const io = getIo();
            // console.log('Checking socket connection for user:', userId, connectedUsers);
            if (connectedUsers && typeof connectedUsers === 'object') {
                const socketId = connectedUsers[userId];
                if (socketId) {
                    // console.log('Attempting to notify user:', userId, 'Socket:', connectedUsers[userId]);
                    io.to(socketId).emit('notification', { message: "Escalation Raised: Please check your inbox.", type: 'escalation' });
                } else {
                    console.warn(`[Notification] User ${userId} not connected, skipping real-time emit.`);
                }
            }
        }
        // --- End Notification Logic ---

        res.status(200).json({
            success: true,
            data: escalation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating escalation',
            error: error.message
        });
    }
}; 