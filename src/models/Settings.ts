// src/models/Settings.ts
export interface StaticSettings {
  _id: string;
  type: 'faq' | 'terms' | 'privacy-policy';
  content: {
    lastUpdated: Date;
    version?: string;
    data: any;
  };
}

// Initialize in your database with default content:
const defaultSettings = [
  {
    type: 'faq',
    content: {
      lastUpdated: new Date(),
      questions: [
        {
          question: "What is ENDiscover?",
          answer: "ENDiscover is a platform..."
        }
      ]
    }
  },
  {
    type: 'terms',
    content: {
      version: "1.0",
      lastUpdated: new Date(),
      content: "Terms of Service..."
    }
  },
  {
    type: 'privacy-policy',
    content: {
      version: "1.0",
      lastUpdated: new Date(),
      content: "Privacy Policy..."
    }
  }
];