import { NextApiRequest } from 'next';
import { Files } from 'formidable';

export interface UploadRequest extends NextApiRequest {
  files: Files;
  headers: NextApiRequest['headers'] & {
    authorization?: string;
  };
}

export interface SessionData {
  tenantId: string;
  userId: string;
}