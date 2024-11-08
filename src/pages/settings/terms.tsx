import React from 'react';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { 
  Container, Typography, Box, Paper, 
  Divider, List, ListItem, ListItemText,
  Alert, AlertTitle
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
  maxWidth: '800px',
  margin: '0 auto',
  '& h2': {
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
}));

const WarningBox = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(1),
  '& .MuiAlertTitle-root': {
    marginBottom: theme.spacing(1),
    fontSize: '1.1rem',
  },
}));

const TermsPage: React.FC = () => {
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
          <GavelIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h2" gutterBottom>
            Terms of Service
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
          <WarningBox 
            severity="warning" 
            icon={<WarningAmberIcon fontSize="large" />}
          >
            <AlertTitle>Important Medical & Therapeutic Disclaimer</AlertTitle>
            <Typography variant="body1" paragraph>
              EN Discover by Perceptive Focus, Inc. is an emotional response and cognitive processing platform 
              based on psychological research. This platform, including any quizzes, assessments, or features:
            </Typography>
            <List>
              {[
                'Is NOT intended to diagnose, treat, cure, or prevent any mental health condition',
                'Should NOT be used as a replacement for professional therapy or prescribed medication',
                'Is designed to be complementary to professional medical/therapeutic services',
                'Is for educational and self-reflection purposes only',
                'May not be suitable or effective for all individuals',
              ].map((item, index) => (
                <ListItem key={index} dense>
                  <ListItemText 
                    primary={item}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontWeight: 500 
                      } 
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </WarningBox>

          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <AlertTitle>Critical Medical Warning</AlertTitle>
            <Typography variant="body2" paragraph>
              This platform may not be suitable for individuals with:
            </Typography>
            <List>
              {[
                'Diagnosed major depression or severe mental health conditions',
                'Uncontrolled strong emotional responses or psychosis',
                'History of severe trauma triggers',
                'Inability to distinguish digital interactions from reality',
                'Conditions requiring constant medical supervision'
              ].map((item, index) => (
                <ListItem key={index} dense>
                  <ListItemText 
                    primary={item}
                    sx={{ color: 'error.main' }}
                  />
                </ListItem>
              ))}
            </List>
          </Alert>

          <ContentSection elevation={0}>
            <Typography variant="h5" gutterBottom>
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" paragraph>
              By accessing or using our platform, you agree to be bound by these Terms of Service.
              If you disagree with any part of these terms, you may not access our service.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              2. Disclaimer of Liability
            </Typography>
            <Typography variant="body1" paragraph>
              Our platform explicitly disclaims liability for:
            </Typography>
            <List>
              {[
                'Any psychological or emotional impact resulting from platform use',
                'Unauthorized access or security breaches despite our security measures',
                'Data manipulation by AI, bots, or malicious actors',
                'Phishing attempts or social engineering attacks',
                'Account compromises outside our direct control',
                'Personal or professional consequences of sharing emotional data'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              3. Security Measures & Data Protection
            </Typography>
            <Typography variant="body1" paragraph>
              While we implement robust security measures, including:
            </Typography>
            <List>
              {[
                'End-to-end encryption of sensitive data',
                'Regular security audits and updates',
                'Automated token cleanup and management',
                'Role-based access control (RBAC)',
                'Strict permission management',
                'Regular security patches and updates'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              4. User Responsibilities
            </Typography>
            <Typography variant="body1" paragraph>
              Users are responsible for:
            </Typography>
            <List>
              {[
                'Maintaining account security and confidentiality',
                'Using the platform in an emotionally responsible manner',
                'Understanding the risks of sharing personal emotional data',
                'Reporting any security concerns or suspicious activities',
                'Complying with all applicable laws and regulations',
                'Protecting their own emotional and mental well-being'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              5. Data Privacy & Visibility
            </Typography>
            <Typography variant="body1" paragraph>
              We maintain strict data privacy controls:
            </Typography>
            <List>
              {[
                'All personal data is encrypted and secured',
                'Data visibility is strictly controlled by user permissions',
                'No unauthorized access to emotional or personal data',
                'Regular data protection audits',
                'Compliance with data protection regulations'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              6. Platform Updates & Security
            </Typography>
            <Typography variant="body1" paragraph>
              Our commitment to security includes:
            </Typography>
            <List>
              {[
                'Regular security updates and improvements',
                'Continuous monitoring for potential threats',
                'Implementation of latest security protocols',
                'Regular backup and disaster recovery testing',
                'Incident response planning and execution'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Alert severity="info" sx={{ mt: 4 }}>
              <AlertTitle>Contact Information</AlertTitle>
              For security concerns or questions about these terms, please contact us at:
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                security@yourplatform.com
              </Typography>
            </Alert>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              7. Enhanced Security Protocols
            </Typography>
            <Typography variant="body1" paragraph>
              Our multi-layered security approach includes:
            </Typography>
            <List>
              {[
                'AES-256 encryption for all stored emotional and personal data',
                'JWT token management with automatic expiration and renewal',
                'Real-time threat detection and prevention systems',
                'Multi-factor authentication options',
                'IP-based access controls and monitoring',
                'Regular penetration testing and vulnerability assessments',
                'Secure data backups with encryption at rest',
                'Compliance with HIPAA and GDPR security standards'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              8. User Guidelines & Best Practices
            </Typography>
            <Typography variant="body1" paragraph>
              For optimal and safe platform use:
            </Typography>
            <List>
              {[
                'Always maintain professional therapeutic relationships outside the platform',
                'Use the platform as a supplementary tool, not a primary treatment source',
                'Regularly consult with healthcare providers about platform usage',
                'Keep personal triggers and limitations in mind while using features',
                'Set healthy boundaries for platform engagement',
                'Report any concerning content or behaviors immediately',
                'Maintain confidentiality of your emotional data',
                'Regular review and update of your privacy settings'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" gutterBottom>
              9. Extended Liability Disclaimers
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Perceptive Focus, Inc. Disclaimer</AlertTitle>
              <Typography variant="body2">
                The EN Discover platform and associated services are provided "as is" without 
                any guarantees or warranties, express or implied. While based on psychological 
                research and cognitive theories, results and effectiveness may vary significantly 
                between individuals.
              </Typography>
            </Alert>
            <List>
              {[
                'We are not responsible for any decisions made based on platform insights',
                'Platform content should not be interpreted as professional medical advice',
                'User interactions and emotional responses are solely their responsibility',
                'We do not guarantee specific outcomes or improvements',
                'Platform availability and functionality may vary or be interrupted',
                'Third-party integrations are used at user\'s own risk',
                'Data loss or corruption despite security measures',
                'Changes in emotional state or psychological well-being'
              ].map((item, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Typography variant="h5" gutterBottom>
              10. Data Retention & Platform Usage
            </Typography>
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" paragraph>
                Perceptive Focus, Inc. implements the following data and platform policies:
              </Typography>
              <List>
                {[
                  'Medical information added to platform is at user\'s own risk and discretion',
                  'Data sharing with medical professionals or external users is user\'s responsibility',
                  'Platform reserves right to suspend accounts violating terms of service',
                  'Access to data may be restricted if platform is misused',
                  'All platform content and features are proprietary and protected by copyright',
                  'Unauthorized use or reproduction will be legally pursued',
                  'Data retention periods align with regulatory requirements and user preferences'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Typography variant="h5" gutterBottom>
              11. Financial Terms & Revenue Distribution
            </Typography>
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" paragraph>
                Platform usage involves the following financial considerations:
              </Typography>
              <List>
                {[
                  '20-30% platform fee for business transactions conducted through our services',
                  '5% transaction fee distribution:',
                  '• 3% allocated to global emergency assistance pool',
                  '• Support for STEM education initiatives',
                  '• Platform maintenance and security updates',
                  'Transaction fees subject to change with notice',
                  'All financial disputes subject to arbitration'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Typography variant="h5" gutterBottom>
              12. Legal Proceedings & Dispute Resolution
            </Typography>
            <Box sx={{ mb: 4 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Mandatory Arbitration Notice</AlertTitle>
                <Typography variant="body2">
                  By using this platform, you agree to resolve any disputes through arbitration.
                  All legal costs and fees will be the responsibility of the initiating party.
                </Typography>
              </Alert>
              <List>
                {[
                  'All disputes must be resolved through arbitration',
                  'Legal fees and costs borne by the initiating party',
                  'Platform reserves right to protect intellectual property',
                  'Unauthorized use will be prosecuted to fullest extent',
                  'Platform maintains discretion in legal proceedings'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Typography variant="h5" gutterBottom>
              13. Platform Purpose & Limitations
            </Typography>
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" paragraph>
                EN Discover is designed as an interpretative tool for emotional regulation through:
              </Typography>
              <List>
                {[
                  'Social engagement and community support',
                  'Educational resources and self-reflection tools',
                  'Structured emotional response frameworks',
                  'Complementary support to professional services',
                  'Platform effectiveness varies by individual',
                  'Results are interpretative and not definitive',
                  'Regular assessment of personal triggers and boundaries required'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Alert 
              severity="warning" 
              sx={{ 
                mt: 4, 
                backgroundColor: theme => theme.palette.warning.light,
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <AlertTitle>Final Acknowledgment</AlertTitle>
              <Typography variant="body2">
                By using EN Discover, you acknowledge that this platform is an interpretative 
                tool based on Perceptive Focus, Inc.'s understanding of emotional regulation. 
                Results, effectiveness, and risk levels may vary significantly and should not 
                be considered definitive or medical advice.
              </Typography>
            </Alert>
          </ContentSection>
        </motion.div>
      </Container>
    </Box>
  );
};

export default TermsPage;