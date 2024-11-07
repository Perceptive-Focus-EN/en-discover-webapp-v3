import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define base URL for OpenAI API
const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/';
// Load the API key from environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error("Error: OPENAI_API_KEY is not defined in the environment variables.");
}

/**
 * Fetches an image from OpenAI's DALL-E model.
 * @param {string} text - The prompt text for image generation.
 * @param {string} [enhancedPrompt] - An optional enhanced prompt.
 * @returns {Promise<string | null>} - The URL of the generated image.
 */
export const fetchImage = async (text: string, enhancedPrompt?: string): Promise<string | null> => {
    const requestBody = {
        model: "dall-e-3",
        prompt: enhancedPrompt || text,
        n: 1,
        size: "1024x1024",
    };

    try {
        const response = await axios.post(`${OPENAI_BASE_URL}images/generations`, requestBody, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,  // Use environment variable
                'Content-Type': 'application/json'
            }
        });
        const generatedImageUrl = response.data?.data?.[0]?.url;
        return generatedImageUrl;
    } catch (error) {
        console.error("Error fetching image:", error);
        return null;
    }
};

/**
 * Generates a response from OpenAI's GPT model.
 * @param {string} prompt - The input prompt for text generation.
 * @returns {Promise<string>} - The generated response text.
 */
export const generateResponse = async (prompt: string): Promise<string> => {
    const requestBody = {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.7,
    };

    try {
        const response = await axios.post(`${OPENAI_BASE_URL}completions`, requestBody, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,  // Use environment variable
                'Content-Type': 'application/json'
            }
        });

        // Extract the generated text from the response
        const generatedContent = response.data.choices[0].message.content;
        return generatedContent.trim();
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("OpenAI API Error:", error.response.data);
            throw new Error(`OpenAI API Error: ${error.response.data.error.message}`);
        } else {
            console.error("Unexpected Error:", error);
            throw new Error("An unexpected error occurred while generating the response.");
        }
    }
};
