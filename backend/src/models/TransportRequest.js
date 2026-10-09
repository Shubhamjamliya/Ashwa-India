const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const settlementSchema = new mongoose.Schema(
  {
    grossAmount: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    commissionFixed: { type: Number, required: true },
    commission: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    settledAt: { type: Date, required: true },
  },
  { _id: false }
);

// Price is captured at request time from the transporter's per-km rate, so a
// later rate change never alters a booking the user already saw.
const quoteSchema = new mongoose.Schema(
  {
    tripKm: { type: Number, required: true },
    pricePerKm: { type: Number, required: true },
    baseFare: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const transportRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Empty while a private request is being offered to nearby transporters; set by whoever accepts first.
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', index: true },
    // Admin vehicle type the user picked (its `key`). The fare comes from that type's admin price.
    vehicleType: { type: String },
    offeredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', index: true }],
    declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transporter' }],
    source: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    type: { type: String, enum: ['private', 'shared'], default: 'private' },
    // Shared bookings: how many animals this customer books, the day of the run,
    // and the group they ride in. Private bookings keep the defaults.
    animals: { type: Number, min: 1, default: 1 },
    scheduledDate: { type: String }, // YYYY-MM-DD, the travel day the user picked
    sharedGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedTrip', index: true },
    // A shared booking joins an earlier, accepted booking (the host) on the same route and day.
    // The host's customer approves first; only then does the transporter see the enquiry.
    hostRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRequest', index: true },
    shareApproval: { type: String, enum: ['pending', 'approved', 'declined'] },
    rejectReason: { type: String },
    // Advance collected at booking time; refunded to the user's wallet if the booking never goes ahead.
    advance: {
      amount: { type: Number, default: 0 },
      method: { type: String, enum: ['wallet', 'razorpay'] },
      paymentIntent: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentIntent' },
      status: { type: String, enum: ['none', 'paid', 'refunded'], default: 'none' },
      refundedAt: { type: Date },
    },
    message: { type: String },
    quote: { type: quoteSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    // Trip progress, only meaningful once accepted.
    stage: { type: String, enum: ['scheduled', 'to_pickup', 'in_transit', 'delivered'] },
    // Hidden by default so the transporter never sees them; read explicitly with +field.
    pickupOtp: { type: String, select: false },
    dropOtp: { type: String, select: false },
    pickupVerifiedAt: { type: Date },
    deliveredAt: { type: Date },
    transporterLocation: {
      lat: { type: Number },
      lng: { type: Number },
      heading: { type: Number },
      updatedAt: { type: Date },
    },
    // Google's encoded road route from pickup to drop, cached the first time shared rides are matched against it.
    routePolyline: { type: String, select: false },
    // Path the vehicle has driven during the trip, for the tracking map. Capped; read only by the detail endpoints.
    trail: {
      type: [{ lat: Number, lng: Number, at: Date, _id: false }],
      select: false,
      default: undefined,
    },
    paymentStatus: { type: String, enum: ['unpaid', 'settled'], default: 'unpaid' },
    settlement: { type: settlementSchema },
    respondedAt: { type: Date },
    // Trip logistics assigned by the transporter.
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    pickupScheduledAt: { type: Date },
    paused: { type: Boolean, default: false },
    deliveryProof: { url: String, note: String, uploadedAt: Date },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportRequest', transportRequestSchema);
