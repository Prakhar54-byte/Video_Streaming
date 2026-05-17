import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../utils/logger.js";

const getConnectionString = (mongoUrl) => {
    const parsedUrl = new URL(mongoUrl);
    const hasDatabaseName = parsedUrl.pathname && parsedUrl.pathname !== '/';

    if (hasDatabaseName) {
        return mongoUrl;
    }

    parsedUrl.pathname = `/${DB_NAME}`;
    return parsedUrl.toString();
};

const connectDB = async () => {
    try {
        const mongoUrl  = process.env.MONGODB_URL ;
        if(!mongoUrl){
            throw new Error("MONGODB_URL is not defined in environment variables")
        }

        const options = {
            ssl: process.env.MONGODB_SSL === 'true' ? {
                rejectUnauthorized: false
            } : false,
            retryWrites: true,
            w: 'majority',
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
            minPoolSize: 5,
        }
        
        const connectionString = getConnectionString(mongoUrl);
        const connectionInstance = await mongoose.connect(connectionString, options)

        logger.info(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

        mongoose.connection.on('error', (err) => {
            logger.error("MONGODB connection error: ", err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn("MONGODB connection lost. Attempting to reconnect...");
        });
        return connectionInstance
    } catch (error) {
        logger.error("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB
