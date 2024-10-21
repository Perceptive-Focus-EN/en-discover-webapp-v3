import React, { useState } from 'react';
import { Typography, Box, Button, Container, TextField, styled, useMediaQuery, useTheme } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CTABackground = styled(Box)(({ theme }) => ({
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));

const TextContent = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  [theme.breakpoints.up('md')]: {
    textAlign: 'left',
    maxWidth: '50%',
  },
}));

const FormContent = styled(Box)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    width: '40%',
    marginTop: 0,
  },
}));

const CTATitle = styled(Typography)(({ theme }) => ({
  fontSize: '3rem',
  fontWeight: 700,
  color: '#333',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    fontSize: '2.5rem',
  },
}));

const CTASubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 400,
  color: '#666',
  marginBottom: theme.spacing(4),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
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
}));

const CTASection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showEmailForm, setShowEmailForm] = useState(false);

  return (
    <CTABackground>
      <Container maxWidth="lg" style={{ backgroundColor: 'transparent' }}>
        <ContentWrapper>
          <TextContent>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <CTATitle variant="h2">
                THIS IS WHERE YOU FUTURE BUSINESS MOTO WILL BE?
              </CTATitle>
              <CTASubtitle variant="h6">
                Join thousands of businesses already using PERMAS to drive growth and innovation.
              </CTASubtitle>
              <CTAButton
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => setShowEmailForm(true)}
              >
                Schedule a Demo
              </CTAButton>
            </motion.div>
          </TextContent>
          <FormContent>
            <AnimatePresence>
              {showEmailForm && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <StyledTextField
                    variant="outlined"
                    placeholder="Enter your email"
                    fullWidth
                  />
                  <CTAButton
                    variant="contained"
                    color="primary"
                    size="large"
                    endIcon={<ArrowForward />}
                    fullWidth
                  >
                    GET STARTED
                  </CTAButton>
                </motion.div>
              )}
            </AnimatePresence>
          </FormContent>
        </ContentWrapper>
      </Container>
    </CTABackground>
  );
};

export default CTASection;