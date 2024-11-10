// // src/UploadingSystem/services/PaymentGateway.ts
// import { EventEmitter } from 'events';
// import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
// import { ResourceQuotaManager } from './ResourceQuotaManager';
// import { AuthenticatedWebSocket } from '../../middleware/socketAuthMiddleware';
// import Stripe from 'stripe';
// import { SystemError } from '@/MonitoringSystem/constants/errors';

// interface SubscriptionDetails {
//     id: string;
//     userId: string;
//     tenantId: string;
//     currentTenant: string;
//     tierId: string;
// }

// interface PaymentSession {
//     id: string;
//     status: 'pending' | 'completed' | 'failed';
//     amount: number;
//     currency: string;
//     metadata: {
//         userId: string;
//         tenantId: string;
//         tierId: string;
//         quotaIncrease: {
//             storage?: number;
//             uploads?: number;
//             aiCredits?: number;
//         };
//     };
// }

// const stripe = new Stripe('your-stripe-secret-key', { apiVersion: '2023-10-16' });

// export class PaymentGateway extends EventEmitter {
//     private static instance: PaymentGateway | null = null;
//     private resourceQuota: ResourceQuotaManager;

//     private constructor() {
//         super();
//         this.resourceQuota = ResourceQuotaManager.getInstance();
//         this.setupRecurringBillingChecks();
//     }

//     static getInstance(): PaymentGateway {
//         if (!this.instance) {
//             this.instance = new PaymentGateway();
//         }
//         return this.instance;
//     }

//     async handleQuotaUpgrade(
//         ws: AuthenticatedWebSocket,
//         quotaType: 'storage' | 'uploads' | 'aiCredits',
//         amount: number
//     ): Promise<void> {
//         try {
//             const session = await this.createPaymentSession(ws, quotaType, amount);

//             ws.send(JSON.stringify({
//                 type: 'QUOTA_UPGRADE_PAYMENT',
//                 sessionId: session.id,
//                 details: {
//                     amount: session.amount,
//                     currency: session.currency,
//                     quotaIncrease: { [quotaType]: amount }
//                 },
//                 paymentMethods: await this.getAvailablePaymentMethods(ws.tenantId)
//             }));

//             this.monitorPaymentSession(ws, session);
//         } catch (error) {
//             monitoringManager.logger.error(error, SystemError.PAYMENT_SESSION_FAILED, {
//                 userId: ws.userId,
//                 quotaType,
//                 amount
//             });
//         }
//     }

//     private async createPaymentSession(
//         ws: AuthenticatedWebSocket,
//         quotaType: 'storage' | 'uploads' | 'aiCredits',
//         amount: number
//     ): Promise<PaymentSession> {
//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: [{
//                 price_data: {
//                     currency: 'usd',
//                     product_data: { name: `Quota Upgrade: ${quotaType}` },
//                     unit_amount: amount * 100,
//                 },
//                 quantity: 1,
//             }],
//             mode: 'payment',
//             success_url: 'https://your-success-url.com',
//             cancel_url: 'https://your-cancel-url.com',
//             metadata: {
//                 userId: ws.userId,
//                 tenantId: ws.tenantId,
//                 tierId: ws.userTier,
//                 quotaType,
//                 amount,
//             },
//         });

//         return {
//             id: session.id,
//             status: 'pending',
//             amount,
//             currency: 'usd',
//             metadata: {
//                 userId: ws.userId,
//                 tenantId: ws.tenantId,
//                 tierId: ws.userTier,
//                 quotaIncrease: { [quotaType]: amount }
//             }
//         };
//     }

//     private async getAvailablePaymentMethods(tenantId: string): Promise<string[]> {
//         return ['card'];
//     }

//     private async monitorPaymentSession(ws: AuthenticatedWebSocket, session: PaymentSession): Promise<void> {
//         try {
//             const retrievedSession = await stripe.checkout.sessions.retrieve(session.id);
//             if (retrievedSession.payment_status === 'paid') {
//                 await this.handlePaymentSuccess(ws, session);
//             } else {
//                 this.emit('payment:failure', { userId: ws.userId });
//             }
//         } catch (error) {
//             monitoringManager.logger.error(error, SystemError.PAYMENT_MONITORING_FAILED, {
//                 sessionId: session.id
//             });
//         }
//     }

//     private async handlePaymentSuccess(ws: AuthenticatedWebSocket, session: PaymentSession): Promise<void> {
//         await this.resourceQuota.increaseQuota(session.metadata.userId, session.metadata.quotaIncrease);

//         ws.send(JSON.stringify({
//             type: 'QUOTA_UPGRADE_SUCCESS',
//             newQuota: await this.resourceQuota.getCurrentQuota(ws.userId)
//         }));

//         this.emit('quota:upgraded', {
//             userId: ws.userId,
//             newQuota: session.metadata.quotaIncrease
//         });
//     }

//     private setupRecurringBillingChecks(): void {
//         setInterval(async () => {
//             const renewals = await this.getUpcomingRenewals();
//             for (const subscription of renewals) {
//                 await this.handleRecurringBilling(subscription);
//             }
//         }, 24 * 60 * 60 * 1000);
//     }

//     private async handleRecurringBilling(subscription: SubscriptionDetails): Promise<void> {
//         try {
//             const result = await this.processRecurringPayment(subscription);

//             if (result.success) {
//                 await this.resourceQuota.increaseQuota(subscription.userId, subscription.tierId);
//                 this.notifyUser(subscription.userId, {
//                     type: 'BILLING_SUCCESS',
//                     amount: result.amount,
//                     nextBillingDate: result.nextBillingDate
//                 });
//             } else {
//                 await this.handleFailedPayment(subscription);
//             }
//         } catch (error) {
//             monitoringManager.logger.error(error, SystemError.RECURRING_BILLING_FAILED, {
//                 subscriptionId: subscription.id
//             });
//         }
//     }

//     private async processRecurringPayment(subscription: SubscriptionDetails): Promise<any> {
//         return { success: true, amount: 1000, nextBillingDate: new Date() };
//     }

//     private async handleFailedPayment(subscription: SubscriptionDetails): Promise<void> {
//         this.emit('payment:failure', { userId: subscription.userId });
//     }

//     private notifyUser(userId: string, message: any): void {
//         // Notify user about payment status updates
//     }

//     private async getUpcomingRenewals(): Promise<SubscriptionDetails[]> {
//         return [];
//     }
// }

// export const paymentGateway = PaymentGateway.getInstance();
