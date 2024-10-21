import * as z from 'zod';

export const validateUser = (userData: any) => {
  const UserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.string().optional(),
    accessLevel: z.string().optional(),
  });

  return UserSchema.parse(userData);
};

export const validateToken = (token: string): boolean => {
  // Implement your token validation logic here
  // For example, check if it's a valid JWT format
  return /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token);
};

export const isValidEmail = (email: string): boolean => {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
};

export const isStrongPassword = (password: string): boolean => {
  const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

  return passwordSchema.safeParse(password).success;
};