import mongoose from "mongoose";
import { Queue }from "../models/queue.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { add } from "date-fns";

const getQueue = asyncHandler(async(req,res)=>{
    let queue = await Queue.findOne(({
        owner:req.user._id
    }).populate('videos'));

    if(!queue){
        queue =await Queue.create({
            owner:req.user._id,
            videos:[],
        })
    }
    return res.status(200).json(new ApiResponse(true,"Queue fetched successfully",queue));
})


const addToQueue = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video ID");
    }

    let queue = await Queue.findOne({owner:req.user._id});

    if(!queue){
        queue  = await Queue.create({owner:req.user._id,videos:[]});
    }else{
        queue.videos.push(videoId);
        await queue.save();
    }
    return res.status(200).json(new ApiResponse(true,"Video added to queue successfully",queue));
})


const clearQueue = asyncHandler(async(req,res)=>{
    const q = await Queue.findByIdAndUpdate(
        {owner:req.user._id},
        {$set:{videos:[]}},
        {new:true}
    )
    return res.status(200).json(new ApiResponse(true,"Queue cleared successfully",q));
})

const removeFromQueue = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    const q = await Queue.findOneAndUpdate(
        {owner:req.user._id},
        {$pull:{videos:videoId}},
        {new:true}
    )
    return res.status(200).json(new ApiResponse(true,"Video removed from queue successfully",q));
})

export {getQueue,addToQueue,clearQueue,removeFromQueue};