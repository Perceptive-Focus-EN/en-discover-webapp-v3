import { generateResponse } from '../services/openAIApiService';
import axiosInstance from '../lib/axiosSetup';
import { AxiosResponse } from 'axios';

interface GenerateResponseProps {
  userInput: string;
  context?: string[];
}

interface ChunkUploadResponse {
  message: string;
  chunkId: string;
}

const MAX_CHUNK_SIZE = 4000; // Characters, adjust based on your API limits
const MAX_CONTEXT_LENGTH = 5; // Number of previous messages to include for context

const uploadChunk = async (chunk: string): Promise<ChunkUploadResponse> => {
  const formData = new FormData();
  formData.append('chunk', new Blob([chunk], { type: 'text/plain' }));

  try {
    const response: AxiosResponse<ChunkUploadResponse> = await axiosInstance.post('/api/chunks/text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.status !== 200) {
      throw new Error(`Failed to upload chunk: ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    console.error('Error uploading chunk:', error);
    throw error;
  }
};

const generateResponseGenerator = async ({ userInput, context = [] }: GenerateResponseProps): Promise<string> => {
  let fullPrompt = '';

  // Add context to the prompt
  if (context.length > 0) {
    const recentContext = context.slice(-MAX_CONTEXT_LENGTH);
    fullPrompt += "Previous conversation:\n" + recentContext.join("\n") + "\n\n";
  }

  fullPrompt += `User: ${userInput}\n\nAssistant: `;

  let response = '';

  if (fullPrompt.length > MAX_CHUNK_SIZE) {
    // If the prompt is too large, we need to chunk it
    const chunks = [];
    for (let i = 0; i < fullPrompt.length; i += MAX_CHUNK_SIZE) {
      chunks.push(fullPrompt.slice(i, i + MAX_CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      const { chunkId } = await uploadChunk(chunk);
      const partialResponse = await generateResponse(`Continue from chunk ${chunkId}`);
      response += partialResponse;
    }
  } else {
    response = await generateResponse(fullPrompt);
  }

  if (!response) {
    throw new Error("Failed to generate a response.");
  }

  return response.trim();
};

export default generateResponseGenerator;