const Reminder = require('../models/Reminder');

const getReminders = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const reminders = await Reminder.find({ owner: userId }).sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: reminders });
  } catch (error) {
    next(error);
  }
};

const createReminder = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, dueDate, type } = req.body;
    const reminder = await Reminder.create({
      owner: userId,
      title,
      dueDate,
      type: type || 'Other'
    });
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
};

const updateReminder = async (req, res, next) => {
  try {
    let reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    if (reminder.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this reminder' });
    }
    reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
};

const toggleComplete = async (req, res, next) => {
  try {
    let reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    if (reminder.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this reminder' });
    }
    reminder.isCompleted = !reminder.isCompleted;
    await reminder.save();
    res.status(200).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
};

const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    if (reminder.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this reminder' });
    }
    await reminder.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

const getUpcoming = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({
      owner: req.user.id,
      isCompleted: false,
      dueDate: { $gte: new Date() }
    })
    .sort({ dueDate: 1 })
    .limit(5);
    res.status(200).json({ success: true, data: reminders });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  toggleComplete,
  deleteReminder,
  getUpcoming
};
