// src/utils/models/openAITransform.ts
import axios from 'axios';
import { CosmosDBSchema, CosmosDBDocument } from '../utils/schema/cosmosDBSchema';

export async function callOpenAI(inputData: any): Promise<CosmosDBDocument> {
  const systemMessage = `
    You are a data transformation assistant. Transform the input data into the following Cosmos DB document format:
    {
      "tenantId": string,
      "entity": {
        "id": string,
        "type": string,
        "name": string,
        "version": number,
        "createdAt": string (ISO date),
        "updatedAt": string (ISO date),
        "metadata": {
          "industry": string,
          "size": string,
          "tags": string[],
          "customFields": object
        }
      },
      "timeSeries": [
        {
          "timestamp": string (ISO date),
          "metrics": object
        }
      ],
      "latestAnalysis": {
        "timestamp": string (ISO date),
        "summary": string,
        "keyInsights": string[],
        "charts": object | null,
        "insights": object | null,
        "statistics": object | null
      },
      "aiFeatures": {
        "embeddingVector": number[],
        "lastProcessedTimestamp": string (ISO date),
        "modelVersion": string
      },
      "ttl": number
    }
  `;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: `Transform this data: ${JSON.stringify(inputData)}` }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        }
      }
    );

    const transformedData = JSON.parse(response.data.choices[0].message.content);
    return CosmosDBSchema.parse(transformedData);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}