export type ExchangeTokenRequest = {
  clientId: string;
  grantType: string;
  code: string;
  redirectUri: string;
};

export type ExchangeTokenResponse = {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  tokenType?: string;
};

export type GetUserInfoResponse = {
  openId?: string;
  appId?: string;
  name?: string;
  email?: string;
};

export type GetUserInfoWithJwtRequest = {
  jwt: string;
};

export type GetUserInfoWithJwtResponse = GetUserInfoResponse;
