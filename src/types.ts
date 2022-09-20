import BN from "bn.js";

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

export type BigNumberish = string | number | BN;

export type Call = {
  contractAddress: string;
  entryPoint: string;
  calldata?: string[];
};

export type CallDetails = {
  nonce?: BigNumberish;
  maxFee?: BigNumberish;
  version?: BigNumberish;
  accountAddress: string;
  chainId: string;
}