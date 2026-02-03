const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  fullName: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  officeAddress: {
    type: String
  },
  homeAddress: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  officePhone: {
    type: String
  },
  mobilePhone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  qualificationType: {
    type: String,
    enum: ['MBBS', 'Other'],
    default: 'MBBS'
  },
  mbbsCollege: {
    type: String
  },
  mbbsYear: {
    type: String
  },
  otherDegree: {
    type: String
  },
  pgDetails: {
    type: String
  },
  // File Paths
  mciFile: {
    type: String, // Store file path
    required: true
  },
  pgFile: {
    type: String, // Store file path
    required: true
  },
  otherDocs: {
    type: [String] // Store array of file paths
  },
  photograph: {
    type: String, // Store file path
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Membership', membershipSchema);
