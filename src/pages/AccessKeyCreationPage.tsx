import React, { useState } from 'react';
import { Typography, Paper, Box, Alert, Snackbar, Tabs, Tab, Button } from '@mui/material';
import UnifiedAccessKeyForm from '../components/AccessKeyForms/UnifiedAccessKeyForm';
import EnhancedNFCBuildingAccess from '../components/AccessKeyForms/NFC/EnhancedNFCBuildingAccess';
import { useAuth } from '../contexts/AuthContext';
import createAccessKey from '../constants/AccessKey/AccessKeysComponent';
import { UnifiedAccessKeyParams } from '../components/AccessKeyForms/types/UnifiedAccessKey';
import { UserAccountType } from '../constants/AccessKey/accounts';
import { AccessLevel } from '../constants/AccessKey/access_levels';
import { useRouter } from 'next/router';

const AccessKeyCreationPage: React.FC = () => {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<UserAccountType | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<AccessLevel | null>(AccessLevel.L2);
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();

  const handleAccessKeySubmit = async (accessKeyParams: UnifiedAccessKeyParams) => {
    try {
      const createdAccessKey = await createAccessKey(accessKeyParams);
      setSuccessMessage('Access key and security badge created successfully!');
      console.log('Created Access Key:', createdAccessKey);
    } catch (error) {
      setErrorMessage('Failed to create access key and security badge. Please try again.');
      console.error('Error creating access key:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleFormChange = (accountType: UserAccountType, accessLevel: AccessLevel) => {
    setSelectedAccountType(accountType);
    setSelectedAccessLevel(accessLevel);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Paper elevation={3} sx={{ mt: 4, p: 4, pt: 8, pb: 8, backgroundColor: 'transparent', overflow: 'auto', maxHeight: '80vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          Access Key and Security Management
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/settings')}>
          Back to API Access Settings
        </Button>
      </Box>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Create Access Key" />
        <Tab label="NFC Building Access" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Typography variant="body1" paragraph>
            Use this form to create a new access key and security badge. Select the account type and title,
            then adjust other fields as needed.
          </Typography>
          <UnifiedAccessKeyForm
            onSubmit={handleAccessKeySubmit}
            onChange={handleFormChange}
            selectedAccountType={selectedAccountType || ""}
          />
        </>
      )}

      {activeTab === 1 && (
        <>
          <Typography variant="body1" paragraph>
            Simulate NFC building access and monitor entry attempts.
          </Typography>
          <EnhancedNFCBuildingAccess />
        </>
      )}

      <Snackbar open={!!successMessage || !!errorMessage} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={successMessage ? "success" : "error"} sx={{ width: '100%' }}>
          {successMessage || errorMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AccessKeyCreationPage;
