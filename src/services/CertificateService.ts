// services/CertificateService.ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { CertificateClient } from "@azure/keyvault-certificates";
import * as forge from 'node-forge';

export class CertificateService {
  private secretClient: SecretClient;
  private certificateClient: CertificateClient;

  constructor() {
    const credential = new DefaultAzureCredential();
    this.secretClient = new SecretClient(process.env.KEY_VAULT_URL!, credential);
    this.certificateClient = new CertificateClient(process.env.KEY_VAULT_URL!, credential);
  }

  async generateCertificate(domain: string): Promise<void> {
    const certOperation = await this.certificateClient.beginCreateCertificate(domain, {
      issuerName: "Self",
      subject: `CN=${domain}`,
      validityInMonths: 12,
    });
    await certOperation.pollUntilDone();
  }

  async getCertificate(domain: string): Promise<string> {
    const cert = await this.certificateClient.getCertificate(domain);
    if (cert && cert.cer) {
      return cert.cer.toString();
    }
    return "";
  }
}