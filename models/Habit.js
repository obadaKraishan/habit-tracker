import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  frequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], required: true },
  goal: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reminders: { type: Boolean, default: false },
  datesCompleted: [{ type: Date }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Habit', habitSchema);
