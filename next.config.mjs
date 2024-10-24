// next.config.mjs
import { fileURLToPath } from 'url';
import path from 'path';
import withSvgr from 'next-plugin-svgr';
import withTM from 'next-transpile-modules';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
      include: path.resolve(__dirname, 'src/assets/images'),
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.licdn.com' },
      { protocol: 'https', hostname: 'mirasmindstorage.blob.core.windows.net' },
    ],
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
  env: {
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_DATABASE_URL: process.env.NEXT_PUBLIC_DATABASE_URL,
    LLAMA3_API_KEY: process.env.LLAMA3_API_KEY,
    LLAMA3_API_URL: process.env.LLAMA3_API_URL,
    NEXT_PUBLIC_LLAMA3_API_KEY: process.env.NEXT_PUBLIC_LLAMA3_API_KEY,
    NEXT_PUBLIC_LLAMA3_API_URL: process.env.NEXT_PUBLIC_LLAMA3_API_URL,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    HUDDLE_AI_DEMO_VIDEO: process.env.HUDDLE_AI_DEMO_VIDEO,
    AZURE_COSMODB_CONNECTION_STRING: process.env.AZURE_COSMODB_CONNECTION_STRING,
    AZURE_SERVICE_BUS_CONNECTION_STRING: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
    AZURE_SERVICE_BUS_QUEUE_NAME: process.env.AZURE_SERVICE_BUS_QUEUE_NAME,
    AZURE_COMMUNICATIONS_CONNECTION_STRING: process.env.AZURE_COMMUNICATIONS_CONNECTION_STRING,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    AETHERIQ_EMAIL_SENDER_ADDRESS: process.env.AETHERIQ_EMAIL_SENDER_ADDRESS,
    AZURE_NOTIFICATION_HUB_CONNECTION_STRING: process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING,
    AZURE_NOTIFICATION_HUB_NAME: process.env.AZURE_NOTIFICATION_HUB_NAME,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME,
    AZURE_BLOB_SAS_TOKEN: process.env.AZURE_BLOB_SAS_TOKEN,
    AZURE_BLOB_ACCOUNT_KEY: process.env.AZURE_BLOB_ACCOUNT_KEY,
    AZURE_BLOB_CONTAINER_NAME: process.env.AZURE_BLOB_CONTAINER_NAME,
    AZURE_BLOB_ACCOUNT_NAME: process.env.AZURE_BLOB_ACCOUNT_NAME,
    AZURE_BLOB_ACCOUNT_URL: process.env.AZURE_BLOB_ACCOUNT_URL,
    AZURE_BLOB_CONNECTION_STRING: process.env.AZURE_BLOB_CONNECTION_STRING,
    NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID: process.env.NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID,
    NEXT_PUBLIC_AZURE_RESOURCE_GROUP_NAME: process.env.NEXT_PUBLIC_AZURE_RESOURCE_GROUP_NAME,
    NEXT_PUBLIC_STORAGE_ACCOUNT_NAME: process.env.NEXT_PUBLIC_STORAGE_ACCOUNT_NAME,
    NEXT_PUBLIC_COSMOS_ACCOUNT_NAME: process.env.NEXT_PUBLIC_COSMOS_ACCOUNT_NAME,
    AI_API_KEY: process.env.AI_API_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_STORAGE_ACCOUNT_URL: process.env.NEXT_PUBLIC_STORAGE_ACCOUNT_URL,
    NEXT_PUBLIC_STORAGE_ACCOUNT_KEY: process.env.NEXT_PUBLIC_STORAGE_ACCOUNT_KEY,
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
    NEXT_PUBLIC_STRIPE_SECRET_KEY: process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    US_CENSUS_API: process.env.US_CENSUS_API,
    AZURE_COSMODB_USERNAME: process.env.AZURE_COSMODB_USERNAME,
    AZURE_COSMODB_PASSWORD: process.env.AZURE_COSMODB_PASSWORD,
    AZURE_COSMODB_HOST: process.env.AZURE_COSMODB_HOST,
    AZURE_COSMODB_PORT: process.env.AZURE_COSMODB_PORT,
    AZURE_COSMOS_DB_ENDPOINT: process.env.AZURE_COSMOS_DB_ENDPOINT,
    NEXT_PUBLIC_COSMOS_DB_ENDPOINT: process.env.NEXT_PUBLIC_COSMOS_DB_ENDPOINT,
    AETHERIQ_EMAIL_SENDER_ADDRESS: process.env.AETHERIQ_EMAIL_SENDER_ADDRESS,
    STORAGE_ACCOUNT_NAME: process.env.STORAGE_ACCOUNT_NAME,
    KEY_VAULT_URL: process.env.KEY_VAULT_URL,
    NEXT_PUBLIC_LOGO_LIGHT: process.env.NEXT_PUBLIC_LOGO_LIGHT,
    NEXT_PUBLIC_LOGO_DARK: process.env.NEXT_PUBLIC_LOGO_DARK,
    USE_MOCK_DATA: process.env.USE_MOCK_DATA,
    AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,
    AZURE_BILLING_ACCOUNT_ID: process.env.AZURE_BILLING_ACCOUNT_ID,
    AZURE_SERVICE_ADMIN_NAME: process.env.AZURE_SERVICE_ADMIN_NAME,
    AZURE_RESOURCE_GROUP: process.env.AZURE_RESOURCE_GROUP,
    AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
    REDIS_CONNECTION_STRING: process.env.REDIS_CONNRCTION_STRING,
    AZURE_DATALAKE_STORAGE: process.env.AZURE_DATALAKE_STORAGE,
    AZURE_TABLE_SERVICE: process.env.AZURE_TABLE_SERVICE,
    AZURE_QUEUE_SERVICE: process.env.AZURE_QUEUE_SERVICE,
    AZURE_STORAGE_CONTAINER: process.env.AZURE_STORAGE_CONTAINER,
    AZURE_STORAGE_CONTAINER_BLOB: process.env.AZURE_STORAGE_CONTAINER_BLOB,
    NEXT_PUBLIC_STRIPE_FREE_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_FREE_PLAN_ID,
    NEXT_PUBLIC_STRIPE_BASIC_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_BASIC_PLAN_ID,
    NEXT_PUBLIC_STRIPE_PRO_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID,
    NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_ID,
    AZURE_SUBSCRIPTION_COMMAMD_SET: process.env.AZURE_SUBSCRIPTION_COMMAMD_SET,
    AZURE_SUBSCRIPTION_COMMAMD_GET: process.env.AZURE_SUBSCRIPTION_COMMAMD_GET,
      },
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },

 // Update the serverInitialize to handle async initialization
  async serverInitialize(phase, { defaultConfig }) {
    try {
      const { initializeServer } = await import('./src/server/init.js');
      await initializeServer();
    } catch (error) {
      console.error('Failed to initialize server:', error);
    }
  },
};
// Wrap configuration with both plugins
export default withSvgr(
  withTM({
    ...nextConfig,
    transpilePackages: [
      '@mui/x-date-pickers',
      'react-speech-recognition',
    ],
  })
);