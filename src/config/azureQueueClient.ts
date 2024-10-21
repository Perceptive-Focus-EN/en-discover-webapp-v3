import { QueueServiceClient } from "@azure/storage-queue";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING is not defined");
}
const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
const queueClient = queueServiceClient.getQueueClient("onboarding-reminders");

export { queueClient };


export function getQueueClient(queueName: string) {
  return queueServiceClient.getQueueClient(queueName);
}