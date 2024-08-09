import express from 'express';
import Habit from '../models/Habit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all habits
router.get('/', auth, async (req, res) => {
  const habits = await Habit.find({ user: req.user.userId });
  res.json(habits);
});

// Add a new habit
router.post('/', auth, async (req, res) => {
  const { name, description, frequency, goal, reminders } = req.body;

  try {
    const habit = new Habit({
      name,
      description,
      frequency,
      goal,
      reminders,
      user: req.user.userId
    });

    await habit.save();
    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update habit (including datesCompleted)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, description, frequency, goal, reminders, datesCompleted } = req.body;

  try {
    const habit = await Habit.findByIdAndUpdate(
      id,
      { name, description, frequency, goal, reminders, datesCompleted },
      { new: true }
    );

    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark habit as complete for a specific date
router.put('/:id/complete', auth, async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  try {
    const habit = await Habit.findById(id);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const dateIndex = habit.datesCompleted.findIndex(d => d.toISOString().split('T')[0] === date);

    if (dateIndex === -1) {
      habit.datesCompleted.push(new Date(date));
    } else {
      habit.datesCompleted.splice(dateIndex, 1); // Unmark as done
    }

    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete habit
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    await Habit.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
