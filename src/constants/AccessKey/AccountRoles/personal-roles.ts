
export enum PersonalRoles {
    // Core Personal Roles
    SELF = 'SELF',
    INDIVIDUAL = 'INDIVIDUAL',
    USER = 'USER',
    ACCOUNT_HOLDER = 'ACCOUNT_HOLDER',

    // Personal Status Roles
    STUDENT = 'STUDENT',
    PROFESSIONAL = 'PROFESSIONAL',
    RETIREE = 'RETIREE',
    HOMEMAKER = 'HOMEMAKER',

    // Employment-related Roles
    EMPLOYEE = 'EMPLOYEE',
    SELF_EMPLOYED = 'SELF_EMPLOYED',
    FREELANCER = 'FREELANCER',
    ENTREPRENEUR = 'ENTREPRENEUR',
    JOB_SEEKER = 'JOB_SEEKER',

    // Relationship Roles (if relevant to your system)
    SINGLE = 'SINGLE',
    MARRIED = 'MARRIED',
    PARTNER = 'PARTNER',

    // Age-related Roles (if relevant)
    MINOR = 'MINOR',
    ADULT = 'ADULT',
    SENIOR = 'SENIOR',

    // Other Potential Roles
    VOLUNTEER = 'VOLUNTEER',
    CAREGIVER = 'CAREGIVER',

    // Generic Fallback
    OTHER = 'OTHER'
}