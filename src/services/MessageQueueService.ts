// services/MessageQueueService.ts
import { ServiceBusClient } from "@azure/service-bus";

export class MessageQueueService {
  private sbClient: ServiceBusClient;

  constructor() {
    this.sbClient = new ServiceBusClient(process.env.SERVICE_BUS_CONNECTION_STRING!);
  }

  async sendMessage(queueName: string, message: any): Promise<void> {
    const sender = this.sbClient.createSender(queueName);
    try {
      await sender.sendMessages({ body: message });
    } finally {
      await sender.close();
    }
  }

  async receiveMessages(queueName: string, handleMessage: (message: any) => Promise<void>): Promise<void> {
    const receiver = this.sbClient.createReceiver(queueName);
    try {
      receiver.subscribe({
        processMessage: async (message) => {
          await handleMessage(message.body);
        },
        processError: async (err) => {
          console.error(err);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
}