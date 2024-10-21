import { NextApiRequest, NextApiResponse } from 'next';
import { SpeechClient } from '@google-cloud/speech';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Set up Google Cloud Speech client
const client = new SpeechClient();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });
const apiRoute = require('express').Router();

// Handle file upload using multer
apiRoute.use(upload.single('audio'));

apiRoute.post(async (req: NextApiRequest & { file: Express.Multer.File }, res: NextApiResponse) => {
  try {
    const filePath = path.join(process.cwd(), req.file.path);
    const audioBytes = fs.readFileSync(filePath).toString('base64');

    const audio = { content: audioBytes };
    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };

    const request = { audio, config };

    // Google Speech API call
    const [response] = await client.recognize(request);
    const transcription = response.results
      ? response.results.map(result => result.alternatives?.[0]?.transcript ?? '').join('\n')
      : '';

    fs.unlinkSync(filePath); // Clean up the uploaded file
    res.status(200).json({ transcription });
  } catch (error) {
    res.status(500).json({ error: 'Speech recognition failed.', details: error });
  }
});

export const config = {
  api: {
    bodyParser: false, // Disabling Next.js body parsing, handled by multer
  },
};

export default apiRoute;
