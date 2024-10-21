export const validateToken = (token: string): boolean => {
    // Implement your token validation logic here
    // For example, check if it's a valid JWT format
    return /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token);
  };