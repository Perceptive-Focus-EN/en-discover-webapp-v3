// // src/utils/DBCommands/createCollections.ts

// import { getCosmosClient } from '../../config/azureCosmosClient';
// import { DatabaseError } from '../../MonitoringSystem/errors/specific';
// import { COLLECTIONS } from '../../constants/collections';

// async function createCollectionIfNotExists(dbName: string, collectionName: string) {
//   try {
//     const client = await getCosmosClient(dbName);
//     const existingCollections = await client.db.listCollections().toArray();
//     interface Collection<T = any> {
//       name: string;
//       // Add other properties if needed
//     }

//     interface Database {
//       listCollections: () => { toArray: () => Promise<Collection[]> };
//       createCollection: (name: string) => Promise<Collection>;
//     }

//     interface CosmosClient {
//       db: Database;
//     }


//     const collectionExists: boolean = existingCollections.some((col: Collection) => col.name === collectionName);

//     if (!collectionExists) {
//       await db.createCollection(collectionName);
//     } else {
//     }
//   } catch (error) {
//     throw new DatabaseError(`Failed to create or check collection "${collectionName}" in database "${dbName}"`);
//   }
// }

// export { createCollectionIfNotExists };
