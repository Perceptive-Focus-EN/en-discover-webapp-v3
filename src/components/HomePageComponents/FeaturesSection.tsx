import React from 'react';
import { Typography, Box, Container, Grid, Button, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Lightbulb, Timeline, AttachMoney } from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import { useRouter } from 'next/router';

const FeatureBackground = styled(Box)(({ theme }) => ({
  padding: theme.spacing(12, 4),
  background: theme.palette.background.default,
  marginLeft: 0,
  marginRight: 0,
  marginColor: theme.palette.primary.main,
}));

const FeatureTitle = styled(Typography)(({ theme }) => ({
  fontSize: '3.5rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(8),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: '2.5rem',
  },
}));

const FeatureItem = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '12px',
  boxShadow: theme.shadows[3],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-10px)',
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  width: '64px',
  height: '64px',
  marginBottom: '24px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '& > svg': {
    fontSize: '48px',
    color: theme.palette.primary.main,
  },
}));

const FeatureItemTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const FeatureDescription = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
}));

const LearnMoreButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1, 3),
  borderRadius: '24px',
  color: theme.palette.primary.main,
  borderColor: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  borderRadius: '28px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

interface Feature {
  title: string;
  description: string;
  Icon: SvgIconComponent;
}

const FeaturesSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const handleCTAClick = () => {
    router.push('/#pricing', undefined, { shallow: true });
  };

  const handleLearnMoreClick = () => {
    router.push('/#learn-more', undefined, { shallow: true });
  };

  const features: Feature[] = [
    { 
      title: 'Smart Insights', 
      description: 'AI-powered analytics provide deep insights into your business data, helping you make informed decisions quickly and effectively.',
      Icon: Lightbulb
    },
    { 
      title: 'Real-Time Data', 
      description: 'Stay up-to-date with live updates and real-time analytics, allowing you to respond swiftly to market changes and emerging trends.',
      Icon: Timeline
    },
    { 
      title: 'Cost-Effective', 
      description: 'Access enterprise-grade AI capabilities at a fraction of the cost, making advanced analytics accessible to businesses of all sizes.',
      Icon: AttachMoney
    },
  ];

  return (
    <FeatureBackground>
      <Container maxWidth="lg">
      <FeatureTitle variant="h2">
          Transform Your Business with AI (This is your pitch statement)
        </FeatureTitle>
        <Grid container spacing={6}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <FeatureItem
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <FeatureIcon>
                  <feature.Icon />
                </FeatureIcon>
                <FeatureItemTitle variant="h3">
                  {feature.title}
                </FeatureItemTitle>
                <FeatureDescription>
                  {feature.description}
                </FeatureDescription>
                <LearnMoreButton variant="outlined" onClick={handleLearnMoreClick}>
                  Learn More
                </LearnMoreButton>
              </FeatureItem>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <CTAButton size="large" onClick={handleCTAClick}>
            Start Your Free Trial
          </CTAButton>
        </Box>
      </Container>
    </FeatureBackground>
  );
};

export default FeaturesSection;
