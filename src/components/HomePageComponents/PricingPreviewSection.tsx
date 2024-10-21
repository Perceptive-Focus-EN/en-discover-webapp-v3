import React from 'react';
import { Typography, Box, Container, styled, Button, Grid, Card, CardContent, CardActions } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowForward } from '@mui/icons-material';

const PricingBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
}));

const TextContent = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    textAlign: 'left',
    marginBottom: 0,
    maxWidth: '40%',
  },
}));

const PricingTitle = styled(Typography)(({ theme }) => ({
  fontSize: '3rem',
  fontWeight: 700,
  color: '#333',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    fontSize: '2.5rem',
  },
}));

const PricingDescription = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 400,
  color: '#666',
  marginBottom: theme.spacing(4),
}));

const PricingCardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    width: '55%',
  },
}));

const PricingCard = styled(Card)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(3),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: theme.shadows[10],
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontWeight: 'bold',
  padding: theme.spacing(1.5, 4),
  borderRadius: '30px',
  fontSize: '1rem',
  textTransform: 'uppercase',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
  },
}));

const PricingPreviewSection: React.FC = () => {
  const plans = [
    { name: 'Starter', price: '29', feature: 'Basic analytics' },
    { name: 'Professional', price: '99', feature: 'Advanced analytics' },
    { name: 'Enterprise', price: '299', feature: 'Custom analytics' },
  ];

  return (
    <PricingBackground>
      <Container maxWidth="lg" style={{ backgroundColor: 'transparent' }}>
        <ContentWrapper>
          <TextContent>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <PricingTitle variant="h2">
                Simple, Transparent Pricing
              </PricingTitle>
              <PricingDescription variant="body1">
                Choose the plan that fits your business needs. Our pricing is designed to scale with your company, ensuring you always have the right tools at the right price.
              </PricingDescription>
              <Link href="/subscription" passHref>
                <CTAButton
                  variant="contained"
                  color="primary"
                  size="large"
                  endIcon={<ArrowForward />}
                >
                  View Full Pricing Details
                </CTAButton>
              </Link>
            </motion.div>
                  </TextContent>
                      <PricingCardContainer>
      {plans.map((plan, index) => (
        <motion.div
          key={plan.name}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: index * 0.2 }}
          // Remove the 'flex' property
          style={{}} // Ensure motion.div takes full height
        >
          <PricingCard>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {plan.name}
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                ${plan.price}
                <Typography variant="caption" component="span">/month</Typography>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {plan.feature}
              </Typography>
            <CardActions>
              <Button variant="outlined" color="primary" fullWidth>
                Choose Plan
              </Button>
            </CardActions>
          </PricingCard>
          </motion.div>
        ))}
    </PricingCardContainer>
        </ContentWrapper>
      </Container>
    </PricingBackground>
  );
};

export default PricingPreviewSection;