import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Load the OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not defined in the environment variables.");
    process.exit(1); // Exit the process if API key is missing
}

/**
 * Function to get a description of an image using GPT-4 Vision.
 * @param {string} imagePath - The local path to the image file.
 * @return {Promise<string>} - The description of the image.
 */
async function describeImage(imagePath: string): Promise<string> {
    // Convert image to Base64
    const base64Image = encodeImageToBase64(imagePath);

    // Create the payload for the API request
    const payload = {
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "What's in this image?" },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }
        ],
        max_tokens: 300
    };

    // Configure the HTTP headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };

    try {
        // Make the API request
        const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });
        return response.data.choices[0].message.content.text;
    } catch (error) {
        console.error('Error in describing image:', error);
        throw error;
    }
}

/**
 * Function to encode an image to Base64.
 * @param {string} imagePath - Path to the image file.
 * @return {string} - The Base64 encoded string of the image.
 */
function encodeImageToBase64(imagePath: fs.PathOrFileDescriptor): string {
    return fs.readFileSync(imagePath, { encoding: 'base64' });
}

export default describeImage;
