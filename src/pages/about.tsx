import React from 'react';
import {
    Typography, Container, Box, Button, Grid, Card, CardContent,
    Avatar, useTheme, styled
} from '@mui/material';
import { KeyboardArrowDown, LinkedIn, Twitter, ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';

const AboutBackground = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
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
    [theme.breakpoints.up('md')]: {
        textAlign: 'left',
        maxWidth: '50%',
    },
}));

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-10px)',
        boxShadow: theme.shadows[10],
    }
}));

const AboutTitle = styled(Typography)(({ theme }) => ({
    fontSize: '3rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
        fontSize: '2.5rem',
    },
}));

const AboutSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.25rem',
    fontWeight: 400,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(4),
}));

const CTAButton = styled(Button)(({ theme }) => ({
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

const AboutPage: React.FC = () => {
    const theme = useTheme();

    const teamMembers = [
        {
            name: 'Matthew Amen',
            role: 'CEO & Founder',
            image: 'https://media.licdn.com/dms/image/D4E03AQGF3dDF9heTuw/profile-displayphoto-shrink_800_800/0/1682010595757?e=1727913600&v=beta&t=qzfVbhpnOEVEGtXNEpIOfwiX_ArUy2p8ZAkJN9vm-yE',
            linkedin: 'https://www.linkedin.com/in/matthew-amen-93677a121/'
        },
        {
            name: 'Andrew Hinder',
            role: 'CTO',
            image: '/path-to-image.jpg',
            linkedin: '#'
        },
        {
            name: 'Xavier Manuel Mountain',
            role: 'Head of AI',
            image: '/path-to-image.jpg',
            linkedin: 'https://www.linkedin.com/in/xmanuel/'
        }
    ];

    return (
        <AboutBackground>
            <Container maxWidth="lg" style={{ backgroundColor: 'transparent' }}>
                <ContentWrapper>
                    <TextContent>
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <AboutTitle variant="h1">
                                About HuddleAI
                            </AboutTitle>
                            <AboutSubtitle variant="h2">
                                Empowering businesses with intelligent insights through cutting-edge AI technology.
                            </AboutSubtitle>
                            <Typography variant="body1" paragraph>
                                At HuddleAI, we believe that data-driven decision-making should be accessible to businesses of all sizes. Our mission is to democratize AI-powered analytics, providing enterprises with the tools they need to thrive in the digital age.
                            </Typography>
                            <Typography variant="body1" paragraph>
                                We&apos;re committed to continuous innovation, ethical AI practices, and exceptional customer support. With HuddleAI, you&apos;re not just getting a product – you&apos;re gaining a partner in your business growth journey.
                            </Typography>
                            <CTAButton
                                variant="contained"
                                color="primary"
                                size="large"
                                endIcon={<ArrowForward />}
                            >
                                Learn More
                            </CTAButton>
                        </motion.div>
                    </TextContent>
                    <Box
                        component={motion.img}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        src="/huddleaboutpageimage.png"
                        alt="HuddleAI Mission"
                        sx={{
                            width: '45%',
                            borderRadius: '10px',
                            boxShadow: theme.shadows[5],
                            display: { xs: 'none', md: 'block' }
                        }}
                    />
                </ContentWrapper>

                <Box mt={12}>
                    <Typography variant="h4" gutterBottom textAlign="center" color="primary.main">Our Team</Typography>
                    <Typography variant="body1" paragraph textAlign="center" sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
                        Meet the passionate individuals behind HuddleAI. Our diverse team of experts is dedicated to pushing the boundaries of AI technology and delivering exceptional value to our clients.
                    </Typography>
                    <Grid container spacing={4} justifyContent="center">
                        {teamMembers.map((member, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: index * 0.2 }}
                                >
                                    <StyledCard>
                                        <CardContent>
                                            <Avatar
                                                src={member.image}
                                                alt={member.name}
                                                sx={{ width: 120, height: 120, mb: 2, mx: 'auto' }}
                                            />
                                            <Typography variant="h6" component="h3" gutterBottom>
                                                {member.name.replace(/'/g, '&lsquo;').replace(/"/g, '&quot;')}
                                            </Typography>
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                                {member.role}
                                            </Typography>
                                            <Box mt={2}>
                                                <Button
                                                    startIcon={<LinkedIn />}
                                                    color="primary"
                                                    href={member.linkedin}
                                                >
                                                    LinkedIn
                                                </Button>
                                                <Button startIcon={<Twitter />} color="primary">
                                                    Twitter
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </StyledCard>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Box textAlign="center" mt={12}>
                    <Typography variant="h4" gutterBottom color="primary.main">Join Us on Our Journey</Typography>
                    <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
                        We&apos;re always looking for talented individuals who are passionate about AI and want to make a difference. Check out our careers page to see current openings.
                    </Typography>
                    <CTAButton
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<ArrowForward />}
                    >
                        View Careers
                    </CTAButton>
                </Box>
            </Container>

            <Box
                component={motion.div}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            >
                <Button
                    color="primary"
                    size="large"
                    onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                    startIcon={<KeyboardArrowDown />}
                >
                    Scroll
                </Button>
            </Box>
        </AboutBackground>
    );
};

export default AboutPage;