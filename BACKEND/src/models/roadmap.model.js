import mongoose, { Schema } from "mongoose";

const roadmapItemSchema = new Schema({
    type: {
        type: String,
        enum: ["video", "task"],
        required: true,
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    taskSnippet: {
        type: String, // code to display in the editor as a starting point
    }
});

const roadmapSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String, // cloudinary url
        },
        items: [roadmapItemSchema],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        category: {
            type: String,
            enum: ["gaming", "programming", "both"],
            default: "programming",
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "beginner",
        }
    },
    {
        timestamps: true,
    }
);

export const Roadmap = mongoose.model("Roadmap", roadmapSchema);
