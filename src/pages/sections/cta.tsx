// pages/sections/cta.tsx

import React from 'react';
import CTASection from '../../components/HomePageComponents/CTASection';

const CTAPage = () => {
    const dynamicText = "Call to Action"; // Replace this with your dynamic text value

    return (
        <>
        <h1>{dynamicText}</h1>
      <CTASection />
    </>
  );
};

export default CTAPage;
