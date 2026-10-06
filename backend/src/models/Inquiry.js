const mongoose = require('mongoose');

// text: a normal chat message. offer: a price proposal. deal: a system note once an offer is accepted.
const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'seller'], required: true },
    kind: { type: String, enum: ['text', 'offer', 'deal'], default: 'text' },
    amount: { type: Number, min: 0 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// An inquiry is a conversation between a buyer and a seller about one horse.
// There is no payment here: the parties agree a price in chat, then call each other to arrange the rest.
const inquirySchema = new mongoose.Schema(
  {
    horse: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'HorseSeller', required: true },
    message: { type: String, required: true },
    messages: [messageSchema],
    // The latest price proposal. Only the party who did not make it can accept or decline.
    quote: {
      amount: { type: Number, min: 0 },
      by: { type: String, enum: ['user', 'seller'] },
      status: { type: String, enum: ['pending', 'accepted', 'declined'] },
      at: { type: Date },
    },
    agreedAmount: { type: Number, min: 0 },
    status: { type: String, enum: ['open', 'replied', 'closed'], default: 'open' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
