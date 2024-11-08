import { ExtendedUserInfo } from "./User/interfaces";

export interface UpdateUserInfoResponse {
  user: ExtendedUserInfo
  message: string;
}