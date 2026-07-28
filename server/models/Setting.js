const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  autoStatusProgression: {
    type: Boolean,
    default: true
  },
  progressionDelaySeconds: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Setting', settingSchema);
