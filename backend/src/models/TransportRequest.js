const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const transportRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', required: true },
    source: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    type: { type: String, enum: ['private', 'shared'], default: 'private' },
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportRequest', transportRequestSchema);
