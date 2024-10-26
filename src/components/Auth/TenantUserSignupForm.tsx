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
  FormControl, 
  SelectChangeEvent
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../lib/api_s/user';
import { ROLES, AllRoles } from '../../constants/AccessKey/AccountRoles';
import { AccessLevel } from '../../constants/AccessKey/access_levels';
import { TenantUserSignupData } from '../../types/Signup/interfaces';
import { UserAccountTypeEnum } from '../../constants/AccessKey/accounts';

const TenantUserSignupForm: React.FC = () => {
  const [formData, setFormData] = useState<TenantUserSignupData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER' as AllRoles,
    accessLevel: AccessLevel.L0,
    department: '',
    accountType: UserAccountTypeEnum.MEMBER,
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<unknown>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userApi.createTenantUser(formData);
      setSuccess('User added to tenant successfully.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'USER' as AllRoles,
        accessLevel: AccessLevel.L0,
        department: '',
        accountType: UserAccountTypeEnum.MEMBER,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3}>
        <Box p={4}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Add New User to Tenant
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Role"
                  >
                    {Object.values(ROLES).flatMap(roleGroup => 
                      Object.values(roleGroup).map(role => 
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="access-level-label">Access Level</InputLabel>
                  <Select
                    labelId="access-level-label"
                    id="accessLevel"
                    name="accessLevel"
                    value={formData.accessLevel}
                    onChange={handleChange}
                    label="Access Level"
                  >
                    {Object.values(AccessLevel).map(level => 
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="account-type-label">Account Type</InputLabel>
                  <Select
                    labelId="account-type-label"
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    label="Account Type"
                  >
                    {Object.values(UserAccountTypeEnum).map(type => 
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  id="department"
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </Box>
      </Paper>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TenantUserSignupForm;
