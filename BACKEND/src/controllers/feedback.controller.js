import { Feedback } from "../models/feedback.model.js";
import { User } from "../models/user.model.js";

export const submitFeedback = async (req, res, next) => {
    try {
        const { message, rating, category } = req.body;
        
        let userId = null;
        let username = 'Anonymous';
        let email = 'anonymous@example.com';

        if (req.user) {
            userId = req.user._id;
            username = req.user.username;
            email = req.user.email;
        }

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Feedback message is required"
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Feedback message must be less than 2000 characters"
            });
        }

        const feedback = await Feedback.create({
            userId,
            username,
            email,
            message: message.trim(),
            rating: rating || null,
            category: category || 'general'
        });

        res.status(201).json({
            success: true,
            message: "Thank you for your feedback!",
            data: feedback
        });
    } catch (error) {
        next(error);
    }
};

export const getAllFeedback = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20, sort = 'desc' } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = sort === 'asc' ? 1 : -1;

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .sort({ createdAt: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Feedback.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: feedbacks,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getFeedbackStats = async (req, res, next) => {
    try {
        const stats = await Feedback.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const categoryStats = await Feedback.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        const avgRating = await Feedback.aggregate([
            {
                $match: { rating: { $ne: null } }
            },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                byStatus: stats.reduce((acc, s) => {
                    acc[s._id] = s.count;
                    return acc;
                }, {}),
                byCategory: categoryStats.reduce((acc, c) => {
                    acc[c._id] = c.count;
                    return acc;
                }, {}),
                averageRating: avgRating[0]?.avgRating ? Number(avgRating[0].avgRating.toFixed(1)) : null,
                total: await Feedback.countDocuments()
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateFeedbackStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const validStatuses = ['new', 'reviewed', 'addressed', 'archived'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const updateFields = {};
        if (status) updateFields.status = status;
        if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
        updateFields.isRead = true;

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found"
            });
        }

        res.status(200).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        next(error);
    }
};

export const markFeedbackAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found"
            });
        }

        res.status(200).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        next(error);
    }
};

export const deleteFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;

        const feedback = await Feedback.findByIdAndDelete(id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Feedback deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Feedback.countDocuments({ isRead: false, status: { $ne: 'archived' } });
        
        res.status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        next(error);
    }
};