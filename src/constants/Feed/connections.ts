import axiosInstance from '../../lib/axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { connectionsApi } from '../../lib/api_s/feed/connections';

export const FEED_ACTIONS = {
  SEND_CONNECTION_REQUEST: connectionsApi.sendConnectionRequest,
  ACCEPT_CONNECTION_REQUEST: connectionsApi.acceptConnectionRequest,
  GET_CONNECTIONS: connectionsApi.getConnections,
  GET_CONNECTION_REQUESTS: connectionsApi.getConnectionRequests,
};