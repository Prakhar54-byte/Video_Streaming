import mongoose from "mongoose";
import { Roadmap } from "../models/roadmap.model.js";
import { Progress } from "../models/progress.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createRoadmap = asyncHandler(async (req, res) => {
    const { title, description, items, category, difficulty } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const roadmap = await Roadmap.create({
        title,
        description,
        items: items || [],
        category: category || "programming",
        difficulty: difficulty || "beginner",
        owner: req.user._id,
    });

    return res.status(201).json(
        new ApiResponse(201, roadmap, "Roadmap created successfully")
    );
});

const getRoadmaps = asyncHandler(async (req, res) => {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const roadmaps = await Roadmap.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Roadmap.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200, 
            { roadmaps, total, page, limit }, 
            "Roadmaps fetched successfully"
        )
    );
});

const getRoadmapById = asyncHandler(async (req, res) => {
    const { roadmapId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
        throw new ApiError(400, "Invalid Roadmap ID");
    }

    const roadmap = await Roadmap.findById(roadmapId).populate("items.video");

    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found");
    }

    return res.status(200).json(
        new ApiResponse(200, roadmap, "Roadmap fetched successfully")
    );
});

const enrollInRoadmap = asyncHandler(async (req, res) => {
    const { roadmapId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
        throw new ApiError(400, "Invalid Roadmap ID");
    }

    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found");
    }

    // Add to user's enrolled roadmaps if not already there
    await User.findByIdAndUpdate(userId, {
        $addToSet: { enrolledRoadmaps: roadmapId }
    });

    // Initialize progress if it doesn't exist
    let progress = await Progress.findOne({ user: userId, roadmap: roadmapId });
    if (!progress) {
        progress = await Progress.create({
            user: userId,
            roadmap: roadmapId,
            completedItems: [],
            percentage: 0
        });
    }

    return res.status(200).json(
        new ApiResponse(200, progress, "Enrolled in roadmap successfully")
    );
});

export {
    createRoadmap,
    getRoadmaps,
    getRoadmapById,
    enrollInRoadmap
};
