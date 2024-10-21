// ttsAPI.js

import axios from 'axios';
const openaiUrl = 'https://api.openai.com/v1/audio/speech';
const apiKey = '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';

export const synthesizeSpeech = async (text: any, voice = 'onyx') => {
    if (!apiKey) {
        throw new Error('OpenAI API key is not set.');
    }

    try {
        const response = await axios.post(
            openaiUrl,
            {
                model: "tts-1",
                voice: voice,
                input: text,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                responseType: 'blob',
            }
        );

        console.log('API Response:', response);

        if (response.status === 200) {
            // Process the audio URL
            const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Audio URL:', audioUrl);
            return audioUrl;
        } else {
            // Handle errors here
            console.error('Error synthesizing speech. Status:', response.status);
            // Add additional error handling if needed
        }

    } catch (error) {
        console.error('Error synthesizing speech:', error);
        if (axios.isAxiosError(error)) {
            // Handle based on the response status code
            const status = error.response?.status;
            if (status === 429) {
                // Too many requests
                throw new Error('Our service is experiencing high demand. Please wait a moment and try again.');
            } else if (status && status >= 500) {
                // Server errors
                throw new Error('Were encountering a problem on our end.Please try again later.');
            } else {
                // Other HTTP errors
                throw new Error('An unexpected error occurred. Please try again.');
            }
        } else {
            // Non-Axios errors (e.g., network issues, cancelled requests, etc.)
            throw new Error('There was a problem processing your request. Please check your network connection and try again.');
        }

    }
};

