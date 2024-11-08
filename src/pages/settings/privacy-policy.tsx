import React from 'react';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { 
  Container, Typography, Box, Paper, 
  Divider, List, ListItem, ListItemText 
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

const HeaderSection = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light' 
    ? 'linear-gradient(135deg, #997CEF 0%, #6E43EB 100%)'
    : 'linear-gradient(135deg, #B49AF3 0%, #8E6BEF 100%)',
  padding: theme.spacing(8, 2),
  borderRadius: '0 0 2rem 2rem',
  marginBottom: theme.spacing(4),
  color: '#FFFFFF',
  textAlign: 'center',
}));

const ContentSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  '& h2': {
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
}));

const PolicySection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  '& p': {
    marginBottom: theme.spacing(2),
    lineHeight: 1.7,
  },
}));

const PrivacyPolicyPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <Box>
      <HeaderSection>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SecurityIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h2" gutterBottom>
            Privacy Policy
          </Typography>
          <Typography variant="subtitle1">
            Last updated: {new Date().toLocaleDateString()}
          </Typography>
        </motion.div>
      </HeaderSection>

      <Container maxWidth="md">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <ContentSection elevation={0}>
            <PolicySection>
              <Typography variant="h5" gutterBottom>
                1. Introduction
              </Typography>
              <Typography variant="body1">
                Welcome to our Privacy Policy. Your privacy is critically important to us. 
                This document outlines our policies regarding the collection, use, and disclosure 
                of Personal Information we receive from users of our services.
              </Typography>
            </PolicySection>

            <Divider sx={{ my: 4 }} />

            <PolicySection>
              <Typography variant="h5" gutterBottom>
                2. Information Collection
              </Typography>
              <List>
                {[
                  'Personal identification information (Name, email address, phone number)',
                  'Usage data and analytics',
                  'Device and browser information',
                  'Cookies and tracking technologies'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText 
                      primary={item}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '1rem',
                          color: 'text.primary',
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </PolicySection>

            <Divider sx={{ my: 4 }} />

            <PolicySection>
              <Typography variant="h5" gutterBottom>
                3. How We Use Your Information
              </Typography>
              <Typography variant="body1" paragraph>
                We use the collected information for various purposes:
              </Typography>
              <List>
                {[
                  'To provide and maintain our Service',
                  'To notify you about changes to our Service',
                  'To provide customer support',
                  'To gather analysis or valuable information to improve our Service'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText 
                      primary={item}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '1rem',
                          color: 'text.primary',
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </PolicySection>

            <Divider sx={{ my: 4 }} />

            <PolicySection>
              <Typography variant="h5" gutterBottom>
                4. Data Protection
              </Typography>
              <Typography variant="body1">
                We implement appropriate technical and organizational security measures to protect 
                your personal information against accidental or unlawful destruction, loss, 
                alteration, unauthorized disclosure, or access.
              </Typography>
            </PolicySection>

            <PolicySection>
              <Typography variant="h5" gutterBottom>
                5. Contact Us
              </Typography>
              <Typography variant="body1">
                If you have any questions about this Privacy Policy, please contact us at:
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'primary.main',
                  mt: 1,
                  fontWeight: 500
                }}
              >
                privacy@yourcompany.com
              </Typography>
            </PolicySection>
          </ContentSection>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PrivacyPolicyPage;