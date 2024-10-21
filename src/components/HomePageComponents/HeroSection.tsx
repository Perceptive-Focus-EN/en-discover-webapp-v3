import React from 'react';
import { Typography, Box, Button, Container, styled, useMediaQuery, useTheme } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

const HeroBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent', // This ensures no background color
  padding: 0,
  margin: 0,
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));

const TextContent = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  [theme.breakpoints.up('md')]: {
    textAlign: 'left',
    maxWidth: '60%',
  },
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontSize: '3.5rem',
  fontWeight: 700,
  color: '#333',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    fontSize: '2.5rem',
  },
}));

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 500,
  color: '#666777',
  marginBottom: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    marginBottom: 0,
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  fontWeight: 'bold',
  padding: theme.spacing(1.5, 4),
  borderRadius: '30px',
  fontSize: '1rem',
  textTransform: 'uppercase',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  backgroundColor: '#007BFF',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
    backgroundColor: '#0056b3',
  },
  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(2),
  },
}));

const HeroSection: React.FC = () => {
  const router = useRouter();

  const handleCTAClick = () => {
    // Instantly set the page location to the pricing section
    router.push('/#pricing', undefined, { shallow: true });
  };

  return (
    <HeroBackground>
      <Container maxWidth="lg" style={{ backgroundColor: 'transparent' }}>        
        <ContentWrapper>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <TextContent>
              <HeroTitle variant="h1">
                Empower Your Business with AI
              </HeroTitle>
              <HeroSubtitle variant="h2">
                PERMAS turns your data into actionable insights, driving growth and innovation.
              </HeroSubtitle>
            </TextContent>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <CTAButton
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleCTAClick}
            >
              START YOUR FREE TRIAL
            </CTAButton>
          </motion.div>
        </ContentWrapper>
      </Container>
    </HeroBackground>
  );
};

export default HeroSection;
