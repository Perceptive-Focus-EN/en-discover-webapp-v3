// pages/sections/pricing.tsx

import React from 'react';
import PricingPreviewSection from '../../components/HomePageComponents/PricingPreviewSection';

const PricingPage = () => {
    const dynamicText = "Pricing"; // Replace this with your dynamic text value

    return (
        <>
        <h1>{dynamicText}</h1>
      <PricingPreviewSection />
    </>
  );
};

export default PricingPage;
