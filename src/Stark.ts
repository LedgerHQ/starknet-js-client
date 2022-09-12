/********************************************************************************
 *  (c) 2022 Ledger
 *  (c) 2019-2020 Zondax GmbH
 *  (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
import Transport from "@ledgerhq/hw-transport";
import { serializePath } from "./helper";
import {
  ResponsePublicKey,
  ResponseAppInfo,
  ResponseSign,
  ResponseVersion,
} from "./types";
import {
  HASH_MAX_LENGTH,
  CHUNK_SIZE,
  CLA,
  errorCodeToString,
  getVersion,
  INS,
  LedgerError,
  P1_VALUES,
  PAYLOAD_TYPE,
  processErrorResponse,
} from "./common";
import { numberLiteralTypeAnnotation } from "@babel/types";

export { LedgerError };
export * from "./types";

function processGetPubkeyResponse(response: Uint8Array) {
  let partialResponse = response;

  const errorCodeData = partialResponse.subarray(-2);
  const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

  //get public key len (64)
  const PKLEN = partialResponse[0];
  const publicKey = partialResponse.slice(1, 1 + PKLEN);

  //"advance" buffer
  partialResponse = partialResponse.subarray(1 + PKLEN);

  return {
    publicKey,
    returnCode,
    errorMessage: errorCodeToString(returnCode),
  };
}

/* see https://github.com/0xs34n/starknet.js/blob/develop/src/utils/ellipticCurve.ts#L29 */
function fixHash(hash: string) {
  let fixed_hash = hash.replace(/^0x0*/, "");
  if (fixed_hash.length > HASH_MAX_LENGTH) {
    throw "invalid hash length";
  }
  const s = "0".repeat(HASH_MAX_LENGTH - fixed_hash.length);
  fixed_hash = s.concat(fixed_hash);
  return fixed_hash + "0";
}

function hexToBytes(hex: string) {
  const bytes: number[] = [];
  for (let c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substring(c, c + 2), 16));
  return Uint8Array.from(bytes);
}

/**
 * Starknet API
 *
 * @example
 * import Stark from "@ledgerhq/hw-app-starknet";
 * const stark = new Stark(transport)
 */
export default class Stark {
  transport;

  constructor(transport: Transport) {
    this.transport = transport;
    if (!transport) {
      throw new Error("Transport has not been defined");
    }
  }

  static prepareChunks(message: Uint8Array, serializedPathBuffer?: Uint8Array) {
    const chunks: Uint8Array[] = [];

    // First chunk (only path)
    if (serializedPathBuffer !== undefined) {
      // First chunk (only path)
      chunks.push(serializedPathBuffer!);
    }

    const messageBuffer = Uint8Array.from(message);

    for (let i = 0; i < messageBuffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;
      if (i > messageBuffer.length) {
        end = messageBuffer.length;
      }
      chunks.push(messageBuffer.subarray(i, end));
    }

    return chunks;
  }

  async signGetChunks(path: string, message: Uint8Array) {
    return Stark.prepareChunks(message, serializePath(path));
  }

  /**
   * get version of Nano Starknet application
   * @return ResponseVersion an object with a major, minor, patch
   */
  async getAppVersion(): Promise<ResponseVersion> {
    return getVersion(this.transport).catch((err) => processErrorResponse(err));
  }

  /**
   * get information about Nano Starknet application
   * @return ResponseAppInfo an object with appName
   */
  async getAppInfo(): Promise<ResponseAppInfo> {
    return this.transport.send(CLA, INS.GET_APP_NAME, 0, 0).then((response) => {
      const errorCodeData = response.subarray(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      const result: { errorMessage?: string; returnCode?: LedgerError } = {};

      let appName = "undefined";

      const appNameLen = response[0];
      appName = response.subarray(1, 1 + appNameLen).toString("ascii");
      
      return {
        returnCode,
        errorMessage: errorCodeToString(returnCode),
        appName
      };
    }, processErrorResponse);
  }

  /**
   * get Starknet public key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return ResponsePublicKey an object with publicKey
   * @example
   * stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async getPubKey(path: string): Promise<ResponsePublicKey> {
    const serializedPath = Buffer.from(serializePath(path));
    return this.transport
      .send(CLA, INS.GET_PUB_KEY, P1_VALUES.ONLY_RETRIEVE, 0, serializedPath, [
        LedgerError.NoErrors,
      ])
      .then(processGetPubkeyResponse, processErrorResponse);
  }

  /**
   * get and show Starknet public key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return ResponsePublicKey an object with publicKey
   * @example
   * stark.showPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async showPubKey(path: string): Promise<ResponsePublicKey> {
    const serializedPath = Buffer.from(serializePath(path));
    return this.transport
      .send(
        CLA,
        INS.GET_PUB_KEY,
        P1_VALUES.SHOW_ADDRESS_IN_DEVICE,
        0,
        serializedPath,
        [LedgerError.NoErrors]
      )
      .then(processGetPubkeyResponse, processErrorResponse);
  }

  async signSendChunk(
    chunkIdx: number,
    chunkNum: number,
    chunk: Uint8Array,
    ins: number = INS.SIGN,
    p2 = 0
  ): Promise<ResponseSign> {
    let payloadType = PAYLOAD_TYPE.ADD;
    if (chunkIdx === 1) {
      payloadType = PAYLOAD_TYPE.INIT;
    }
    if (chunkIdx === chunkNum) {
      payloadType = PAYLOAD_TYPE.LAST;
    }

    return this.transport
      .send(CLA, ins, payloadType, p2, Buffer.from(chunk), [
        LedgerError.NoErrors,
        LedgerError.DataIsInvalid,
        LedgerError.BadKeyHandle,
        LedgerError.SignVerifyError,
      ])
      .then((response: Uint8Array) => {
        const errorCodeData = response.subarray(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
        let errorMessage = errorCodeToString(returnCode);

        if (
          returnCode === LedgerError.BadKeyHandle ||
          returnCode === LedgerError.DataIsInvalid ||
          returnCode === LedgerError.SignVerifyError
        ) {
          errorMessage = `${errorMessage} : ${response
            .subarray(0, response.length - 2)
            .toString()}`;
        }

        if (returnCode === LedgerError.NoErrors && response.length > 2) {
          return {
            r: response.subarray(1, 1 + 32),
            s: response.subarray(1 + 32, 1 + 32 + 32),
            v: response[65],
            returnCode: returnCode,
            errorMessage: errorMessage,
          };
        }

        return {
          returnCode: returnCode,
          errorMessage: errorMessage,
        };
      }, processErrorResponse);
  }

  /**
   * sign the given hash over the Starknet elliptic curve
   * @param path Derivation path in EIP-2645 format
   * @param hash Pedersen hash to be signed
   * @return ResponseSign an object with (r, s, v) signature
   */
  async sign(path: string, hash: string, show = true): Promise<ResponseSign> {
    
    const felt = hexToBytes(fixHash(hash));

    return this.signGetChunks(path, felt).then((chunks) => {
      return this.signSendChunk(
        1,
        chunks.length,
        chunks[0],
        INS.SIGN,
        show ? 1 : 0
      ).then(async (response) => {

        if (response.returnCode !== LedgerError.NoErrors) {
          return response;
        }

        let result: ResponseSign = {
          returnCode: LedgerError.ExecutionError,
          errorMessage: "Execution Error",
          r: new Uint8Array(0),
          s: new Uint8Array(0),
          v: 0
        };

        for (let i = 1; i < chunks.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          result = await this.signSendChunk(
            1 + i,
            chunks.length,
            chunks[i],
            INS.SIGN,
            show ? 1 : 0
          );

          if (result.returnCode !== LedgerError.NoErrors) {
            break;
          }
        }
        return result;
      }, processErrorResponse);
    }, processErrorResponse);
  }
}
