// src/services/notificationService.ts

import { getCosmosClient } from '../config/azureCosmosClient';
import { COLLECTIONS } from '../constants/collections';
import { ObjectId } from 'mongodb';
import { DatabaseError } from '../MonitoringSystem/errors/specific';

export interface Notification {
  _id: ObjectId;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { db } = await getCosmosClient();
    const notificationsCollection = db.collection(COLLECTIONS.NOTIFICATIONS);

    const count = await notificationsCollection.countDocuments({
      userId,
      isRead: false
    });

    return count;
  } catch (error) {
    throw new DatabaseError('Failed to fetch unread notification count');
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const { db } = await getCosmosClient();
    const notificationsCollection = db.collection(COLLECTIONS.NOTIFICATIONS);

    await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { isRead: true } }
    );
  } catch (error) {
    throw new DatabaseError('Failed to mark notification as read');
  }
}

export async function createNotification(userId: string, message: string, type: string): Promise<void> {
  try {
    const { db } = await getCosmosClient();
    const notificationsCollection = db.collection(COLLECTIONS.NOTIFICATIONS);

    await notificationsCollection.insertOne({
      userId,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    });
  } catch (error) {
    throw new DatabaseError('Failed to create notification');
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const { db } = await getCosmosClient();
    const notificationsCollection = db.collection(COLLECTIONS.NOTIFICATIONS);

    await notificationsCollection.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  } catch (error) {
    throw new DatabaseError('Failed to mark all notifications as read');
  }
}

export async function fetchNotifications(userId: string, limit: number = 20, skip: number = 0): Promise<Notification[]> {
  try {
    const { db } = await getCosmosClient();
    const notificationsCollection = db.collection(COLLECTIONS.NOTIFICATIONS);

    const notifications = await notificationsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return notifications as Notification[];
  } catch (error) {
    throw new DatabaseError('Failed to fetch notifications');
  }
}