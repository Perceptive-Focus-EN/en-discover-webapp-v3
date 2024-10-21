// src/config/azureWebPubSub.ts
import { WebPubSubServiceClient } from "@azure/web-pubsub";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.AZURE_WEB_PUBSUB_CONNECTION_STRING || "";
const hubName = process.env.AZURE_WEB_PUBSUB_HUB_NAME || "";

const serviceClient = new WebPubSubServiceClient(connectionString, hubName);

export default serviceClient;
