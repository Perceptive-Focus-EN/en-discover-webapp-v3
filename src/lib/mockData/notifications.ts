// src/lib/mockData/notifications.ts

import React from 'react';
import { Notification, NotificationType } from '../../components/Notifications/types/notification';
import { 
  PersonAdd as PersonAddIcon,
  Cake as CakeIcon,
  Update as UpdateIcon,
  ThumbUp as ThumbUpIcon,
  Group as GroupIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  EmojiEvents as EmojiEventsIcon,
  CardMembership as CardMembershipIcon,
  LibraryBooks as LibraryBooksIcon
} from '@mui/icons-material';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'friend_request',
    userId: 'user1',
    userName: 'John Doe',
    userAvatar: 'https://mui.com/static/images/avatar/1.jpg',
    message: 'John Doe sent you a friend request',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
    badge: {
      type: 'friend_request',
      color: '#4CAF50',
      icon: React.createElement(PersonAddIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'Accept', action: () => console.log('Friend request accepted'), primary: true },
      { label: 'Decline', action: () => console.log('Friend request declined') }
    ]
  },
  {
    id: '2',
    type: 'birthday',
    userId: 'user2',
    userName: 'Jane Smith',
    userAvatar: 'https://mui.com/static/images/avatar/2.jpg',
    message: "It's Jane Smith's birthday today!",
    timestamp: new Date(Date.now() - 7200000),
    read: true,
    badge: {
      type: 'birthday',
      color: '#FFC107',
      icon: React.createElement(CakeIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'Send Wishes', action: () => console.log('Birthday wishes sent'), primary: true }
    ]
  },
  {
  id: '3',
  type: 'system_update',
  userId: 'system',
  userName: 'System',
  userAvatar: '/EN_LightMode.png', // Corrected path to the image in the public directory
  message: 'A new version of the app is available',
  timestamp: new Date(Date.now() - 10800000),
  read: false,
  badge: {
    type: 'system_update',
    color: '#2196F3',
    icon: React.createElement(UpdateIcon, { fontSize: 'small' })
  },
  actions: [
    { label: 'Update Now', action: () => console.log('App update started'), primary: true },
    { label: 'Later', action: () => console.log('App update postponed') }
  ]
},
  {
    id: '4',
    type: 'like',
    userId: 'user3',
    userName: 'Alice Johnson',
    userAvatar: 'https://mui.com/static/images/avatar/3.jpg',
    message: 'Alice Johnson liked your post',
    timestamp: new Date(Date.now() - 5400000),
    read: false,
    badge: {
      type: 'like',
      color: '#FF5722',
      icon: React.createElement(ThumbUpIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'View Post', action: () => console.log('Post viewed'), primary: true }
    ]
  },
  {
    id: '5',
    type: 'group_invite',
    userId: 'user4',
    userName: 'Bob Brown',
    userAvatar: 'https://mui.com/static/images/avatar/4.jpg',
    message: 'Bob Brown invited you to join the group "React Developers"',
    timestamp: new Date(Date.now() - 1800000),
    read: true,
    badge: {
      type: 'group_invite',
      color: '#9C27B0',
      icon: React.createElement(GroupIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'Join Group', action: () => console.log('Group joined'), primary: true },
      { label: 'Ignore', action: () => console.log('Group invite ignored') }
    ]
  },
  {
    id: '6',
    type: 'profile_view',
    userId: 'user5',
    userName: 'Charlie Davis',
    userAvatar: 'https://mui.com/static/images/avatar/5.jpg',
    message: 'Charlie Davis viewed your profile',
    timestamp: new Date(Date.now() - 600000),
    read: false,
    badge: {
      type: 'profile_view',
      color: '#3F51B5',
      icon: React.createElement(VisibilityIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'View Profile', action: () => console.log('Profile viewed'), primary: true }
    ]
  },
  {
    id: '7',
    type: 'message',
    userId: 'user6',
    userName: 'Diana Evans',
    userAvatar: 'https://mui.com/static/images/avatar/6.jpg',
    message: 'Diana Evans sent you a message',
    timestamp: new Date(Date.now() - 300000),
    read: false,
    badge: {
      type: 'message',
      color: '#009688',
      icon: React.createElement(MessageIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'Read Message', action: () => console.log('Message read'), primary: true }
    ]
  },
  {
    id: '8',
    type: 'achievement',
    userId: 'user7',
    userName: 'Eve Foster',
    userAvatar: 'https://mui.com/static/images/avatar/7.jpg',
    message: 'Congratulations! You have earned a new badge',
    timestamp: new Date(Date.now() - 150000),
    read: true,
    badge: {
      type: 'achievement',
      color: '#FFEB3B',
      icon: React.createElement(EmojiEventsIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'View Badge', action: () => console.log('Badge viewed'), primary: true }
    ]
  },
  {
    id: '9',
    type: 'membership',
    userId: 'user8',
    userName: 'Frank Green',
    userAvatar: 'https://mui.com/static/images/avatar/8.jpg',
    message: 'Your membership has been renewed',
    timestamp: new Date(Date.now() - 900000),
    read: false,
    badge: {
      type: 'membership',
      color: '#795548',
      icon: React.createElement(CardMembershipIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'View Membership', action: () => console.log('Membership viewed'), primary: true }
    ]
  },
  {
    id: '10',
    type: 'new_content',
    userId: 'user9',
    userName: 'Grace Harris',
    userAvatar: 'https://mui.com/static/images/avatar/9.jpg',
    message: 'New content is available in your library',
    timestamp: new Date(Date.now() - 450000),
    read: true,
    badge: {
      type: 'new_content',
      color: '#607D8B',
      icon: React.createElement(LibraryBooksIcon, { fontSize: "small" })
    },
    actions: [
      { label: 'View Content', action: () => console.log('Content viewed'), primary: true }
    ]
  }
];

export const getMockNotifications = () => mockNotifications;

export const getMockUnreadCount = () => mockNotifications.filter(n => !n.read).length;