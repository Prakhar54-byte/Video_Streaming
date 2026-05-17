import mongoose from 'mongoose';

const AnalyticsEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  videoId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  data: { type: Object, required: true },
  deviceInfo: { type: Object },
  networkInfo: { type: Object },
  metadata: { type: Object },
}, {
  timestamps: true,
  collection: 'analyticsEvents',
});

export default mongoose.model('AnalyticsEvent', AnalyticsEventSchema);