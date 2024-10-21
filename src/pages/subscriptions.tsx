import React, { useState } from 'react';
import {
    Typography, Container, Box, Button, Grid, Card, CardContent, CardActions,
    Switch, FormControlLabel, Fade, Grow,
    IconButton, useTheme, styled
} from '@mui/material';
import { CheckCircle, KeyboardArrowDown } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51OwuULLt3zch3Eg15NqtuNh4VO2q6PUP3vZgml2gQbSxZWeCNH77C7DU5snb4IlAglneYmHo71yvQbej83GgTBfX00v8OAu3kl');

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-10px)',
        boxShadow: theme.shadows[10],
    }
}));

const SubscriptionPage: React.FC = () => {
    const [annualBilling, setAnnualBilling] = useState(false);
    const theme = useTheme();

    const plans = [
        {
            name: 'Starter',
            monthlyPrice: 29,
            annualPrice: 290,
            features: ['Basic analytics', '5 team members', '5GB storage', 'Email support'],
        },
        {
            name: 'Professional',
            monthlyPrice: 99,
            annualPrice: 990,
            features: ['Advanced analytics', 'Unlimited team members', '50GB storage', 'Priority support'],
        },
        {
            name: 'Enterprise',
            monthlyPrice: 299,
            annualPrice: 2990,
            features: ['Custom analytics', 'Dedicated account manager', 'Unlimited storage', '24/7 phone support'],
        },
    ];

    const handleSubscribe = async (planName: string) => {
        const stripe = await stripePromise;
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planName,
                annualBilling,
            }),
        });
        const session = await response.json();
        const result = await stripe?.redirectToCheckout({
            sessionId: session.id,
        });
        if (result?.error) {
            console.error(result.error);
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
            <Container maxWidth="lg" style={{ backgroundColor: 'transparent' }}>
                <Fade in timeout={1000}>
                    <Box textAlign="center" mb={8}>
                        <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', mb: 4, color: 'primary.main' }}>
                            Choose Your Plan
                        </Typography>
                        <Typography variant="h5" component="p" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
                            Select the perfect plan to unlock the full potential of HuddleAI for your business.
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={annualBilling}
                                    onChange={() => setAnnualBilling(!annualBilling)}
                                    color="primary"
                                />
                            }
                            label={annualBilling ? 'Annual Billing' : 'Monthly Billing'}
                        />
                        {annualBilling && (
                            <Typography variant="subtitle1" color="primary">
                                Save 20% with annual billing
                            </Typography>
                        )}
                    </Box>
                </Fade>

                <Grow in timeout={1500}>
                    <Grid container spacing={4} justifyContent="center">
                        {plans.map((plan, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <StyledCard>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h4" component="h2" gutterBottom color="primary">
                                            {plan.name}
                                        </Typography>
                                        <Typography variant="h3" component="p" color="primary" gutterBottom>
                                            ${annualBilling ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
                                            <Typography variant="subtitle1" component="span">
                                                /month
                                            </Typography>
                                        </Typography>
                                        {annualBilling && (
                                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                                Billed annually (${plan.annualPrice}/year)
                                            </Typography>
                                        )}
                                        <Box mt={2}>
                                            {plan.features.map((feature, featureIndex) => (
                                                <Box key={featureIndex} display="flex" alignItems="center" mb={1}>
                                                    <CheckCircle color="primary" sx={{ mr: 1 }} />
                                                    <Typography>{feature}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button 
                                            fullWidth 
                                            variant="contained" 
                                            color="primary"
                                            onClick={() => handleSubscribe(plan.name)}
                                        >
                                            Subscribe
                                        </Button>
                                    </CardActions>
                                </StyledCard>
                            </Grid>
                        ))}
                    </Grid>
                </Grow>
            </Container>

            <Box 
                sx={{ 
                    position: 'fixed', 
                    bottom: 20, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    animation: 'bounce 2s infinite'
                }}
            >
                <IconButton 
                    color="primary" 
                    size="large" 
                    onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                >
                    <KeyboardArrowDown />
                </IconButton>
            </Box>

            <style jsx global>{`
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }
            `}</style>
        </Box>
    );
};

export default SubscriptionPage;