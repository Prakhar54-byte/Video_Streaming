import mongoose, { Schema } from "mongoose";

const progressSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        roadmap: {
            type: Schema.Types.ObjectId,
            ref: "Roadmap",
            required: true,
        },
        completedItems: [
            {
                type: Schema.Types.ObjectId, // refers to the _id of the roadmapItem in the roadmap
                required: true,
            }
        ],
        percentage: {
            type: Number,
            default: 0,
        },
        lastAccessedItem: {
            type: Schema.Types.ObjectId,
        },
        status: {
            type: String,
            enum: ["started", "completed"],
            default: "started",
        }
    },
    {
        timestamps: true,
    }
);

export const Progress = mongoose.model("Progress", progressSchema);
