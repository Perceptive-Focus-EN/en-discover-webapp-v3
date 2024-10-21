import axiosInstance from '../../axiosSetup';
import axios, { AxiosResponse } from 'axios';

interface PhotoUploadResponse {
    message: string;
    photoUrl: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export const uploadPhoto = async (file: File, caption?: string): Promise<PhotoUploadResponse> => {
    if (!file) {
        throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds the maximum limit of 5MB');
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed');
    }

    const formData = new FormData();
    formData.append('photo', file);
    if (caption) {
        formData.append('caption', caption);
    }

    try {
        const response: AxiosResponse<PhotoUploadResponse> = await axiosInstance.post('/api/posts/photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        if (response.status !== 200) {
            throw new Error(`Failed to upload photo: ${response.statusText}`);
        }
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Network error:', error.message);
            throw new Error('Network error occurred while uploading photo');
        } else {
            console.error('Error uploading photo:', error);
            throw error;
        }
    }
};