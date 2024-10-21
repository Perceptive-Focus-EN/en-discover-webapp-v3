// types/emotions.ts

import { ColorPalette } from "./colorPalette";
import { EmotionId, EmotionName } from '../../Feed/types/Reaction';
import { SOURCE_CATEGORIES, SourceCategoryId } from '../constants/sources';
import { VOLUME_LEVELS, VolumeLevelId } from '../constants/volume';

export interface Relationship {
    userId: string;
    categoryId: string;
    sourceName: string[];
}

export interface EmotionColor {
    userId: string;
    emotionId: EmotionId;
    color: string; // This should be an RGBA string like "rgba(r, g, b, a)"
}


export interface Emotion {
    id: EmotionId;
    userId: string;
    emotionName: EmotionName;
    sources: string[];
    color: string; // This should be an RGBA string like "rgba(r, g, b, a)"
    volume?: number;
    timestamp?: Date;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

export interface EmotionColorResponse {
    success: boolean;
    message: string;
    data: EmotionColor;
}

export interface EmotionBubble {
    id: string;
    color: string;
}

export interface UserEmotion {
    userId: number;
    emotionId: number;
    color: string | null;
}

export interface MoodBoardDetails {
    success: boolean;
    message: string;
    data: Emotion[];
}

export interface RelationshipResponse {
    success: boolean;
    message: string;
    data: Relationship & {
        id: number;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    };
}




export const defaultValues = {
    SKIP: 0,
    LIMIT: 10,
    SORT: -1,
};

export const status = {
    ACTIVE: true,
    DEACTIVE: false,
};

export const userType = {
    PERSONAL: 1,
    BUSINESS: 2,
    FAMILY: 3,
    INSTITUTE: 4,
    OTHER: 5,
};

export const palletType = {
    FREE: 'FREE',
    PAID: 'PAID'
};

export type PaletteType = 'FREE' | 'PAID';

export const loginType = {
    PHONE_NUMBER: 1,
    EMAIL: 2,
    GOOGLE: 3,
    FACEBOOK: 3,
};

export const onBoardingStepsUser = {
    REGISTRATION: 1,
    VERIFICATION: 2
};

export const notificationType = {
    CHAT: 'CHAT',
};

export const statusCode = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};



// Example API requests and responses

// POST: Update User Emotion with Color
// URL: http://localhost:3000/api/v1/app/emotion/store/user/emotion/color
const updateUserEmotionWithColor = {
    userId: 1,
    emotionId: 1,
    color: "#hexvalue"
};

// GET: Get MoodBoard Details for a user
// URL: http://localhost:3000/api/v1/app/emotion/get/emotions
// const getMoodBoardDetailsResponse: MoodBoardDetails = {
    // success: true,
    // message: "Request Was Successful",
    // data: [
        // { id: 1, emotionName: "ANGER", createdAt: "2023-02-09T15:28:13.242Z" },
        // { id: 2, emotionName: "FEAR", createdAt: "2023-02-09T15:28:13.262Z" },
        // { id: 3, emotionName: "SADNESS", createdAt: "2023-02-09T15:28:13.266Z" },
        // { id: 4, emotionName: "DISGUST", createdAt: "2023-02-09T15:28:13.269Z" },
        // { id: 5, emotionName: "SURPRISE", createdAt: "2023-02-09T15:28:13.274Z" },
        // { id: 6, emotionName: "ANTICIPATION", createdAt: "2023-02-09T15:28:13.278Z" },
        // { id: 7, emotionName: "TRUST", createdAt: "2023-02-09T15:28:13.282Z" },
        // { id: 8, emotionName: "JOY", createdAt: "2023-02-09T15:28:13.286Z" }
    // ]
// };
// 
// POST: Create Color Pallet
// URL: http://localhost:3000/api/v1/app/pallet/update/pallet/:id
// const createColorPalletRequest: ColorPalette = {
    // palletName: "Pallet 1",
    // categoryId: "1",
    // colors: ["#asdf", "#sadf", "#array_of_hex_value"],
    // type: palletType.FREE
// };
// 
// Example response for creating a color pallet
const createColorPalletResponse = {
    success: true,
    message: "Request Was Successful",
    data: {
        id: 1,
        palletName: "Pallet 1",
        categoryId: 1,
        colors: ['#asdf', '#sadf', '#array_of_hex_value'],
        type: "free",
        createdAt: "2023-02-09T15:36:18.622Z",
        updatedAt: "2023-02-09T15:36:18.622Z",
        deletedAt: null
    }
};

// POST: Add Relationship
// URL: http://localhost:3000/api/v1/app/create/relationship/:userId
const addRelationshipRequest: Relationship = {
    categoryId: "1",
    sourceName: ["Mohan"],
    userId: "1"
};

// Example response for adding a relationship
const addRelationshipResponse: RelationshipResponse = {
    success: true,
    message: "Request Was Successful",
    data: {
        id: 1,
        categoryId: "1",
        sourceName: ["Mohan"],
        userId: "1",
        createdAt: "2023-02-09T15:36:18.622Z",
        updatedAt: "2023-02-09T15:36:18.622Z",
        deletedAt: null
    }
};
