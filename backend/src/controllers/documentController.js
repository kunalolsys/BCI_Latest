const fs = require('fs');
const path = require('path');
const WorkshopTask = require('../models/WorkshopTask');
const { getIo, getConnectedUsers } = require('../socket');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * Upload a document for a workshop task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const task = await WorkshopTask.findById(req.params.taskId).populate('workshop').populate('doer', 'name');
    if (!task) {
      // Delete uploaded file if task not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Task not found' });
    }

    // Add document info to task
    task.documents.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path
    });

    await task.save();

    // --- Notification Logic ---
    const workshop = await require('../models/Workshop').findById(task.workshop._id).select('processCoordinator executiveAssistant');
    const doerId = task.doer?._id?.toString();
    const pcId = workshop?.processCoordinator?.toString();
    const eaId = workshop?.executiveAssistant?.toString();
    const originUserId = req.user._id.toString();
    const recipients = [doerId, pcId, eaId].filter(uid => uid && uid !== originUserId);
    const notifMsg = `Task: ${task.taskId}\nDocument Uploaded: ${req.file.originalname}\nBy: ${req.user.name || req.user.email}`;
    const uniqueRecipients = [...new Set(recipients)];
    console.log('Preparing to notify recipients:', uniqueRecipients);
    for (const userId of uniqueRecipients) {
      console.log('userId:', userId);
            console.log('typeof userId:', typeof userId);
      await Notification.create({
        user: userId,
        message: notifMsg,
        type: 'document',
        taskId: task._id
      });
      const connectedUsers = getConnectedUsers();
      const io = getIo();
      const socketId = connectedUsers[userId];
      if (socketId) {
        io.to(socketId).emit('notification', { message: "New Document Uploaded: Please check your inbox.", type: 'document' });
      }
    }
    // --- End Notification Logic ---

    res.status(200).json({ 
      message: 'Document uploaded successfully', 
      document: task.documents[task.documents.length - 1] 
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
};

/**
 * Get all documents for a workshop task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTaskDocuments = async (req, res) => {
  try {
    const task = await WorkshopTask.findById(req.params.taskId)
      .select('documents')
      .lean();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task.documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

/**
 * Delete a document from a workshop task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteDocument = async (req, res) => {
  try {
    const task = await WorkshopTask.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const document = task.documents.id(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    fs.unlinkSync(document.path);

    // Remove document from task
    task.documents.pull(req.params.documentId);
    await task.save();

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};

/**
 * Download a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadDocument = async (req, res) => {
  try {
    const documentPath = req.params.documentPath;
    
    // Check if the file exists
    if (!fs.existsSync(documentPath)) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get the original filename from the database
    const task = await WorkshopTask.findOne({ 'documents.path': documentPath });
    if (!task) {
      return res.status(404).json({ message: 'Document not found in database' });
    }

    const document = task.documents.find(doc => doc.path === documentPath);
    if (!document) {
      return res.status(404).json({ message: 'Document not found in task' });
    }

    // Get file stats
    const stat = fs.statSync(documentPath);

    // Set headers for download
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.originalName}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition'
    });

    // Stream the file
    const fileStream = fs.createReadStream(documentPath);
    fileStream.pipe(res);

    // Handle errors in the stream
    fileStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error downloading document', error: error.message });
    }
  }
};

module.exports = {
  uploadDocument,
  getTaskDocuments,
  deleteDocument,
  downloadDocument
}; 