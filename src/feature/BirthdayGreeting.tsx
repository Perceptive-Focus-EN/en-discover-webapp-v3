import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Confetti from 'react-confetti';
import { Box, Typography, Button, SwipeableDrawer } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

interface BirthdayGreetingProps {
  username: string;
  onClose: () => void;
}

const BirthdayGreeting: React.FC<BirthdayGreetingProps> = ({ username, onClose }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [acceptedGift, setAcceptedGift] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleAcceptGift = () => {
    setAcceptedGift(true);
    setOpenDrawer(true);
  };

  const handleDeclineGift = () => {
    setAcceptedGift(false);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    onClose();
  };

  const handleNavigateToStore = () => {
    router.push('/store');
    onClose();
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {showConfetti && <Confetti />}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          {t('birthdayGreeting', { username })}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('birthdayGiftOffer')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
            onClick={handleAcceptGift}
          >
            {t('acceptGift')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleDeclineGift}
          >
            {t('declineGift')}
          </Button>
        </Box>
      </Box>
      <SwipeableDrawer
        anchor="bottom"
        open={openDrawer}
        onClose={handleCloseDrawer}
        onOpen={() => {}}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {acceptedGift
              ? t('giftAcceptedMessage')
              : t('giftDeclinedMessage')}
          </Typography>
          {acceptedGift && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNavigateToStore}
              sx={{ mt: 2 }}
            >
              {t('goToStore')}
            </Button>
          )}
        </Box>
      </SwipeableDrawer>
    </Box>
  );
};

export default BirthdayGreeting;