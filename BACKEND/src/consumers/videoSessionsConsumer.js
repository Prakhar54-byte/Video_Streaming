/**
 * Video Sessions Kafka Consumer
 * Consumes playback analytics events and stores in MongoDB
 */

import { Kafka, Partitioners } from 'kafkajs';
import structuredLogger from '../utils/structuredLogger.js';

class VideoSessionsConsumer {
  constructor(onMessageHandler) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'backend-consumer',
      brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
      },
    });

    this.consumer = null;
    this.onMessageHandler = onMessageHandler;
    this.isConnected = false;
  }

  /**
   * Connect and start consuming
   */
  async start() {
    try {
      this.consumer = this.kafka.consumer({
        groupId: process.env.KAFKA_CONSUMER_GROUP || 'backend-analytics-group',
        sessionTimeout: 30000,
        heartbeatInterval: 10000,
      });

      await this.consumer.connect();
      this.isConnected = true;

      structuredLogger.info('Kafka consumer connected', {}, {
        groupId: process.env.KAFKA_CONSUMER_GROUP,
      });

      // Subscribe to topic
      const topic = process.env.KAFKA_SESSIONS_TOPIC || 'video-sessions';
      await this.consumer.subscribe({ topic });

      // Start consuming
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            
            structuredLogger.debug('Consumed Kafka message', {}, {
              topic,
              partition,
              eventType: event.eventType,
            });

            // Call handler
            if (this.onMessageHandler) {
              await this.onMessageHandler(event);
            }
          } catch (error) {
            structuredLogger.error('Error processing Kafka message', {}, {
              errorMessage: error.message,
              topic,
            });
          }
        },
      });

      structuredLogger.info('Kafka consumer started consuming', {}, {
        topic,
      });
    } catch (error) {
      structuredLogger.error('Failed to start Kafka consumer', {}, {
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Disconnect consumer
   */
  async stop() {
    if (this.consumer && this.isConnected) {
      try {
        await this.consumer.disconnect();
        this.isConnected = false;
        structuredLogger.info('Kafka consumer disconnected', {});
      } catch (error) {
        structuredLogger.error('Error disconnecting consumer', {}, {
          errorMessage: error.message,
        });
      }
    }
  }
}

export default VideoSessionsConsumer;
