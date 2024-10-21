import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define the database path
const DB_PATH = path.join(process.cwd(), 'src', 'mocks', 'db');

// Ensure the DB_PATH directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Helper to get a collection from the file system
const getCollection = (collectionName: string): any[] => {
  const filePath = path.join(DB_PATH, `${collectionName}.json`);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }
  return [];
};

// Helper to save a collection to the file system
const saveCollection = (collectionName: string, data: any[]) => {
  const filePath = path.join(DB_PATH, `${collectionName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Helper to simulate async behavior
const simulateAsync = <T>(result: T): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(result), 0));
};

export const mockDatabase = {
  collection: (collectionName: string) => ({
    // Insert one document into the collection
    insertOne: async (document: any) => {
      const collection = getCollection(collectionName);
      const now = new Date().toISOString();
      document._id = uuidv4();
      document.createdAt = now;
      document.updatedAt = now;
      document.timeStamp = document.timeStamp || now;
      collection.push(document);
      saveCollection(collectionName, collection);
      return simulateAsync({ insertedId: document._id });
    },

    // Find one document matching the query
    findOne: async (query: any) => {
      const collection = getCollection(collectionName);
      const result = collection.find((doc: any) => 
        Object.entries(query).every(([key, value]) => doc[key] === value)
      );
      return simulateAsync(result);
    },

    // Find multiple documents matching the query
    find: async (query: any) => ({
      sort: (sortOptions: any) => ({
        toArray: async () => {
          let collection = getCollection(collectionName);
          collection = collection.filter((doc: any) => 
            Object.entries(query).every(([key, value]) => doc[key] === value)
          );
          if (sortOptions) {
            const [sortField, sortOrder] = Object.entries(sortOptions)[0];
            collection.sort((a: any, b: any) => {
              if (a[sortField] < b[sortField]) return sortOrder === 1 ? -1 : 1;
              if (a[sortField] > b[sortField]) return sortOrder === 1 ? 1 : -1;
              return 0;
            });
          }
          return simulateAsync(collection);
        }
      }),
      toArray: async () => {
        const collection = getCollection(collectionName);
        const result = collection.filter((doc: any) => 
          Object.entries(query).every(([key, value]) => doc[key] === value)
        );
        return simulateAsync(result);
      }
    }),

    // Update one document in the collection
    updateOne: async (filter: any, update: any) => {
      const collection = getCollection(collectionName);
      const index = collection.findIndex((doc: any) => 
        Object.entries(filter).every(([key, value]) => doc[key] === value)
      );
      if (index !== -1) {
        const now = new Date().toISOString();
        collection[index] = {
          ...collection[index],
          ...update.$set,
          updatedAt: now
        };
        saveCollection(collectionName, collection);
        return simulateAsync({ modifiedCount: 1, upsertedId: null });
      }
      return simulateAsync({ modifiedCount: 0, upsertedId: null });
    },

    // Bulk write operations in the collection
    bulkWrite: async (operations: any[]) => {
      const collection = getCollection(collectionName);
      let modifiedCount = 0;
      let insertedCount = 0;

      operations.forEach(operation => {
        if (operation.insertOne) {
          const document = operation.insertOne.document;
          const now = new Date().toISOString();
          
          // Find an existing document with the same systemId, tenantId, and userId
          const existingDocIndex = collection.findIndex(
            (doc: any) => doc.systemId === document.systemId && 
                          doc.tenantId === document.tenantId && 
                          doc.userId === document.userId
          );

          if (existingDocIndex !== -1) {
            // If found, append to the logs array
            if (!collection[existingDocIndex].logs) {
              collection[existingDocIndex].logs = [];
            }
            collection[existingDocIndex].logs.push({
              level: document.level,
              message: document.message,
              userMessage: document.userMessage,
              timestamp: document.timestamp,
              metadata: document.metadata
            });
            collection[existingDocIndex].updatedAt = now;
            modifiedCount++;
          } else {
            // If not found, create a new document
            collection.push({
              _id: uuidv4(),
              systemId: document.systemId,
              systemName: document.systemName,
              environment: document.environment,
              tenantId: document.tenantId,
              userId: document.userId,
              sessionId: document.sessionId,
              logs: [{
                level: document.level,
                message: document.message,
                userMessage: document.userMessage,
                timestamp: document.timestamp,
                metadata: document.metadata
              }],
              createdAt: now,
              updatedAt: now
            });
            insertedCount++;
          }
        }
      });

      saveCollection(collectionName, collection);
      return simulateAsync({ modifiedCount, insertedCount });
    },

    // Handle database commands (e.g., ping)
    command: async (command: any) => {
      if (command.ping) {
        return simulateAsync({ ok: 1 });
      }
      throw new Error('Command not supported in mock database');
    },
  }),
};
