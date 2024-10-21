import { EmailClient } from "@azure/communication-email";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Retrieve the connection string from environment variables
const connectionString = process.env.AZURE_COMMUNICATIONS_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("AZURE_COMMUNICATIONS_CONNECTION_STRING environment variable is not set");
}

// Create an instance of the EmailClient with the connection string
const client = new EmailClient(connectionString);

export default client;