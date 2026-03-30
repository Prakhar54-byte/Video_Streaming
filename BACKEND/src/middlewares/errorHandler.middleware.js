import { promises } from "node:dns";
import logger from "../utils/logger.js"

export const errorHandler = (err,req,res,next)=>{
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const isDev = process.env.NODE_ENV !== 'production';

    logger.error({
        status,
        message,
        path:req.path,
        method : req.method,
        ip:req.ip,
        userId :req.user?._id,
        stack:err.stack

    });

    const responseMessage = isDev ? message : 'Internal Server Error';
    const resonseError = isDev ? err : undefined;

    req.status(status).json({
        success:false,
        status,
        message:responseMessage,
        ...err(isDev && { stack:err.stack})
    })
}

export const notFoundHandler = (req,res)=>{
    req.status(404).json({
        success:false,status:404,message:"Route not found"
    })


}

export const asyncHandler = (fn)=>(req,res,nest)=>{
    Promise.resolve(fn(req,res,next)).catch(next);
}