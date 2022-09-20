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
import { isHex, serializePath } from "./helper";
import {
  ResponsePublicKey,
  ResponseAppInfo,
  ResponseSign,
  ResponseVersion,
  Call,
  CallDetails
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

import BN from "bn.js";

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
   * @return an object with a major, minor, patch
   */
  async getAppVersion(): Promise<ResponseVersion> {
    return getVersion(this.transport).catch((err) => processErrorResponse(err));
  }

  /**
   * get information about Nano Starknet application
   * @return an object with appName
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
   * @return an object with publicKey
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
   * @return an object with publicKey
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
   * @return an object with (r, s, v) signature
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

  async signTx(path: string, tx: Call, txDetails: CallDetails) {

    const chunks: Uint8Array[] = [];

    /* chunk 0 is derivation path */
    const chunk0 = serializePath(path);
    chunks.push(chunk0);

    /* chunk 1 = accountAddress (32 bytes) + maxFee (32 bytes) + nonce (32 bytes) + version (32 bytes) = 128 bytes*/
    const accountAddress = new BN(txDetails.accountAddress.replace(/^0x*/,''), 16);
    const maxFee = new BN(txDetails.maxFee as string, 10);
    const nonce = new BN(txDetails.nonce as string, 10);
    const version = new BN(txDetails.version as string, 10);

    const chunk1 = new Uint8Array([
      ...accountAddress.toArray('be', 32),
      ...maxFee.toArray('be', 32),
      ...nonce.toArray('be', 32),
      ...version.toArray('be', 32)
    ]);
    
    chunks.push(chunk1);

    /* chunk 2 = to (32 bytes) + selector length (1 byte) + selector (selector length bytes) + call_data length (1 byte) */
    const to = new BN(tx.contractAddress.replace(/^0x*/,''), 16);
    const selectorLength = tx.entryPoint.length;
    const selector = Uint8Array.from(tx.entryPoint, c=>c.charCodeAt(0));
    const calldata_len = tx.calldata ? tx.calldata.length : 0;

    const chunk2 = new Uint8Array([
      ...to.toArray('be', 32),
      selectorLength,
      ...selector,
      calldata_len
    ]);

    chunks.push(chunk2);
    
    /* calldata chunks */
    
    if ((calldata_len !== 0) && (tx.calldata)) {
      for (let i = 0; i < calldata_len; i++) {
        let callData: BN;
        if (isHex(tx.calldata[i])) {
          callData = new BN(tx.calldata[i].replace(/^0x*/,''), 16);  
        }
        else {
          callData = new BN(tx.calldata[i], 10);
        }
        let chunk = new Uint8Array([...callData.toArray('be', 32)]);
        chunks.push(chunk);
      }
    }

    for (let c = 0; c < chunks.length; c++){
      console.log("chunk " + c);
      console.log(chunks[c]);
    }

    /*await this.transport
      .send(CLA, INS.SIGN_TX, PAYLOAD_TYPE.INIT, 0x80, Buffer.from(chunks[0]), [LedgerError.NoErrors]);*/
    
  }
}


