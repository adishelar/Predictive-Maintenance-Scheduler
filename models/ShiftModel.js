const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] }, // Departments,
  machine: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Not Active'], default: 'Not Active' }, // Enum for status
  feedback: { type: String, default: '' }, // Optional feedback
  timestamp: { type: Date, default: Date.now }
});

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;