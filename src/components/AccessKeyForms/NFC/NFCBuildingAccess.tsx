import React, { useState } from 'react';
import { TextField, Button, Typography } from '@mui/material';

const NFCBuildingAccess: React.FC = () => {
  const [nfcId, setNfcId] = useState('');
  const [accessStatus, setAccessStatus] = useState<'Granted' | 'Denied' | null>(null);

  const handleNfcScan = async () => {
    // In a real-world scenario, this would be triggered by an NFC scan
    // Here, we're simulating it with a button click
    
    // This is where you'd typically make an API call to your backend
    // to verify the NFC_ID against your database
    const response = await fetch('/api/verifyNfcAccess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nfcId }),
    });

    const result = await response.json();
    setAccessStatus(result.access ? 'Granted' : 'Denied');
  };

  return (
    <>
      <Typography variant="h6">NFC Building Access</Typography>
      <TextField
        value={nfcId}
        onChange={(e) => setNfcId(e.target.value)}
        label="Scan NFC or Enter NFC ID"
        fullWidth
        margin="normal"
      />
      <Button onClick={handleNfcScan} variant="contained" color="primary">
        Simulate NFC Scan
      </Button>
      {accessStatus && (
        <Typography variant="h5" color={accessStatus === 'Granted' ? 'green' : 'red'}>
          Access {accessStatus}
        </Typography>
      )}
    </>
  );
};

export default NFCBuildingAccess;