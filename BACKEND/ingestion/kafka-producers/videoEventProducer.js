import { Kafka, Partitioners } from "kafkajs";
import structuredLogger from "../../src/utils/structuredLogger.js";

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'backend-producer',
    brokers: (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || 'localhost:9092').split(','),
    connectionTimeout: Number(process.env.KAFKA_CONNECTION_TIMEOUT_MS || 3000),
    retry: {
        initialRetryTime: 100,
        retries: Number(process.env.KAFKA_CONNECT_RETRIES || 2),
        maxRetryTime: 3000,
        multiplier: 2,
    },
    requestTimeout: Number(process.env.KAFKA_REQUEST_TIMEOUT_MS || 5000),
});

const isTestEnv = Boolean(process.env.JEST_WORKER_ID) || process.env.NODE_ENV === 'test';
const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';

let producer = null;
let isConnected = false;

const getProducer = () => {
    if (isTestEnv || !kafkaEnabled) return null;
    if (producer) return producer;

    producer = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner,
        idempotent: true,
        maxInFlightRequests: 5,
    });
    return producer;
};

/**
 * Connect Kafka producer with timeout (non-blocking startup)
 */
export const connectProducer = async () => {
    if (isTestEnv || !kafkaEnabled) {
        structuredLogger.warn('Kafka producer disabled (test or disabled in env)', {});
        return;
    }

    const p = getProducer();
    if (!p) return;

    try {
        // Keep this short; local development can run without Kafka.
        const connectionPromise = p.connect();
        const timeoutMs = Number(process.env.KAFKA_STARTUP_TIMEOUT_MS || 5000);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Kafka connection timeout (${timeoutMs}ms)`)), timeoutMs)
        );
        
        await Promise.race([connectionPromise, timeoutPromise]);
        isConnected = true;
        structuredLogger.info('Kafka producer connected successfully', {});
    } catch (error) {
        structuredLogger.error('Failed to connect Kafka producer', {}, {
            errorMessage: error.message,
            broker: process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER,
            severity: 'warning', // Non-blocking
        });
        // Don't throw - allow server to start without Kafka
    }
};

/**
 * Send video event with retry logic
 * @param {string} eventType - Type of event
 * @param {object} videoData - Event data
 * @param {object} correlationIds - Correlation IDs for tracking
 */
export const sendVideoEvent = async (eventType, videoData, correlationIds = {}) => {
    const p = getProducer();
    if (!p || !isConnected) {
        structuredLogger.warn('Kafka producer not ready', correlationIds, {
            eventType,
            videoId: videoData.videoId,
        });
        return false;
    }

    const topic = process.env.KAFKA_VIDEO_TOPIC || 'video-events';
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            await p.send({
                topic,
                messages: [
                    {
                        key: videoData.videoId || `event-${Date.now()}`,
                        value: JSON.stringify({
                            ...videoData,
                            eventType,
                            timestamp: new Date().toISOString(),
                        }),
                        headers: {
                            'correlation-id': correlationIds.requestId || 'unknown',
                            'video-id': videoData.videoId || 'unknown',
                            'user-id': videoData.userId || 'unknown',
                        },
                    },
                ],
            });

            structuredLogger.logKafkaEvent(topic, eventType, correlationIds, {
                videoId: videoData.videoId,
                attempt: retries + 1,
            });

            return true;
        } catch (error) {
            retries++;
            structuredLogger.warn(`Kafka send attempt ${retries} failed`, correlationIds, {
                eventType,
                errorMessage: error.message,
                topic,
            });

            if (retries >= maxRetries) {
                structuredLogger.error(`Failed to send Kafka event after ${maxRetries} attempts`, correlationIds, {
                    eventType,
                    topic,
                    errorMessage: error.message,
                });
                return false;
            }

            // Exponential backoff
            await new Promise(r => setTimeout(r, Math.pow(2, retries) * 100));
        }
    }

    return false;
};

/**
 * Send batch events
 */
export const sendBatchEvents = async (topic, events, correlationIds = {}) => {
    const p = getProducer();
    if (!p || !isConnected) {
        structuredLogger.warn('Kafka producer not ready for batch', correlationIds, {
            topic,
            eventCount: events.length,
        });
        return false;
    }

    try {
        await p.send({
            topic,
            messages: events.map(event => ({
                key: event.videoId || `event-${Date.now()}`,
                value: JSON.stringify(event),
            })),
        });

        structuredLogger.info(`Batch sent to Kafka`, correlationIds, {
            topic,
            eventCount: events.length,
        });

        return true;
    } catch (error) {
        structuredLogger.error(`Failed to send batch to Kafka`, correlationIds, {
            topic,
            eventCount: events.length,
            errorMessage: error.message,
        });
        return false;
    }
};

/**
 * Disconnect producer
 */
export const disconnectProducer = async () => {
    const p = getProducer();
    if (p && isConnected) {
        try {
            await p.disconnect();
            isConnected = false;
            structuredLogger.info('Kafka producer disconnected', {});
        } catch (error) {
            structuredLogger.error('Error disconnecting producer', {}, {
                errorMessage: error.message,
            });
        }
    }
};

// Handle graceful shutdown
process.on('SIGINT', disconnectProducer);
process.on('SIGTERM', disconnectProducer);
