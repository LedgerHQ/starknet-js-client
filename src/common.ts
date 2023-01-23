import Transport from "@ledgerhq/hw-transport";

export const CLA = 0x5A;
export const INS = {
  GET_VERSION: 0x00,
  GET_APP_NAME: 0x01,
  GET_PUB_KEY: 0x02,
  SIGN: 0x03,
  SIGN_TX: 0x04
};

export const CHUNK_SIZE = 250;
export const HASH_MAX_LENGTH = 63;
export const PAYLOAD_TYPE = {
  INIT: 0x00,
  ADD: 0x01,
  LAST: 0x02,
};

export enum LedgerError {
  NoErrors = 0x9000,
  DeviceIsBusy = 0x9001,
  ErrorDerivingKeys = 0x6802,
  ExecutionError = 0x6400,
  WrongLength = 0x6700,
  EmptyBuffer = 0x6982,
  OutputBufferTooSmall = 0x6983,
  DataIsInvalid = 0x6984,
  ConditionsNotSatisfied = 0x6985,
  TransactionRejected = 0x6986,
  BadKeyHandle = 0x6a80,
  InvalidP1P2 = 0x6b00,
  InstructionNotSupported = 0x6d00,
  AppDoesNotSeemToBeOpen = 0x6e00,
  UnknownError = 0x6f00,
  SignVerifyError = 0x6f01,
}

export const ERROR_DESCRIPTION = {
  [LedgerError.NoErrors]: "No errors",
  [LedgerError.DeviceIsBusy]: "Device is busy",
  [LedgerError.ErrorDerivingKeys]: "Error deriving keys",
  [LedgerError.ExecutionError]: "Execution Error",
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
  [LedgerError.SignVerifyError]: "Sign/verify error",
};

export function errorCodeToString(statusCode: LedgerError) {
  if (statusCode in ERROR_DESCRIPTION) return ERROR_DESCRIPTION[statusCode];
  return `Unknown Status Code: ${statusCode}`;
}

function isDict(v: any) {
  return (
    typeof v === "object" &&
    v !== null &&
    !(v instanceof Array) &&
    !(v instanceof Date)
  );
}

export function processErrorResponse(response?: any) {
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
      data: new Uint8Array(),
      returnCode: 0xffff,
      errorMessage: response.toString(),
    };
  }

  return {
    returnCode: 0xffff,
    errorMessage: response.toString(),
  };
}
