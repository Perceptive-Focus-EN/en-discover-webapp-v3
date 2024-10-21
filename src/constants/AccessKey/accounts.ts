
// Account types

export type UserConnectionStatus = 'PENDING' | 'ACCEPTED' | 'LIMITED' | 'BLOCKED';

// All accounts get a tenantId and a userId
// Personal accounts are main portal for all user to navigate other accounts
// Overseer accounts are for managing multiple accounts think parent over children or mentor and mentee or doctor and patient or teacher and student
// Member accounts are for individual users to access their own data but from a shared tenant account like a hospital or school or business or family or financial institution or non-profit or other organization this allow creating of customers patients and or clients under a space that is shared by all users but not actually making them a user of the space more of a viewer.
// Institute accounts are for schools and other educational institutions
// Business accounts are for businesses and other for profit organizations
// Family accounts are for families and other non-profit organizations
// Financial accounts are for financial institutions and other financial organizations like banks and credit unions and investment firms and insurance companies and other financial services providers
// Other accounts are for all other organizations that do not fit into the other categories like government and non-profit organizations and other organizations that do not fit into the other categories


export const ACCOUNT_TYPES = {
    PERSONAL: 'PERSONAL',
    OVERSEER: 'OVERSEER',
    MEMBER: 'MEMBER',
    FAMILY: 'FAMILY',
    INSTITUTE: 'INSTITUTE',
    BUSINESS: 'BUSINESS',
    FINANCIAL: 'FINANCIAL',
    HEALTH_CARE: 'HEALTH_CARE',
    NON_PROFIT: 'NON_PROFIT',
    FRIEND: 'FRIEND',
    PATIENT: 'PATIENT',
    OTHER: 'OTHER'
} as const;


export enum Subscription_TypeEnum {
    DISCOUNTED = 'DISCOUNTED',
    BETA = 'BETA',
    TRIAL = 'TRIAL',
    PAID = 'PAID',
    UNLOCKED = 'UNLOCKED'

}
export type Subscription_Type = Subscription_TypeEnum


export enum UserAccountTypeEnum {
    PERSONAL = 'PERSONAL',
    OVERSEER = 'OVERSEER',
    MEMBER = 'MEMBER',
    FAMILY = 'FAMILY',
    INSTITUTE = 'INSTITUTE',
    BUSINESS = 'BUSINESS',
    FINANCIAL = 'FINANCIAL',
    HEALTH_CARE = 'HEALTH_CARE',
    NON_PROFIT = 'NON_PROFIT',
    FRIEND = 'FRIEND',
    PATIENT = 'PATIENT',
    OTHER = 'OTHER'

}

export type UserAccountType = UserAccountTypeEnum;


