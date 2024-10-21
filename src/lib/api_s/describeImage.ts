import axios from 'axios';
import fs from 'fs';

const OPENAI_API_KEY = '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';

/**
 * Function to get a description of an image using GPT-4 Vision.
 * @param {string} imagePath - The local path to the image file.
 * @return {Promise<string>} - The description of the image.
 */
async function describeImage(imagePath: any) {
    // Convert image to Base64
    const base64Image = encodeImageToBase64(imagePath);

    // Create the payload for the API request
    const payload = {
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Whats in this image?" },
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
function encodeImageToBase64(imagePath: fs.PathOrFileDescriptor) {
    return fs.readFileSync(imagePath, { encoding: 'base64' });
}

export default describeImage;
