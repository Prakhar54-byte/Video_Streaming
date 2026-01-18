import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { log } from "node:console";


const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description, videoId } = req.body;
    
    if (!name) {
      throw new ApiError(400, "Playlist name is required");
    }
  
    const userId = req.user._id;
    
    let videos = [];
    if (videoId && Array.isArray(videoId)) {
      videos = videoId;
    } else if (videoId) {
      videos = [videoId];
    }
  
    const playlist = new Playlist({
      name,
      description: description || "",
      owner: userId, // Fixed: user -> owner
      videos: videos,
    });

    await playlist.save();
  
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist created successfully"));
  
  } catch (error) {
    throw new ApiError(400, error?.message || "Error while creating playlist");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
  
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
  
    const userPlaylists = await Playlist.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      { $project: { name: 1, description: 1, videos: 1, createdAt: 1, updatedAt: 1 } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);
  
    const totalPlaylists = await Playlist.countDocuments({ owner: userId });
  
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          playlists: userPlaylists,
          total: totalPlaylists,
          page,
          limit,
        },
        "User playlists fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(400, error?.message || "Error while fetching user playlists");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    console.log("Plag",playlistId);
    
    
    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)){
      throw new ApiError(400, "Invalid Playlist ID");
    }
  
    const playlist = await Playlist.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(playlistId) },
      },
      {
        $lookup: {
          from: "users", 
          localField: "owner",
          foreignField: "_id",
          // foreignField: "username",
          // foreignField: "avatar",
          as: "ownerDetails",
        },
      },
      {
        $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "videos", 
          localField: "videos",
          foreignField: "_id",
          // foreignField: "username",
          // foreignField: "avatar",
          as: "videoDetails",
        },
      },
      {
        $addFields: {
           ownerDetails: {
               _id: "$ownerDetails._id",
    username: { $ifNull: ["$ownerDetails.username", null] },
               fullName: { $ifNull: ["$ownerDetails.fullName", null] },
               avatar: "$ownerDetails.avatar"
           }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          "ownerDetails._id": 1,
    "ownerDetails.username": 1,
    "ownerDetails.fullName": 1,
    "ownerDetails.avatar": 1,
          videoDetails: 1, // Keep full video details if needed
          createdAt: 1,
          updatedAt: 1
        },
      },
    ]);

    if (!playlist?.length) {
        throw new ApiError(404, "Playlist not found");
    }

    // console.log("Fuck pla",playlist);
    
  
    return res
    .status(200)
    .json(
      new ApiResponse(
          200,
          playlist[0],
          "Playlist fetched successfully"
      )
    )
  } catch (error) {
    throw new ApiError(400, error?.message || "Error while fetching playlist");
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    
    if(!playlistId || !videoId || !mongoose.Types.ObjectId.isValid(playlistId) || 
    !mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, "Invalid Playlist ID or Video ID");
    }
  
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, owner: req.user._id },
      {
        $addToSet: { videos: videoId } // Fixed: key is 'videos', not 'videoId'
      },
      { new: true } 
    );
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found or you don't have permission");
    }

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Video added to playlist successfully"
      )
    )
  } catch (error) {
    throw new ApiError(400, error?.message || "Error adding video to playlist");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    
    if(!playlistId || !videoId || !mongoose.Types.ObjectId.isValid(playlistId) || 
    !mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, "Invalid Playlist ID or Video ID");
    }

    // Fixed: Changed findByIdAndDelete (which deletes Playlist) to findOneAndUpdate
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, owner: req.user._id },
      {
        $pull: { videos: videoId }
      },
      { new: true }
    );
  
    if (!playlist) {
        throw new ApiError(404, "Playlist not found or you don't have permission");
    }
  
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Video removed from playlist successfully"
      )
    )
  } catch (error) {
    throw new ApiError(400, error?.message || "Error removing video from playlist");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
  
    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)){
      throw new ApiError(400, "Invalid Playlist ID");
    }
  
    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
      owner: req.user._id
    });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or permission denied");
    }
  
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Playlist deleted successfully"
      )
    )
  } catch (e) {
    throw new ApiError(400, e?.message || "Error deleting playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
 try {
   const { playlistId } = req.params;
   const { name, description } = req.body;
 
   if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)){
     throw new ApiError(400, "Invalid Playlist ID");
   }
 
   if(!name && !description){
     throw new ApiError(400, "At least one field (name or description) is required");
   }

   const updateFields = {};
   if (name) updateFields.name = name;
   if (description) updateFields.description = description;
 
   const playlist = await Playlist.findOneAndUpdate(
     {
       _id: playlistId,
       owner: req.user._id
     },
     {
       $set: updateFields
     },
     {
       new: true
     }
   );
 
   if(!playlist){
     throw new ApiError(404, "Playlist not found or permission denied");
   }
 
   return res
     .status(200)
     .json(
       new ApiResponse(
         200,
         playlist,
         "Playlist updated successfully"
       )
     )
 } catch (error) {
  throw new ApiError(400, error?.message || "Error updating playlist");
 }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};