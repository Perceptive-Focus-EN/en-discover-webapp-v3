import { postReactionsApi } from '@/lib/api_s/reactions/postReactions';
import { feedApi } from '../../lib/api_s/feed/index';
import { axiosInstanc } from '../../lib/axiosSetup';

export const FEED_ACTIONS = {
  SEND_CONNECTION_REQUEST: feedApi.sendConnectionRequest,
  ACCEPT_CONNECTION_REQUEST: feedApi.acceptConnectionRequest,
  GET_CONNECTIONS: postReactionsApi.getConnections,
  GET_CONNECTION_REQUESTS: connectionsApi.getConnectionRequests,
};