import { NextApiRequest } from 'next'

declare module 'next' {
  interface NextApiRequest {
    timestamp?: number;
  }
}