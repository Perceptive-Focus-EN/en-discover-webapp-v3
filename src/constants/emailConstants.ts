// src/EmailWorkflow/constants/emailConstants.ts

interface EmailTheme {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    linkColor: string;
    buttonColor: string;
    buttonTextColor: string;
  }
  
  const defaultTheme: EmailTheme = {
    primaryColor: '#1a3b5d',
    secondaryColor: '#4a90e2',
    backgroundColor: '#f5f5f5',
    textColor: '#333333',
    linkColor: '#4a90e2',
    buttonColor: '#4a90e2',
    buttonTextColor: '#ffffff',
  };
  
  export const getEmailStyles = (theme: EmailTheme = defaultTheme) => `
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: ${theme.textColor};
      margin: 0;
      padding: 0;
      background-color: ${theme.backgroundColor};
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: ${theme.primaryColor};
      margin-top: 0;
    }
    
    p {
      margin-bottom: 20px;
    }
    
    a {
      color: ${theme.linkColor};
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: ${theme.buttonColor};
      color: ${theme.buttonTextColor};
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    
    .button:hover {
      opacity: 0.9;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid ${theme.secondaryColor};
      font-size: 14px;
      color: ${theme.textColor};
      opacity: 0.8;
      text-align: center;
    }
    
    .token-container {
      background-color: ${theme.backgroundColor};
      border: 1px solid ${theme.secondaryColor};
      border-radius: 4px;
      padding: 10px;
      margin: 20px 0;
      text-align: center;
    }
    
    .token {
      font-size: 24px;
      font-weight: bold;
      color: ${theme.primaryColor};
    }
    
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #121212;
        color: #f0f0f0;
      }
      
      .container {
        background-color: #1e1e1e;
        box-shadow: 0 4px 6px rgba(255, 255, 255, 0.1);
      }
      
      h1, h2, h3, h4, h5, h6 {
        color: ${theme.secondaryColor};
      }
      
      a {
        color: ${theme.linkColor};
      }
      
      .footer {
        border-top-color: ${theme.secondaryColor};
        color: #aaaaaa;
      }
      
      .token-container {
        background-color: #2a2a2a;
        border-color: ${theme.secondaryColor};
      }
      
      .token {
        color: ${theme.secondaryColor};
      }
    }
  `;
  
  export const COMPANY_NAME = process.env.COMPANY_NAME || 'Our Company';
  export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@example.com';
  export const SUPPORT_PHONE = process.env.SUPPORT_PHONE || '(123) 456-7890';
  
// Export the default theme and the EmailTheme type
export { defaultTheme };
export type { EmailTheme };
