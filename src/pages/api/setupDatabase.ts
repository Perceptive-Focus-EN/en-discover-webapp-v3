// src/pages/api/setupDatabase.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createCollectionIfNotExists } from '../../utils/DBCommands/createCollections'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dbName = process.env.DATABASE_NAME;

  if (!dbName) {
    return res.status(500).json({ error: 'Database name is not defined in the environment variables.' });
  }

  try {
    await createCollectionIfNotExists(dbName, 'User');
    await createCollectionIfNotExists(dbName, 'Tenant');
    await createCollectionIfNotExists(dbName, 'UserSettings');
    await createCollectionIfNotExists(dbName, 'OnboardingStatus');
    await createCollectionIfNotExists(dbName, 'OnboardingStep');
    await createCollectionIfNotExists(dbName, 'AnalysisResult');
    await createCollectionIfNotExists(dbName, 'DataDocument');

    res.status(200).json({ message: 'Collections created or verified successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create collections', details: (error as Error).message });
  }
}
