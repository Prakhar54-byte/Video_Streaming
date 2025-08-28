import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "spark-video-event-producer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
  console.log("Kafka producer connected");
};

export const sendVideoEvent = async (eventType, videoData) => {
  await producer.send({
    topic: process.env.KAFKA_VIDEO_TOPIC || "video-events",
    messages: [
      {
        value: JSON.stringify({
          ...videoData,
          eventType,
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
};

// Disconnect the producer when the application is shutting down
process.on("SIGINT", async () => {
  await producer.disconnect();
  console.log("Kafka producer disconnected");
  process.exit(0);
});
