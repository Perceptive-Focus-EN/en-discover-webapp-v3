import axiosInstance from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';

export const connectionsApi = {
  sendConnectionRequest: (userId: string) =>
    axiosInstance.post(API_ENDPOINTS.SEND_CONNECTION_REQUEST, { userId }),

  acceptConnectionRequest: (userId: string) =>
    axiosInstance.post(API_ENDPOINTS.ACCEPT_CONNECTION_REQUEST, { userId }),

  getConnections: () =>
    axiosInstance.get(API_ENDPOINTS.GET_CONNECTIONS),

  getConnectionRequests: () =>
    axiosInstance.get(API_ENDPOINTS.GET_CONNECTION_REQUESTS),
};