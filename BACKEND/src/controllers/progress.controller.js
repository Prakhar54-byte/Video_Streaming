import mongoose from "mongoose";
import { Roadmap } from "../models/roadmap.model.js";
import { Progress } from "../models/progress.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const updateProgress = asyncHandler(async (req, res) => {
    const { roadmapId, milestoneId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(roadmapId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
        throw new ApiError(400, "Invalid Roadmap ID or Milestone ID");
    }

    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found");
    }

    const totalItems = roadmap.items.length;
    if (totalItems === 0) {
        throw new ApiError(400, "Roadmap has no items");
    }

    let progress = await Progress.findOne({ user: userId, roadmap: roadmapId });
    if (!progress) {
        throw new ApiError(404, "Progress not initialized. Please enroll in the roadmap first.");
    }

    // Add milestoneId to completedItems if not already there
    await Progress.updateOne(
        { _id: progress._id },
        { 
            $addToSet: { completedItems: milestoneId },
            $set: { lastAccessedItem: milestoneId }
        }
    );

    // Refresh progress to calculate percentage
    progress = await Progress.findById(progress._id);
    const completedCount = progress.completedItems.length;
    const newPercentage = Math.round((completedCount / totalItems) * 100);

    progress.percentage = newPercentage;
    if (newPercentage === 100) {
        progress.status = "completed";
    }
    await progress.save();

    return res.status(200).json(
        new ApiResponse(200, progress, "Progress updated successfully")
    );
});

const getProgressByRoadmap = asyncHandler(async (req, res) => {
    const { roadmapId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
        throw new ApiError(400, "Invalid Roadmap ID");
    }

    const progress = await Progress.findOne({ user: userId, roadmap: roadmapId })
        .populate("roadmap", "title description items");

    if (!progress) {
        throw new ApiError(404, "No progress found for this roadmap");
    }

    return res.status(200).json(
        new ApiResponse(200, progress, "Progress fetched successfully")
    );
});

export {
    updateProgress,
    getProgressByRoadmap
};
