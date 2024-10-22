
// src/errors/errors.ts
// Custom error classes to handle different error scenario
// src/errors/errors.ts

export class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class UnsupportedAIServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnsupportedAIServiceError';
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export class ResourceLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ResourceLimitError';
    }
}

export class OnboardingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OnboardingError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class SignupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SignupError';
    }
}

export class ApiError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}

// New error classes based on your ERROR_MESSAGES

export class PaymentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PaymentError';
    }
}

export class SubscriptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SubscriptionError';
    }
}

export class NotificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotificationError';
    }
}

export class SessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SessionError';
    }
}

export class TenantError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TenantError';
    }
}

export class WebhookError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebhookError';
    }
}

export class FeatureFlagError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FeatureFlagError';
    }
}

export class LoggingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LoggingError';
    }
}

export class MetricsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MetricsError';
    }
}