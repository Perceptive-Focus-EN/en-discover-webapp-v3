// src/pages/api/messaging/conversations.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { ObjectId } from 'mongodb';
import {COLLECTIONS} from '@/constants/collections';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!['GET', 'POST'].includes(req.method!)) {
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

        const db = await getCosmosClient();
        const conversationsCollection = db.db.collection(COLLECTIONS.CONVERSATIONS);
        const { tenantId } = req.query;

        if (req.method === 'GET') {
            // Fetch all conversations for the user in the tenant
            const conversations = await conversationsCollection
                .find({
                    tenantId,
                    'participants.userId': decodedToken.userId
                })
                .sort({ updatedAt: -1 })
                .toArray();

            return res.status(200).json(conversations);
        }

        if (req.method === 'POST') {
            // Create new conversation
            const { participantId } = req.body;

            // Check if conversation already exists
            const existingConversation = await conversationsCollection.findOne({
                tenantId,
                participants: {
                    $all: [
                        { $elemMatch: { userId: decodedToken.userId } },
                        { $elemMatch: { userId: participantId } }
                    ]
                }
            });

            if (existingConversation) {
                return res.status(200).json(existingConversation);
            }

            // Get participant user info from users collection
            const usersCollection = db.db.collection(COLLECTIONS.USERS);
            const [currentUser, participant] = await Promise.all([
                usersCollection.findOne({ _id: new ObjectId(decodedToken.userId) }),
                usersCollection.findOne({ _id: new ObjectId(participantId) })
            ]);

            if (!participant) {
                return res.status(404).json({ message: 'Participant not found' });
            }

            // Create new conversation
            const newConversation = {
                tenantId,
                participants: [
                    {
                        userId: decodedToken.userId,
                        firstName: currentUser?.firstName,
                        lastName: currentUser?.lastName,
                        avatarUrl: currentUser?.avatarUrl,
                        role: currentUser?.role,
                        accountType: currentUser?.accountType,
                        email: currentUser?.email
                    },
                    {
                        userId: participantId,
                        firstName: participant.firstName,
                        lastName: participant.lastName,
                        avatarUrl: participant.avatarUrl,
                        role: participant.role,
                        accountType: participant.accountType,
                        email: participant.email
                    }
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                unreadCount: 0
            };

            const result = await conversationsCollection.insertOne(newConversation);
            return res.status(201).json({ ...newConversation, _id: result.insertedId });
        }
    } catch (error) {
        console.error('Error handling conversations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}