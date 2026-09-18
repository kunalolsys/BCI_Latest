const Holiday = require("../models/Holiday");

// Create a new holiday
exports.createHoliday = async (req, res) => {
  try {
    const { name, date } = req.body;

    const holiday = await Holiday.create({
      name,
      date,
    });

    res.status(201).json({
      status: "success",
      data: {
        holiday,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: "An error occurred while creating the holiday",
    });
  }
};

// Get all holidays
exports.getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });

    res.status(200).json({
      status: "success",
      data: {
        holidays,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get a single holiday
exports.getHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        status: "error",
        message: "No holiday found with that ID",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        holiday,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update a holiday
exports.updateHoliday = async (req, res) => {
  try {
    const { name, date } = req.body;

    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      {
        name,
        date,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!holiday) {
      return res.status(404).json({
        status: "error",
        message: "No holiday found with that ID",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        holiday,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: "An error occurred while updating the holiday",
    });
  }
};

// Delete a holiday
exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        status: "error",
        message: "No holiday found with that ID",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}; 