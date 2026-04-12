import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },
        username: {
            type: String,
            required: true,
            default: 'Anonymous'
        },
        email: {
            type: String,
            required: true,
            default: 'anonymous@example.com'
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        category: {
            type: String,
            enum: ['general', 'bug', 'feature', 'improvement', 'content', 'other'],
            default: 'general'
        },
        status: {
            type: String,
            enum: ['new', 'reviewed', 'addressed', 'archived'],
            default: 'new'
        },
        adminNotes: {
            type: String,
            default: ''
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ userId: 1 });

export const Feedback = mongoose.model("Feedback", feedbackSchema);