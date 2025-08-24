import amqplib from 'amqplib';
import { Buffer } from 'buffer';

// RabbitMQ connection URL from env
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

let channel;

async function connect() {
  if (channel) return channel;
  const connection = await amqplib.connect(RABBIT_URL);
  channel = await connection.createChannel();
  return channel;
}

export async function sendToQueue(queue, msg) {
  try {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), { persistent: true });
  } catch (err) {
    console.log('QueueService sendToQueue error:', err);
  }
}

export async function consumeQueue(queue, onMessage) {
  try {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    ch.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          await onMessage(content);
          ch.ack(msg);
        } catch (err) {
          console.log('QueueService consume message error:', err);
          ch.nack(msg, false, false); // discard message on error
        }
      }
    });
  } catch (err) {
    console.log('QueueService consumeQueue error:', err);
  }
}
