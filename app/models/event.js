const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  picture: String,
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  website: {
    type: String
  }
  // cohort: {
  //   type: String,
  //   required: true
  // }
}, {
  timestamps: true
})

module.exports = mongoose.model('Event', eventSchema)
