// src/pages/api/messaging/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import azureBlobStorageInstance from '@/config/azureBlobStorage';
import formidable, { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken?.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const form = new IncomingForm();
    const [fields, files]: [formidable.Fields, formidable.Files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    if (!files.file || !files.file[0]) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const file = files.file[0];
    const fileContent = await fs.readFile(file.filepath);
    const blobName = `messages/${decodedToken.userId}/${Date.now()}-${file.originalFilename}`;
    
    const url = await azureBlobStorageInstance?.uploadBlob(blobName, fileContent);
    
    return res.status(200).json({ url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ message: 'Failed to upload file' });
  }
}