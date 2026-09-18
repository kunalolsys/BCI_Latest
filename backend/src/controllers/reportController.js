const WorkshopTask = require('../models/WorkshopTask');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

exports.generateFMSPerformanceReport = async (req, res) => {
    try {
        // Debug: Log the request body
        console.log('Request body:', req.body);
        // console.log('Request headers:', req.headers);
        
        // Ensure req.body exists, default to empty object if not
        const requestBody = req.body || {};
        const { doerFilter, dateFilter, departmentFilter } = requestBody;
        
        const userId = req.user._id; // Get user ID from auth middleware
        console.log('User ID:', req.user);
        
        // Get user details to check role
        const user = await Employee.findById(userId).populate('role');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userRole = user.role.name;

        // Check if user has appropriate role
        if (!['EA', 'PC', 'MD', 'Doer'].includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions to generate report' });
        }

        // Build query for WorkshopTasks
        let query = {};

        // For Doer role, only fetch their own tasks
        if (userRole === 'Doer') {
            query.doer = userId; // Only fetch tasks for the current doer
        }

        // Apply doer filter (only for non-Doer roles)
        if (userRole !== 'Doer' && doerFilter && doerFilter.doerId) {
            query.doer = doerFilter.doerId;
        }

        // Apply department filter
        if (departmentFilter && departmentFilter.departmentId) {
            query.department = departmentFilter.departmentId;
        }

        // Apply date filter
        if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
            query.endDate = {
                $gte: new Date(dateFilter.startDate),
                $lte: new Date(dateFilter.endDate)
            };
        }

        console.log('Query being executed:', JSON.stringify(query, null, 2));

        // Fetch workshop tasks with populated references
        const tasks = await WorkshopTask.find(query)
            .populate('doer', 'name email')
            .populate('department', 'name')
            .populate('workshop', 'status')
            .lean();

        console.log('Number of tasks found:', tasks.length);
        if (tasks.length > 0) {
            console.log('Sample task:', JSON.stringify(tasks[0], null, 2));
        }

        // Also fetch tasks without date filter to see what's available
        if (doerFilter && doerFilter.doerId) {
            const allTasksForDoer = await WorkshopTask.find({ doer: doerFilter.doerId })
                .populate('doer', 'name email')
                .populate('department', 'name')
                .lean();
            
            console.log('Total tasks for this doer (without date filter):', allTasksForDoer.length);
            if (allTasksForDoer.length > 0) {
                console.log('Sample task dates:', allTasksForDoer.slice(0, 3).map(task => ({
                    taskId: task.taskId,
                    createdAt: task.createdAt,
                    startDate: task.startDate,
                    endDate: task.endDate,
                    actualEndDate: task.actualEndDate
                })));
            }
        }

        // Group tasks by doer
        const doerStats = {};

        tasks.forEach(task => {
            const doerId = task.doer._id.toString();
            const departmentId = task.department._id.toString();
            
            if (!doerStats[doerId]) {
                doerStats[doerId] = {
                    userId: doerId,
                    name: task.doer.name,
                    departments: {},
                    totalTasks: 0,
                    WDOT: 0, // Tasks done on time
                    WND: 0,  // Tasks not done yet
                    WNDOT: 0 // Tasks done but not on time
                };
            }

            // Initialize department if not exists
            if (!doerStats[doerId].departments[departmentId]) {
                doerStats[doerId].departments[departmentId] = {
                    departmentId: departmentId,
                    name: task.department.name
                };
            }

            // Increment total tasks
            // doerStats[doerId].totalTasks++;

            // Categorize task based on status and timing
            if (task.status === 'Completed') {
                if (task.completedOn && task.endDate) {
                    const completedDate = new Date(task.completedOn); completedDate.setHours(0, 0, 0, 0);
                    const endDate = new Date(task.endDate); endDate.setHours(0, 0, 0, 0);
                    if (completedDate <= endDate) {
                        doerStats[doerId].WDOT++;
                    } else {
                        doerStats[doerId].WNDOT++;
                    }
                } else {
                    // If no completedOn date, consider as done on time
                    doerStats[doerId].WDOT++;
                }
            } else if (['Pending', 'In Progress'].includes(task.status)) {
                const workshopOngoing = task.workshop && task.workshop.status === 'Ongoing';
                if (workshopOngoing) {
                    if (task.frequency === 'Daily') {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        if (task.status === 'Pending' && task.endDate && new Date(task.endDate) <= today) {
                            doerStats[doerId].WND++;
                        }
                    } else {
                        doerStats[doerId].WND++;
                    }
                }
            } else if (task.status === 'Delayed') {
                doerStats[doerId].WNDOT++;
            }
        });

        // Convert to array format and convert departments object to array
        const reportData = Object.values(doerStats).map(doer => ({
            userId: doer.userId,
            name: doer.name,
            departments: Object.values(doer.departments),
            totalTasks: doer.WDOT + doer.WND + doer.WNDOT,
            WDOT: doer.WDOT,
            WND: doer.WND,
            WNDOT: doer.WNDOT
        }));

        res.json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Error generating FMS Performance Report:', error);
        res.status(500).json({ error: 'Failed to generate FMS Performance Report' });
    }
}