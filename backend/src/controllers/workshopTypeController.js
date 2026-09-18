const WorkshopType = require('../models/WorkshopType');

/**
 * @desc    Get all workshop types
 * @route   GET /api/workshop-types
 * @access  Public (or Protected, depending on requirements - for now, public for dropdowns)
 */
exports.getAllWorkshopTypes = async (req, res) => {
  try {
    const workshopTypes = await WorkshopType.find({}).select('name abbreviation _id').sort({ name: 1 });
    // Using .select to only fetch necessary fields
    // Sorting by name for consistent dropdown order

    res.status(200).json({ workshopTypes });
  } catch (err) {
    console.error('Error fetching workshop types:', err);
    res.status(500).json({ message: 'Failed to fetch workshop types' });
  }
};

/**
 * @desc    Create a new workshop type
 * @route   POST /api/workshop-type
 * @access  Protected (Admin/Setup)
 */
exports.createWorkshopType = async (req, res) => {
  const { name, abbreviation } = req.body;

  if (!name || !abbreviation) {
    return res.status(400).json({ message: 'Name and abbreviation are required' });
  }

  try {
    const workshopType = await WorkshopType.create({
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase()
    });

    // Return only necessary fields to keep payload lean
    const { _id, name: typeName, abbreviation: typeAbbr } = workshopType;
    res.status(201).json({ workshopType: { _id, name: typeName, abbreviation: typeAbbr } });
  } catch (err) {
    console.error('Error creating workshop type:', err);

    if (err.code === 11000) {
      // Duplicate key error handling for unique fields
      return res.status(409).json({ message: 'Workshop type name or abbreviation already exists' });
    }

    res.status(500).json({ message: 'Failed to create workshop type' });
  }
};

/**
 * @desc    Update an existing workshop type by ID
 * @route   PUT /api/workshop-type/:id
 * @access  Protected (Admin/Setup)
 */
exports.updateWorkshopType = async (req, res) => {
  const { id } = req.params;
  const { name, abbreviation } = req.body;

  try {
    const updated = await WorkshopType.findByIdAndUpdate(
      id,
      {
        ...(name ? { name: name.trim() } : {}),
        ...(abbreviation ? { abbreviation: abbreviation.trim().toUpperCase() } : {})
      },
      { new: true, runValidators: true, projection: 'name abbreviation _id' } // projection keeps response slim
    );

    if (!updated) {
      return res.status(404).json({ message: 'Workshop type not found' });
    }

    res.status(200).json({ workshopType: updated });
  } catch (err) {
    console.error('Error updating workshop type:', err);

    if (err.code === 11000) {
      return res.status(409).json({ message: 'Workshop type name or abbreviation already exists' });
    }

    res.status(500).json({ message: 'Failed to update workshop type' });
  }
};

/**
 * @desc    Delete a workshop type by ID
 * @route   DELETE /api/workshop-type/:id
 * @access  Protected (Admin/Setup)
 */
exports.deleteWorkshopType = async (req, res) => {
  const { id } = req.params;

  try {
    const removed = await WorkshopType.findByIdAndDelete(id);

    if (!removed) {
      return res.status(404).json({ message: 'Workshop type not found' });
    }

    res.status(200).json({ message: 'Workshop type deleted successfully' });
  } catch (err) {
    console.error('Error deleting workshop type:', err);
    res.status(500).json({ message: 'Failed to delete workshop type' });
  }
};