import { MongoClient, Db } from 'mongodb';
import { getCosmosClient } from '../config/azureCosmosClient'; // Import the original getCosmosClient

interface CosmosClientOptions {
  dbName?: string;
  withClient?: boolean;
}

export async function useCosmosClient(options: CosmosClientOptions = { withClient: false }) {
  const { dbName, withClient } = options;

  // Reuse the existing getCosmosClient function, but handle the `client` and `db` logic here
  const cosmosClient = await getCosmosClient(dbName, withClient);

  // Return both client and db, or just db depending on the use case
  return {
    db: cosmosClient.db,
    client: withClient ? cosmosClient.client : undefined,
  };
}
