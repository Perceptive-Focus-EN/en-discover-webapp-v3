// src/pages/store.tsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import StoreLayout from '../components/Store/StoreLayout';
import { StoreItem } from '../components/Store/types/store';

const StorePage: React.FC = () => {
  const storeData = {
    categories: [
      {
        title: "Additional Features",
        items: [
          {
            type: 'feature',
            title: 'Family',
            description: 'Create tasks for your children, manage their time and monitor their well-being',
            price: { amount: 58, currency: '$', period: 'month' },
            image: '/images/store/family-feature.png',
          },
          {
            type: 'feature',
            title: 'Balance View',
            description: 'Track your mood balance in an easy and clear way',
            price: { amount: 12, currency: '$', period: 'month' },
            image: '/images/store/balance-view.png',
          },
          // Add more feature items as needed
        ] as StoreItem[]
      },
      {
        title: "Color Palettes",
        items: [
          {
            type: 'colorPalette',
            title: 'Solid',
            description: 'A solid color palette for clear emotion representation',
            price: { amount: 5, currency: '$', period: 'month' },
            image: '/images/store/solid-palette.png',
          },
          {
            type: 'colorPalette',
            title: 'Gradient',
            description: 'Beautiful gradient palettes for nuanced emotion display',
            price: { amount: 7, currency: '$', period: 'month' },
            image: '/images/store/gradient-palette.png',
          },
          // Add more color palette items as needed
        ] as StoreItem[]
      },
      {
        title: "App Styles",
        items: [
          {
            type: 'feature',
            title: 'Dark Mode',
            description: 'Switch to a sleek dark mode for comfortable nighttime use',
            price: { amount: 3, currency: '$', period: 'month' },
            image: '/images/store/dark-mode.png',
          },
          {
            type: 'feature',
            title: 'Custom Themes',
            description: 'Personalize your app with custom color themes',
            price: { amount: 8, currency: '$', period: 'month' },
            image: '/images/store/custom-themes.png',
          },
          // Add more app style items as needed
        ] as StoreItem[]
      },
      {
        title: "Personal Analytics",
        items: [
          {
            type: 'feature',
            title: 'Advanced Insights',
            description: 'Get deeper insights into your emotional patterns',
            price: { amount: 15, currency: '$', period: 'month' },
            image: '/images/store/advanced-insights.png',
          },
          {
            type: 'feature',
            title: 'Mood Forecasting',
            description: 'Predict future mood trends based on your data',
            price: { amount: 20, currency: '$', period: 'month' },
            image: '/images/store/mood-forecasting.png',
          },
          // Add more personal analytics items as needed
        ] as StoreItem[]
      },
      {
        title: "Spotify Playlists",
        items: [
          {
            type: 'spotify',
            title: 'Orange Mood',
            description: 'Energetic playlist for your upbeat moments',
            price: { amount: 2, currency: '$', period: 'month' },
            image: '/images/store/orange-mood.png',
          },
          {
            type: 'spotify',
            title: 'Blue Mood',
            description: 'Calming tunes for your relaxed states',
            price: { amount: 2, currency: '$', period: 'month' },
            image: '/images/store/blue-mood.png',
          },
          // Add more Spotify playlist items as needed
        ] as StoreItem[]
      },
      {
        title: "Bundles",
        items: [
          {
            type: 'bundle',
            title: 'Family Year Bundle',
            description: 'Including Family functionality, Overseeing functions, T-shirt for each member, Spotify playlists',
            price: { amount: 900, currency: '$', period: 'one-time' },
            recurringPrice: { amount: 100, currency: '$', period: 'month' },
            image: '/images/store/family-bundle.png',
          },
          {
            type: 'bundle',
            title: 'Premium Package',
            description: 'Access to all premium features and analytics',
            price: { amount: 500, currency: '$', period: 'year' },
            image: '/images/store/premium-bundle.png',
          },
          // Add more bundle items as needed
        ] as StoreItem[]
      },
    ]
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        EN Store
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Enhance your emotional journey with our premium features and add-ons.
      </Typography>
      <StoreLayout categories={storeData.categories} />
    </Box>
  );
};

export default StorePage;