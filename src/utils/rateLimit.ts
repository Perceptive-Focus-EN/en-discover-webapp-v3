import expressRateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

export const rateLimitMiddleware = (options: any) => {
  return slowDown({
    ...options,
    delayAfter: 5, // allow 5 requests per minute at full speed
    delayMs: 500 // add 500ms of delay per request above 5
  });
};