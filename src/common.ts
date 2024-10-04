import { ResponseBase } from "./types";

export const CLA = 0x5a;
export const INS = {
  GET_VERSION: 0x00,
  GET_PUB_KEY: 0x01,
  SIGN_HASH: 0x02,
  SIGN_TX: 0x03,
  SIGN_TX_V1: 0x04,
};

export const CHUNK_SIZE = 250;
export const HASH_MAX_LENGTH = 63;

export enum LedgerError {
  NoError = 0x9000,
  BadCla = 0x6e00,
  BadIns = 0x6e01,
  InvalidP1P2 = 0x6e02,
  UserRejected = 0x6e04,
  ExecutionError = 0x6f00,
  /* To be cleaned ? */
  /*DeviceIsBusy = 0x9001,
  ErrorDerivingKeys = 0x6802,
  WrongLength = 0x6700,
  EmptyBuffer = 0x6982,
  OutputBufferTooSmall = 0x6983,
  DataIsInvalid = 0x6984,
  ConditionsNotSatisfied = 0x6985,
  BadKeyHandle = 0x6a80,
  InstructionNotSupported = 0x6d00,
  AppDoesNotSeemToBeOpen = 0x6e00,  
  SignVerifyError = 0x6f01,*/
}

export const ERROR_DESCRIPTION = {
  [LedgerError.NoError]: "No error",
  [LedgerError.BadCla]: "Bad CLA",
  [LedgerError.BadIns]: "Bad INS",
  [LedgerError.InvalidP1P2]: "InvalidP1P2",
  [LedgerError.UserRejected]: "Rejected by User",
  [LedgerError.ExecutionError]: "Execution Error",
  /*[LedgerError.DeviceIsBusy]: "Device is busy",
  [LedgerError.ErrorDerivingKeys]: "Error deriving keys",
  [LedgerError.WrongLength]: "Wrong Length",
  [LedgerError.EmptyBuffer]: "Empty Buffer",
  [LedgerError.OutputBufferTooSmall]: "Output buffer too small",
  [LedgerError.DataIsInvalid]: "Data is invalid",
  [LedgerError.ConditionsNotSatisfied]: "Conditions not satisfied",
  [LedgerError.TransactionRejected]: "Transaction rejected",
  [LedgerError.BadKeyHandle]: "Bad key handle",
  [LedgerError.InvalidP1P2]: "Invalid P1/P2",
  [LedgerError.InstructionNotSupported]: "Instruction not supported",
  [LedgerError.AppDoesNotSeemToBeOpen]: "App does not seem to be open",
  [LedgerError.UnknownError]: "Unknown error",
  [LedgerError.SignVerifyError]: "Sign/verify error",*/
};

export function errorCodeToString(statusCode: LedgerError) {
  if (statusCode in ERROR_DESCRIPTION) return ERROR_DESCRIPTION[statusCode];
  return `Unknown Status Code: ${statusCode}`;
}

function isDict(v: any) {
  return typeof v === "object" && v !== null && !(v instanceof Array) && !(v instanceof Date);
}

export function processErrorResponse(response?: any): ResponseBase {
  if (response) {
    if (isDict(response)) {
      if (Object.prototype.hasOwnProperty.call(response, "statusCode")) {
        return {
          returnCode: response.statusCode,
          errorMessage: errorCodeToString(response.statusCode),
        };
      }

      if (
        Object.prototype.hasOwnProperty.call(response, "returnCode") &&
        Object.prototype.hasOwnProperty.call(response, "errorMessage")
      ) {
        return response;
      }
    }
    return {
      //data: new Uint8Array(),
      returnCode: 0xffff,
      errorMessage: response.toString(),
    };
  }

  return {
    returnCode: 0xffff,
    errorMessage: response.toString(),
  };
}
