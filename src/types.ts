import { BigNumberish } from "starknet";
import { EDataAvailabilityMode, ResourceBounds } from "@starknet-io/types-js";

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

export interface ResponseHashSign extends ResponseBase {
  // Signature (r, s, v)
  r: Uint8Array;
  s: Uint8Array;
  v: number;
}

export interface ResponseTxSign extends ResponseHashSign {
  // Tx hash
  h: Uint8Array;
}

export type TxFields = {
  accountAddress: string;
  tip: BigNumberish;
  resourceBounds: ResourceBounds;
  paymaster_data: BigNumberish[];
  chainId: string;
  nonce: BigNumberish;
  nonceDataAvailabilityMode: EDataAvailabilityMode;
  feeDataAvailabilityMode: EDataAvailabilityMode;
  account_deployment_data: BigNumberish[];
};

export type TxV1Fields = {
  accountAddress: string;
  max_fee: BigNumberish;
  chainId: string;
  nonce: BigNumberish;
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
