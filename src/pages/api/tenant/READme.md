
# Fill Tenant User Database Schema

```typescript
const newUser: ExtendedUserInfo = {
    socialProfile: {
        connections: {
            active: [],
            pending: [],
            blocked: []
        },
        connectionRequests: {
            sent: [],
            received: []
        },
        privacySettings: {
            profileVisibility: 'public',
            connectionVisibility: 'public',
            activityVisibility: 'public'
        }
    },
    onboardingStatus: {
        steps: [],
        isOnboardingComplete: false,
        lastUpdated: new Date().toISOString(),
        currentStepIndex: 0,
        stage: 'initial'
    },
    ...userData,
    userId: newUserId,
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    tenants: {
        associations: {
            [userData.tenantId]: {
                tenantId: userData.tenantId,
                role: userData.role as AllRoles || 'defaultRole',
                accessLevel: AccessLevel[userData.accessLevel as keyof typeof AccessLevel] || AccessLevel.L4,
                accountType: UserAccountTypeEnum.BUSINESS,
                permissions: [],  // Define default permissions or add logic to fetch them
                joinedAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                status: 'active',
                statusUpdatedAt: new Date().toISOString()
            }
        },
        context: {
            personalTenantId: '',  // Optional initialization; adjust as needed
            currentTenantId: userData.tenantId  // Ensure tenant context is accurately assigned
        }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    profile: {},
    accountType: UserAccountTypeEnum.BUSINESS,
    subscriptionType: Subscription_TypeEnum.TRIAL,
    isVerified: false,
    department: '',
    lastLogin: '',
    isDeleted: false
}: