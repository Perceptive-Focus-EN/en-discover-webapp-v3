// // src/components/Onboarding/Steps/SubscriptionSelectionStep.tsx

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import { Box, Typography, Button, Card, CardContent, CardActions, Grid, CircularProgress } from '@mui/material';
// import { SUBSCRIPTION_PLANS } from '../../../constants/subscriptionPlans';
// import { formatStorage, formatExecutions } from '../../../utils/unitConversion';
// import { SubscriptionPlanType } from '../../../types/Subscription/types';
// import { OnboardingStepName } from '../../../types/Onboarding/interfaces';
// import { useSubscription } from '../../../contexts/SubscriptionContext';
// import { useOnboarding } from '../../../contexts/OnboardingContext';
// import { useAuth } from '../../../contexts/AuthContext';

// interface SubscriptionSelectionStepProps {
//     onSubmit: (stepName: OnboardingStepName, data: { subscriptionPlan: SubscriptionPlanType }) => Promise<void>;
// }

// const SubscriptionSelectionStep: React.FC<SubscriptionSelectionStepProps> = ({ onSubmit }) => {
//     const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | null>(null);
//     const router = useRouter();
//     const { moveToNextStep } = useOnboarding();
//     const { refreshUser } = useAuth();

//     const { createCheckoutSession, subscription, loading, error, refreshSubscription } = useSubscription();
//     const [subscriptionHandled, setSubscriptionHandled] = useState(false);

//     // Handle successful subscription after redirection
//     useEffect(() => {
//         if (router.query.session_id && !subscriptionHandled) {
//             handleSubscriptionSuccess();
//             setSubscriptionHandled(true);
//         }
//     }, [router.query, subscriptionHandled]);

//     const handleSubscriptionSuccess = async () => {
//         try {
//             const currentSubscription = await refreshSubscription() as unknown as { plan: SubscriptionPlanType };
//             if (currentSubscription && currentSubscription.plan) {
//                 await onSubmit('SubscriptionSelection', { subscriptionPlan: currentSubscription.plan });
//                 await refreshUser();
//                 moveToNextStep();
//             } else {
//                 throw new Error('Invalid subscription plan');
//             }
//         } catch (error) {
//             console.error('Error verifying subscription:', error);
//             alert('There was an issue verifying your subscription. Please try again.');
//         }
//     };

//     const handleSelectPlan = (plan: SubscriptionPlanType) => {
//         setSelectedPlan(plan);
//         const card = document.getElementById(`plan-card-${plan}`);
//         if (card) {
//             card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], {
//                 duration: 300,
//                 easing: 'ease-in-out',
//             });
//         }
//     };

//     const handleSubmit = async () => {
//         if (selectedPlan) {
//             try {
//                 const checkoutResponse = await createCheckoutSession({
//                     subscriptionPlanType: selectedPlan,
//                     successUrl: `${window.location.origin}/onboarding?step=subscription-success&session_id={CHECKOUT_SESSION_ID}`,
//                     cancelUrl: `${window.location.origin}/onboarding?step=subscription-cancel`,
//                 });

//                 console.log('Checkout session created:', checkoutResponse);
//                 // Redirect to Stripe Checkout
//                 window.location.href = checkoutResponse.url;
//             } catch (error) {
//                 console.error('Error initiating subscription:', error);
//                 alert('We encountered an issue initiating your subscription. Please try again.');
//             }
//         }
//     };

//     return (
//         <Box>
//             <Typography variant="h5" gutterBottom>
//                 Choose Your Subscription Plan
//             </Typography>
//             <Grid container spacing={3} justifyContent="center">
//                 {Object.entries(SUBSCRIPTION_PLANS).map(([planType, planDetails]) => (
//                     <Grid item xs={12} sm={6} md={4} key={planType}>
//                         <Card
//                             id={`plan-card-${planType}`}
//                             variant="outlined"
//                             sx={{
//                                 height: '100%',
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 transition: 'all 0.3s ease',
//                                 transform: selectedPlan === planType ? 'scale(1.05)' : 'scale(1)',
//                                 boxShadow: selectedPlan === planType ? 8 : 1,
//                             }}
//                         >
//                             <CardContent sx={{ flexGrow: 1 }}>
//                                 <Typography variant="h5" component="div" gutterBottom>
//                                     {planDetails.name}
//                                 </Typography>
//                                 <Typography variant="h4" color="primary" gutterBottom>
//                                     ${planDetails.price}/month
//                                 </Typography>
//                                 <Box mt={2}>
//                                     <Typography variant="body2">
//                                         {/* Database: {formatStorage(planDetails.limits?.database)} */}
//                                     </Typography>
//                                     <Typography variant="body2">
//                                         Storage: {planDetails.limits?.storage ? formatStorage(planDetails.limits.storage) : 'N/A'}
//                                     </Typography>
//                                     <Typography variant="body2">
//                                         Function Executions: {formatExecutions(planDetails.limits.function)}
//                                     </Typography>
//                                 </Box>
//                             </CardContent>
//                             <CardActions>
//                                 <Button
//                                     fullWidth
//                                     variant={selectedPlan === planType ? 'contained' : 'outlined'}
//                                     color="primary"
//                                     onClick={() => handleSelectPlan(planType as SubscriptionPlanType)}
//                                     sx={{
//                                         mt: 'auto',
//                                         transition: 'all 0.3s ease',
//                                         '&:hover': {
//                                             transform: 'translateY(-2px)',
//                                         },
//                                     }}
//                                 >
//                                     {selectedPlan === planType ? 'Selected' : 'Select Plan'}
//                                 </Button>
//                             </CardActions>
//                         </Card>
//                     </Grid>
//                 ))}
//             </Grid>
//             <Box mt={4}>
//                 <Button
//                     variant="contained"
//                     color="primary"
//                     fullWidth
//                     onClick={handleSubmit}
//                     disabled={!selectedPlan || loading}
//                     sx={{
//                         py: 1.5,
//                         transition: 'all 0.3s ease',
//                         '&:not(:disabled):hover': {
//                             transform: 'translateY(-2px)',
//                             boxShadow: 4,
//                         },
//                     }}
//                 >
//                     {loading ? <CircularProgress size={24} /> : `Continue with ${selectedPlan ? SUBSCRIPTION_PLANS[selectedPlan].name : 'Selected'} Plan`}
//                 </Button>
//                 {error && <Typography color="error">{error}</Typography>}
//             </Box>
//         </Box>
//     );
// };

// export default SubscriptionSelectionStep;
