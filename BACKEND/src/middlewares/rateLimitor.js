import rateLimit from 'express-rate-limit'


export const apiLimiter = rateLimit({
    windowMs:15*60*1000,//15 minutes
    max:process.env.RATE_LIMIT_MAX || 100,
    message:"Too many request from this IP,please try again later",
    standardHeaders:true,
    legacyHeaders:false,
    skip:(req)=>req.path==='/ping',
})


export const authLimiter = rateLimit({
    windowMs:15*60*1000,
        max : process.env.AUTH_RATE_LIMIT_MAX || 5,
    message:'Too many login attempts',
    skipSuccessfulRequests:true, // Dont count succesful logins
    skipFailedRequests:false // count all failed attepts

})
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.UPLOAD_RATE_LIMIT_MAX || 10,
    message: 'Too many videos uploaded, try again later'
});

// Search limiter
export const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.SEARCH_RATE_LIMIT_MAX || 30,
    message: 'Too many search requests'
});