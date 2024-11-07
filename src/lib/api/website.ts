import axios from 'axios';

// Define types for our data structures
type Theme = {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  // Add more theme properties as needed
};

type LayoutElement = {
  id: string;
  type: string;
  properties: Record<string, any>;
  children?: LayoutElement[];
};

type Content = Record<string, any>;

type Website = {
  id: string;
  name: string;
  theme: Theme;
  layout: LayoutElement[];
  content: Content;
};

class WebsiteService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // CRUD operations for websites
  async createWebsite(websiteData: Partial<Website>): Promise<Website> {
    const response = await axios.post(`${this.baseUrl}/websites`, websiteData);
    return response.data;
  }

  async getWebsite(id: string): Promise<Website> {
    const response = await axios.get(`${this.baseUrl}/websites/${id}`);
    return response.data;
  }

  async updateWebsite(id: string, websiteData: Partial<Website>): Promise<Website> {
    const response = await axios.put(`${this.baseUrl}/websites/${id}`, websiteData);
    return response.data;
  }

  async deleteWebsite(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/websites/${id}`);
  }

  // Theme operations
  async updateTheme(websiteId: string, theme: Theme): Promise<Theme> {
    const response = await axios.put(`${this.baseUrl}/websites/${websiteId}/theme`, theme);
    return response.data;
  }

  // Layout operations
  async updateLayout(websiteId: string, layout: LayoutElement[]): Promise<LayoutElement[]> {
    const response = await axios.put(`${this.baseUrl}/websites/${websiteId}/layout`, layout);
    return response.data;
  }

  // Content operations
  async updateContent(websiteId: string, content: Content): Promise<Content> {
    const response = await axios.put(`${this.baseUrl}/websites/${websiteId}/content`, content);
    return response.data;
  }

  // Version control operations
  async commitChanges(websiteId: string): Promise<void> {
    await axios.post(`${this.baseUrl}/websites/${websiteId}/commit`);
  }

  async getVersionHistory(websiteId: string): Promise<string[]> {
    const response = await axios.get(`${this.baseUrl}/websites/${websiteId}/versions`);
    return response.data;
  }

  async revertToVersion(websiteId: string, versionId: string): Promise<Website> {
    const response = await axios.post(`${this.baseUrl}/websites/${websiteId}/revert`, { versionId });
    return response.data;
  }

  // Preview generation
  async generatePreview(websiteId: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/websites/${websiteId}/preview`);
    return response.data.previewUrl;
  }

  // Deployment
  async deployWebsite(websiteId: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/websites/${websiteId}/deploy`);
    return response.data.deploymentUrl;
  }

  // Placeholder for analytics
  async getAnalytics(websiteId: string, startDate: Date, endDate: Date): Promise<any> {
    // This is a placeholder function. Implement when analytics are added.
    console.log('Analytics not yet implemented');
    return {};
  }

  // AI-assisted content generation
  async generateAIContent(websiteId: string, prompt: string): Promise<Content> {
    const response = await axios.post(`${this.baseUrl}/websites/${websiteId}/ai-content`, { prompt });
    return response.data;
  }

  // Component library
  async getComponentLibrary(): Promise<LayoutElement[]> {
    const response = await axios.get(`${this.baseUrl}/component-library`);
    return response.data;
  }

  // Export website
  async exportWebsite(websiteId: string, format: 'json' | 'html'): Promise<Blob> {
    const response = await axios.get(`${this.baseUrl}/websites/${websiteId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }
}

export default WebsiteService;