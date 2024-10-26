// src/pages/api/messaging/[conversationId]/messages.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { EmailClient } from "@azure/communication-email";
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!req.method || !['GET', 'POST'].includes(req.method)) {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decodedToken = verifyAccessToken(token);
        if (!decodedToken?.userId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const { db } = await getCosmosClient();
        const conversationsCollection = db.collection('conversations');
        const messagesCollection = db.collection('messages');
        
        const { conversationId } = req.query;
        const { tenantId } = req.body;

        // Verify user belongs to conversation
        const conversation = await conversationsCollection.findOne({
            _id: new ObjectId(conversationId as string),
            tenantId,
            'participants.userId': decodedToken.userId
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (req.method === 'GET') {
            const messages = await messagesCollection
                .find({ conversationId })
                .sort({ timestamp: 1 })
                .toArray();

            return res.status(200).json(messages);
        }

        if (req.method === 'POST') {
            const { content, attachmentUrl } = req.body;
            
            const message = {
                conversationId,
                senderId: decodedToken.userId,
                content,
                attachmentUrl,
                timestamp: new Date(),
                read: false,
                tenantId
            };

            const result = await messagesCollection.insertOne(message);

            // Update conversation's last message
            await conversationsCollection.updateOne(
                { _id: new ObjectId(conversationId as string) },
                { 
                    $set: { 
                        lastMessage: message,
                        updatedAt: new Date()
                    }
                }
            );

            // Send email notification to other participants
            const emailClient = new EmailClient(process.env.AZURE_COMMUNICATIONS_CONNECTION_STRING!);
            interface Participant {
                userId: string;
                email: string;
            }

            interface Conversation {
                _id: ObjectId;
                tenantId: string;
                participants: Participant[];
                lastMessage?: any;
                updatedAt?: Date;
            }

            const otherParticipants: Participant[] = (conversation as Conversation).participants
                .filter((p: Participant) => p.userId !== decodedToken.userId);

            for (const participant of otherParticipants) {
                await emailClient.beginSend({
                    senderAddress: process.env.NOTIFICATION_EMAIL_SENDER!,
                    content: {
                        subject: 'New Message Received',
                        plainText: `You have a new message from ${decodedToken.firstName} ${decodedToken.lastName}`
                    },
                    recipients: {
                        to: [{ address: participant.email }]
                    }
                });
            }

            return res.status(201).json({ ...message, _id: result.insertedId });
        }
    } catch (error) {
        console.error('Error handling messages:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
