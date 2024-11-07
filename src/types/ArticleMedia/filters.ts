// Filters and Sorting

import { FileCategory, UploadStatus } from "@/constants/uploadConstants";
import { Resource } from "./resources";



// src/types/ArticleMedia/filters.ts
import { ResourceStatus, ResourceVisibility } from './resources';

export interface ResourceFilters {
    category?: string[];
    processingStatus?: UploadStatus[];
    visibility?: ResourceVisibility;
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    searchTerm?: string;
}

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

export interface ResourceSortOptions {
    field: keyof Resource | 'uploadDate' | 'processingStatus';
    direction: 'asc' | 'desc';
}