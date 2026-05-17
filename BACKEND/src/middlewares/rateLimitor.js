import rateLimit from 'express-rate-limit'

const toPositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const apiLimiter = rateLimit({
    windowMs:15*60*1000,//15 minutes
    max: toPositiveInteger(process.env.RATE_LIMIT_MAX, 100),
    message:"Too many request from this IP,please try again later",
    standardHeaders:true,
    legacyHeaders:false,
    skip:(req)=>req.path==='/ping',
    validate: { xForwardedForHeader: false },
})


export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max : toPositiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 5),
    message:'Too many login attempts',
    skipSuccessfulRequests:true, // Dont count succesful logins
    skipFailedRequests:false, // count all failed attepts
    validate: { xForwardedForHeader: false },
})
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: toPositiveInteger(process.env.UPLOAD_RATE_LIMIT_MAX, 10),
    message: 'Too many videos uploaded, try again later',
    validate: { xForwardedForHeader: false },
});

// Search limiter
export const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: toPositiveInteger(process.env.SEARCH_RATE_LIMIT_MAX, 30),
    message: 'Too many search requests',
    validate: { xForwardedForHeader: false },
});
