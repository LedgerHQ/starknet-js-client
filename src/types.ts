import BN from "bn.js";

export interface ResponseBase {
  errorMessage: string;
  returnCode: number;
}

export interface ResponseGeneric extends ResponseBase {
  data: Uint8Array;
}

export interface ResponsePublicKey extends ResponseBase {
  publicKey: Uint8Array;
}

export interface ResponseStarkKey extends ResponseBase {
  starkKey: Uint8Array;
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

export type CalldataMetadata = {
  name: string;
  encoded: Uint8Array;
  //type: 'felt' | 'felt*' | string;
};

export type Call = {
  to: string;
  entrypoint: string;
  calldata: string[];
};

export type TxFields = {
  accountAddress: string;
  nonce: BigNumberish;
  maxFee: BigNumberish;
  version: BigNumberish;
  chainId: string;
};

export type AbiEntry = { name: string; type: "felt" | "felt*" | string };

export type FunctionAbi = {
  inputs: AbiEntry[];
  name: string;
  outputs: AbiEntry[];
  stateMutability?: "view";
  type: "function" | "constructor";
};

export type StructAbi = {
  members: (AbiEntry & { offset: number })[];
  name: string;
  size: number;
  type: "struct";
};

export type Abi = Array<FunctionAbi | StructAbi>;
