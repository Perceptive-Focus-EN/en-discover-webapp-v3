// import axios from 'axios';
// import dotenv from 'dotenv';
// 
// dotenv.config();
// 
// const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/';
// const OPENAI_API_KEY = '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';
// 
// 
// export const fetchImage = async (text: string, enhancedPrompt?: string) => {
    // const requestBody = {
        // model: "dall-e-3",  // Use the DALL-E model
        // prompt: enhancedPrompt || text,  // Use enhancedPrompt if available, otherwise default to text
        // n: 1,
        // size: "1024x1024",
    // };
// 
    // try {
        // const response = await axios.post(`${OPENAI_BASE_URL}images/generations`, requestBody, {
            // headers: {
                // 'Authorization': `Bearer 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`
            // }
        // });
        // const generatedImageUrl = response.data?.data?.[0]?.url;
        // return generatedImageUrl;
    // } catch (error) {
        // console.error("Error fetching image:", error);
        // return null;
    // }
// };
// 
// 
// export const generateResponse = async (prompt: string): Promise<string> => {
    // try {
        // const response = await axios.post(`${OPENAI_BASE_URL}completions`, {
            // model: "gpt-4",
            // messages: [{ role: "user", content: prompt }],
            // max_tokens: 3000,
            // temperature: 0.7
        // }, {
            // headers: {
                // 'Authorization': `Bearer ${OPENAI_API_KEY}`,
                // 'Content-Type': 'application/json'
            // }
        // });
// 
        // const generatedContent = response.data.choices[0].message.content;
        // return generatedContent.trim();
    // } catch (error) {
        // if (axios.isAxiosError(error) && error.response) {
            // console.error("OpenAI API Error:", error.response.data);
            // throw new Error(`OpenAI API Error: ${error.response.data.error.message}`);
        // } else {
            // console.error("Unexpected Error:", error);
            // throw new Error("An unexpected error occurred while generating the response.");
        // }
    // }
// };
// 


// Ensure you're extracting the generated text correctly from the response


// 
// export const generateResponse = async (prompt: string) => {
    // try {
        // const response = await axios.post(`${OPENAI_BASE_URL}completions`, {
            // model: "gpt-3.5-turbo-instruct",
            // prompt: prompt, // Use the 'prompt' parameter directly
            // max_tokens: 3000,
            // temperature: 0.7
        // }, {
            // headers: {
                // 'Authorization': `Bearer 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`
            // }
        // });
        // const generatedContent = response.data.choices[0].text;
        // return generatedContent.trim();
    // } catch (error) {
        // console.error("Story Generation Error:", (error as any).response?.data || (error as any).message);
        // throw error;
    // }
// };