const mongoose = require('mongoose');

// A shared group is one vehicle run that several customers' bookings ride on.
// Members are TransportRequest documents that point here via `sharedGroup`.
// The group is defined by its anchor route (first booking) and a scheduled day.
// It stays `open` for new members until the first member's trip starts.
const pointSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const sharedTripSchema = new mongoose.Schema(
  {
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', required: true, index: true },
    scheduledDate: { type: String, required: true }, // YYYY-MM-DD
    source: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SharedTrip', sharedTripSchema);
