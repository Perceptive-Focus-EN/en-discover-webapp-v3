import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, MenuItem, Typography } from '../../Common/MuiComponents';
import { RoleSelectionStepData, OnboardingStepName } from '../../../types/Onboarding/interfaces';
import { ACCESS_LEVELS, AccessLevel } from '@/constants/AccessKey/access_levels';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { UserAccountTypeEnum } from '../../../constants/AccessKey/accounts';
import { getPermissionsForTitle, createHealthcareAccessKey } from '../../../constants/AccessKey/AccountStructures/healthcare';
import { ROLES, AllRoles } from '@/constants/AccessKey/AccountRoles';
import { Subscription_Type} from '@/constants/AccessKey/accounts';
import {useAuth} from '../../../contexts/AuthContext';

interface RoleSelectionStepProps {
    onSubmit: (stepName: OnboardingStepName, data: RoleSelectionStepData) => Promise<void>;
    isOwner: boolean;
}

const enum SubscriptionTypeEnum {
    BASIC = 'TRIAL',
    PREMIUM = 'BASIC',
    UNLOCKED = 'UNLOCKED',
    DISCOUNTED = 'DISCOUNTED',
    ENTERPRISE = 'ENTERPRISE'
}

const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({ onSubmit, isOwner }) => {
    const [accountType, setAccountType] = useState<UserAccountTypeEnum | null>(null);
    const [title, setTitle] = useState<AllRoles | null>(null);
    const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
    const { moveToNextStep } = useOnboarding();

    useEffect(() => {
        if (title) {
            // You might need to implement a function to get default access level based on title
            setAccessLevel(ACCESS_LEVELS.L1 as AccessLevel); // Assuming default access level is L1
        }
    }, [title]);

    const handleAccountTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setAccountType(event.target.value as UserAccountTypeEnum);
        setTitle(null);
        setAccessLevel(null);
    };

    const handleTitleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setTitle(event.target.value as AllRoles);
    };

    const handleSubmit = async () => {
        if (!accountType || !title) return;

        try {
            let submissionData: RoleSelectionStepData = {
                role: title,
                accessLevel: accessLevel || (ACCESS_LEVELS.L1 as AccessLevel) // Provide a default access level if not set
                ,
                accountType: accountType
            };

            if (accountType === UserAccountTypeEnum.HEALTH_CARE) {
                submissionData = {
                    accountType,
                    role: AllRoles,
                    accessLevel: accessLevel || (ACCESS_LEVELS.L1 as AccessLevel),
                    subscriptionType: SubscriptionTypeEnum.BASIC as unknown as Subscription_Type,
                    subscriptionEndDate: new Date(
                        new Date().setFullYear(new Date().getFullYear() + 1) // Set subscription end date to 1 year from now
                    )
                };
            }

            await onSubmit('RoleSelection', submissionData);
            moveToNextStep();
        } catch (error) {
            console.error('Error submitting role selection:', error);
            // Handle error (e.g., show error message to user)
        }
    };

    const getRolesForAccountType = () => {
        switch (accountType) {
            case UserAccountTypeEnum.BUSINESS:
                return ROLES.Business;
            case UserAccountTypeEnum.FAMILY:
                return ROLES.Family;
            case UserAccountTypeEnum.FINANCIAL:
                return ROLES.Finance;
            case UserAccountTypeEnum.HEALTH_CARE:
                return ROLES.HealthCare;
            case UserAccountTypeEnum.NON_PROFIT:
                return ROLES.NonProfit;
            case UserAccountTypeEnum.PERSONAL:
                return ROLES.Personal;
            case UserAccountTypeEnum.INSTITUTE:
                return ROLES.Technology; // Assuming INSTITUTE uses Technology Roles
            default:
                return null;
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Select Your Account Type and Title
            </Typography>
            <TextField
                select
                label="Account Type"
                value={accountType}
                onChange={handleAccountTypeChange}
                fullWidth
                margin="normal"
            >
                {Object.values(UserAccountTypeEnum).map((type) => (
                    <MenuItem key={type} value={type}>
                        {type}
                    </MenuItem>
                ))}
            </TextField>

            {accountType && (
                <TextField
                    select
                    label="Title"
                    value={title}
                    onChange={handleTitleChange}
                    fullWidth
                    margin="normal"
                    disabled={isOwner}
                >
                    {Object.values(getRolesForAccountType() || {}).map((titleOption) => (
                        <MenuItem key={titleOption} value={titleOption}>
                            {titleOption}
                        </MenuItem>
                    ))}
                </TextField>
            )}

            {title && accountType === UserAccountTypeEnum.HEALTH_CARE && (
                <Box mt={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Permissions for {title}:
                    </Typography>
                    <ul>
                        {getPermissionsForTitle(title as HealthCareIndustryRoles).map((permission) => (
                            <li key={permission}>{permission}</li>
                        ))}
                    </ul>
                </Box>
            )}

            <Box mt={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Note: Roles have predefined access levels and permissions.
                </Typography>
                <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!accountType || !title}>
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default RoleSelectionStep;
