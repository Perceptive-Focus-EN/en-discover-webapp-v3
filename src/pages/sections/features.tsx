// pages/sections/features.tsx

import React from 'react';
import FeaturesSection from '../../components/HomePageComponents/FeaturesSection';

const FeaturesPage = () => {
    const dynamicText = "Features"; // Replace this with your dynamic text value

    return (
        <>
            <h1>{dynamicText}</h1>
      <FeaturesSection />
    </>
  );
};

export default FeaturesPage;
