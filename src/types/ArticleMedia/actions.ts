// src/features/resources/types/actions.ts

import { Resource, ResourceStatus, ResourceVisibility } from "./resources";

export interface ActionLoadingState {
  [key: string]: boolean;
}

export interface ResourceActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// src/components/Resources/types/actions.ts
export interface ResourceActionHookReturn {
  handleBookmark: (id: string) => Promise<ResourceActionResult<boolean>>;
  handleRate: (id: string, rating: number) => Promise<ResourceActionResult<Resource>>;
  handleDelete: (id: string) => Promise<ResourceActionResult<boolean>>;
  handleUpdateStatus: (id: string, status: ResourceStatus) => Promise<ResourceActionResult<Resource>>;
  handleUpdateVisibility: (id: string, visibility: ResourceVisibility) => Promise<ResourceActionResult<Resource>>;
  isLoading: (actionType: string, id: string) => boolean;
  loading: ActionLoadingState;
}
