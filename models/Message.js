const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: String },
  text: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Message', MessageSchema);