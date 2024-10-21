// src/pages/api/message-queue/[action].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { MessageQueueService } from '../../../services/MessageQueueService';

const messageQueueService = new MessageQueueService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;
  const { queueName, message } = req.body;

  try {
    if (req.method === 'POST') {
      if (action === 'send') {
        // Send a message to the specified queue
        await messageQueueService.sendMessage(queueName, message);
        return res.status(200).json({ message: `Message sent to queue: ${queueName}` });
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    } else if (req.method === 'GET') {
      if (action === 'receive') {
        // Receive messages from the specified queue
        await messageQueueService.receiveMessages(queueName, async (msg) => {
          console.log(`Received message: ${msg}`);
        });
        return res.status(200).json({ message: `Receiving messages from queue: ${queueName}` });
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res.status(500).json({ error: `Failed to process ${action} message queue action: ${errorMessage}` });
  }
}
