export interface ResponseBase {
  errorMessage: string;
  returnCode: number;
}

export interface ResponsePublicKey extends ResponseBase {
  publicKey: Uint8Array;
}

export interface ResponseVersion extends ResponseBase {
  major: number;
  minor: number;
  patch: number;
}

export interface ResponseAppInfo extends ResponseBase {
  appName: string;
}

export interface ResponseSign extends ResponseBase {
  r: Uint8Array;
  s: Uint8Array;
  v: number;
}
