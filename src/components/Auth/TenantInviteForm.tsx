// src/components/Auth/TenantInviteForm.tsx
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Snackbar, 
  Alert, 
  Grid, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl 
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { AllRoles } from '@/constants/AccessKey/AccountRoles';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { userApi } from '@/lib/api/user';

interface InviteFormData {
  email: string;
  role: AllRoles;
  accessLevel: AccessLevel;
  expiresIn?: number; // In hours
}

const TenantInviteForm: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role: 'MEMBER' as AllRoles,
    accessLevel: AccessLevel.L1,
    expiresIn: 24
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Get current tenant from user context
      const currentTenantId = user?.tenants.context.currentTenantId;
      if (!currentTenantId) throw new Error('No active tenant context');

      const inviteData = {
        ...formData,
        tenantId: currentTenantId
      };

      await userApi.createTenantInvite(inviteData);
      setSuccess('Invitation sent successfully.');
      setFormData({
        email: '',
        role: 'MEMBER' as AllRoles,
        accessLevel: AccessLevel.L1,
        expiresIn: 24
      });
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3}>
        <Box p={4}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Invite User to Tenant
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      role: e.target.value as AllRoles
                    }))}
                    label="Role"
                  >
                    <MenuItem value="MEMBER">Member</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                    <MenuItem value="MANAGER">Manager</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Access Level</InputLabel>
                  <Select
                    value={formData.accessLevel}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      accessLevel: e.target.value as AccessLevel
                    }))}
                    label="Access Level"
                  >
                    {Object.values(AccessLevel).map(level => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  type="number"
                  label="Expires In (hours)"
                  value={formData.expiresIn}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    expiresIn: parseInt(e.target.value)
                  }))}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </Box>
      </Paper>
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Container>
  );
};

export default TenantInviteForm;