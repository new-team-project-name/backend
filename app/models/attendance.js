const mongoose = require('mongoose')

const attendanceSchema = new mongoose.Schema({
  going: {
    type: Boolean,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'Event',
    require: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Attendance', attendanceSchema)
