import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as authManager from '../utils/TokenManagement/authManager';
import { 
    OnboardingStepData, 
    OnboardingStepName, 
    OnboardingStage,
    OnboardingStatusDetails,
    OnboardingStepRequest,
    OnboardingStepResponse
} from '../types/Onboarding/interfaces';
import { ExtendedUserInfo, UserProfile } from '../types/User/interfaces';
import { 
    ONBOARDING_STEPS, 
    ONBOARDING_STATUS
} from '../constants/onboarding';
import { onboardingApi } from '../lib/api/onboarding';
import { AllRoles } from '@/constants/AccessKey/AccountRoles';
import { Subscription_Type } from '@/constants/AccessKey/accounts';

const ONBOARDING_STEP_INDEX = {
    Verification: 0,
    PersonalInfo: 1,
    CompanyInfo: 2,
    RoleSelection: 3,
    GoalsAndObjectives: 4,
    FinancialInfo: 5,
    Completed: 6,
};

interface OnboardingContextType {
    currentStep: OnboardingStepName;
    updateStep: (stepName: OnboardingStepName, data: OnboardingStepData, moveNext?: boolean) => Promise<void>;
    isOnboardingComplete: boolean;
    onboardingStage: OnboardingStage;
    error: string | null;
    resetError: () => void;
    moveToNextStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: authUser, setUser: setAuthUser } = useAuth();
    const [currentStep, setCurrentStep] = useState<OnboardingStepName>(ONBOARDING_STEPS[0]);
    const ONBOARDING_STEP_INDEX = {
        Verification: 0,
        PersonalInfo: 1,
        CompanyInfo: 2,
        RoleSelection: 3,
        GoalsAndObjectives: 4,
        FinancialInfo: 5,
        Completed: 6,
        title: authUser?.title ?? 'defaultTitle' as AllRoles, // Ensure title is not undefined
    };

    const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>(ONBOARDING_STATUS[0]);
    const [error, setError] = useState<string | null>(null);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);

    useEffect(() => {
        if (authUser?.onboardingStatus) {
            const currentStepIndex = authUser.onboardingStatus.currentStepIndex;
            setCurrentStep(ONBOARDING_STEPS[currentStepIndex]);
            setIsOnboardingComplete(authUser.onboardingStatus.isOnboardingComplete);
            setOnboardingStage(authUser.onboardingStatus.stage.replace(/([A-Z])/g, '_$1').toLowerCase() as OnboardingStage);
        }
    }, [authUser]);

    const moveToNextStep = () => {
        const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
            const nextStep = ONBOARDING_STEPS[currentIndex + 1];
            setCurrentStep(nextStep);
        }
    };

    const updateStep = async (stepName: OnboardingStepName, data: OnboardingStepData, moveNext: boolean = false) => {
        try {
            setError(null);
            console.log('Updating step:', stepName, data);
            const stepRequest: OnboardingStepRequest = {
                userId: authUser!.userId,
                tenantId: authUser!.tenantId,
                stage: onboardingStage.replace(/([A-Z])/g, '_$1').toLowerCase() as OnboardingStage,
                step: stepName,
                data: {
                    ...data,
                    stepName,
                }
            };
            const response: OnboardingStepResponse = await onboardingApi.updateOnboardingStep(stepRequest);
            console.log('Step update response:', response);

            if (response.user) {
                const updatedOnboardingStatus: OnboardingStatusDetails = {
                    ...authUser!.onboardingStatus,
                    steps: authUser!.onboardingStatus.steps.map(step => ({
                        name: step.name as OnboardingStepName,
                        completed: ONBOARDING_STEP_INDEX[step.name as OnboardingStepName] <= ONBOARDING_STEP_INDEX[stepName]
                    })),
                    stage: 'inProgress' as OnboardingStage,
                    isOnboardingComplete: ONBOARDING_STEP_INDEX[stepName] === ONBOARDING_STEPS.length - 1,
                    lastUpdated: new Date().toISOString(),
                    currentStepIndex: ONBOARDING_STEP_INDEX[stepName],
                    status: ONBOARDING_STATUS[1] as OnboardingStage,
                };

                const updatedUser: ExtendedUserInfo = {
                    ...authUser,
                    onboardingStatus: authUser!.onboardingStatus ?? {} as OnboardingStatusDetails, // Ensure onboardingStatus is not undefined
                    ...authUser,
                    userId: authUser!.userId ?? '', // Ensure userId is not undefined
                    role: authUser!.role, // Ensure role is included
                    // userTypes: authUser!.userTypes, // Ensure userTypes is included
                    tenantId: authUser!.tenantId ?? '', // Ensure tenantId is not undefined
                    tenant: authUser!.tenant ?? null, // Ensure tenant is not undefined
                    softDelete: authUser!.softDelete ?? null, // Ensure softDelete is not undefined
                    profile: authUser!.profile ?? {} as UserProfile, // Ensure profile is not undefined
                    connections: authUser!.connections ?? [], // Ensure connections is not undefined
                    connectionRequests: authUser!.connectionRequests ?? { sent: [], received: [] }, // Ensure connectionRequests is not undefined
                    privacySettings: authUser!.privacySettings ?? { profileVisibility: "private" }, // Ensure privacySettings is not undefined
                    email: authUser!.email ?? '', // Ensure email is not undefined
                    password: authUser!.password ?? '', // Ensure password is not undefined
                    firstName: authUser!.firstName ?? '', // Ensure firstName is not undefined
                    lastName: authUser!.lastName ?? '', // Ensure lastName is not undefined
                    title: authUser!.title ?? 'defaultTitle' as AllRoles, // Ensure title is not undefined
                    accountType: authUser!.accountType ?? 'defaultAccountType', // Ensure accountType is not undefined
                    accessLevel: authUser!.accessLevel ?? 'defaultAccessLevel' as AllRoles, // Ensure accessLevel is not undefined
                    permissions: authUser!.permissions ?? [], // Ensure permissions is not undefined
                    subscriptionType: authUser!.subscriptionType ?? 'defaultSubscriptionType' as Subscription_Type, // Ensure subscriptionType is not undefined
                    tenants: authUser!.tenants ?? [], // Ensure tenants is not undefined
                    isActive: authUser!.isActive ?? true, // Ensure isActive is not undefined
                    isVerified: authUser!.isVerified ?? false, // Ensure isVerified is not undefined
                    createdAt: authUser!.createdAt ?? new Date().toISOString(), // Ensure createdAt is not undefined
                    updatedAt: authUser!.updatedAt ?? new Date().toISOString(), // Ensure updatedAt is not undefined
                    personalTenantId: authUser!.personalTenantId ?? '', // Ensure personalTenantId is not undefined
                    currentTenantId: authUser!.currentTenantId ?? '', // Ensure currentTenantId is not undefined
                    tenantAssociations: authUser!.tenantAssociations ?? [], // Ensure tenantAssociations is not undefined
                    department: authUser!.department ?? '', // Ensure department is not undefined
                    lastLogin: authUser!.lastLogin ?? new Date().toISOString(), // Ensure lastLogin is not undefined,
                    isDeleted: authUser!.isDeleted ?? false, // Ensure isDeleted is not undefined
                };

                setCurrentStep(stepName);
                setIsOnboardingComplete(updatedOnboardingStatus.isOnboardingComplete);
                setOnboardingStage(updatedOnboardingStatus.stage);

                // Update AuthContext and local storage
                setAuthUser(updatedUser);
                authManager.storeUser(JSON.stringify(updatedUser));

                if (moveNext) {
                    moveToNextStep();
                }
            } else {
                console.error('No user data in response');
                setError('Failed to update onboarding step. No user data received.');
            }
        } catch (error) {
            console.error('Error updating onboarding step:', error);
            setError('Failed to update onboarding step. Please try again.');
            throw error;
        }
    }

    const resetError = () => {
        setError(null);
    };

    return (
        <OnboardingContext.Provider 
            value={{ 
                currentStep, 
                updateStep, 
                isOnboardingComplete, 
                onboardingStage,
                error,
                resetError,
                moveToNextStep
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};