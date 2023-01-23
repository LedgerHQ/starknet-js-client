/********************************************************************************
 *  (c) 2022-2023 Ledger
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
  ResponseGeneric,
  Calldata,
  TxDetails,
  Abi,
  CalldataMetadata
} from "./types";
import {
  HASH_MAX_LENGTH,
  CHUNK_SIZE,
  CLA,
  errorCodeToString,
  INS,
  LedgerError,
  PAYLOAD_TYPE,
  processErrorResponse,
} from "./common";

import BN from "bn.js";

export { LedgerError };
export * from "./types";

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
 * const stark = new StarknetClient(transport)
 */
export class StarknetClient {
  
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    if (!transport) {
      throw new Error("Transport has not been defined");
    }
  }

  async sendApdu(
    ins: number = INS.GET_APP_NAME,
    p1: number = 0x00,
    p2: number = 0x00,
    data: Uint8Array = new Uint8Array(0)
  ): Promise<ResponseGeneric> {
    return this.transport
      .send(CLA, ins, p1, p2, Buffer.from(data), [
        LedgerError.NoErrors,
        LedgerError.DataIsInvalid,
        LedgerError.BadKeyHandle,
        LedgerError.SignVerifyError,
      ])
      .then((response: Uint8Array) => {
        const errorCodeData = response.subarray(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
        let errorMessage = errorCodeToString(returnCode);
        return {
          data: response.subarray(0, -2),
          returnCode: returnCode,
          errorMessage: errorMessage,
        };
      });
  }

  /**
   * get version of Nano Starknet application
   * @return an object with a major, minor, patch
   */
  async getAppVersion(): Promise<ResponseVersion> {

    const p = this.sendApdu(INS.GET_VERSION);
    return p.then((response) => {
      return {
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
        major: response.data[0],
        minor: response.data[1],
        patch: response.data[2]
      };
    }, processErrorResponse);
  }

  /**
   * get information about Nano Starknet application
   * @return an object with appName="staRknet"
   */
  async getAppInfo(): Promise<ResponseAppInfo> {

    return this.sendApdu(INS.GET_APP_NAME).then((response) => {

      let appName = "undefined";

      appName = Buffer.from(response.data.subarray(0, 8)).toString("ascii");
      
      return {
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
        appName
      };
    }, processErrorResponse);
  }

  /**
   * get staRknet public key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return an object with publicKey
   * @example
   * stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async getPubKey(path: string, show: boolean = true): Promise<ResponsePublicKey> {
    const serializedPath = Buffer.from(serializePath(path));
    return this.sendApdu( 
        INS.GET_PUB_KEY, 
        show ? 1 : 0,
        0,
        serializedPath)
      .then(response => {
        //get public key len (64)
        const PKLEN = response.data[0];
        const publicKey = response.data.slice(1, 1 + PKLEN);
        return {
          publicKey,
          returnCode: response.returnCode,
          errorMessage: response.errorMessage,
        };
      }, processErrorResponse);
  }

  /**
   * sign the given hash over the staRknet elliptic curve
   * @param path Derivation path in EIP-2645 format
   * @param hash Pedersen hash to be signed
   * @param show Show hash on device before signing (default = true)
   * @return an object with (r, s, v) signature
   */
  async signHash(path: string, hash: string, show = true): Promise<ResponseSign> {
    
    const serializedPath = serializePath(path);
    const fixed_hash = hexToBytes(fixHash(hash));

    return this.sendApdu(
      INS.SIGN,
      PAYLOAD_TYPE.INIT,
      show ? 1 : 0,
      serializedPath)
    .then(response => {
      if (response.returnCode !== LedgerError.NoErrors) {
        return {
          returnCode: response.returnCode,
          errorMessage: response.errorMessage,
          r: new Uint8Array(0),
          s: new Uint8Array(0),
          v: 0  
        }
      }
      return this.sendApdu(
        INS.SIGN,
        PAYLOAD_TYPE.LAST,
        show ? 1 : 0,
        fixed_hash)
      .then(response => {
        return {
          returnCode: response.returnCode,
          errorMessage: response.errorMessage,
          r: response.data.subarray(1, 1 + 32),
          s: response.data.subarray(1 + 32, 1 + 32 + 32),
          v: response.data[65]
        }
      }, processErrorResponse)
    }, processErrorResponse);
  }

  /**
   * sign the transaction (display Tx fields before signing)
   * @param path Derivation path in EIP-2645 format
   * @param tx tx targeted contract
   * @param txDetails account abstraction parameters
   * @param abi target contract's abi
   * @return an object with (r, s, v) signature
   */
  async signTx(path: string, tx: Calldata, txDetails: TxDetails, abi?: Abi): Promise<ResponseSign> {

    const chunks: Uint8Array[] = [];

    /* chunk 0 is derivation path */
    const chunk0 = serializePath(path);
    chunks.push(chunk0);

    /* chunk 1 = accountAddress (32 bytes) + maxFee (32 bytes) + nonce (32 bytes) + version (32 bytes) + chain_id (32 bytes)= 160 bytes*/
    const accountAddress = new BN(txDetails.accountAddress.replace(/^0x*/,''), 16);
    const maxFee = new BN(txDetails.maxFee as string, 10);
    const nonce = new BN(txDetails.nonce as string, 10);
    const version = new BN(txDetails.version as string, 10);
    const chain_id = new BN(txDetails.chainId.replace(/^0x*/,''), 16);

    const chunk1 = new Uint8Array([
      ...accountAddress.toArray('be', 32),
      ...maxFee.toArray('be', 32),
      ...nonce.toArray('be', 32),
      ...version.toArray('be', 32),
      ...chain_id.toArray('be', 32)
    ]);
    
    chunks.push(chunk1);

    /* chunk 2 = to (32 bytes) + selector length (1 byte) + selector (selector length bytes) + call_data length (1 byte) */
    const to = new BN(tx.contractAddress.replace(/^0x*/,''), 16);
    const selectorLength = tx.entrypoint.length;
    const selector = Uint8Array.from(tx.entrypoint, c=>c.charCodeAt(0));
    const calldata_len = tx.calldata ? tx.calldata.length : 0;

    const chunk2 = new Uint8Array([
      ...to.toArray('be', 32),
      selectorLength,
      ...selector,
      calldata_len
    ]);

    chunks.push(chunk2);
    
    /* calldata chunks */
    const encoder = new TextEncoder();

    let calldata_metadata: CalldataMetadata[] = [];
    if (abi) {
      /* parse abi to display relevant info when signing tx on Nano */
      console.warn("ABI parsing not yet implemented");
    }
    
    tx.calldata?.forEach((s, i) => {
      let meta: CalldataMetadata = {
        name: "Calldata #"+i+":",
        encoded: encoder.encode("Calldata #"+i+":")
      };
      calldata_metadata.push(meta)
    });
    
    if ((calldata_len !== 0) && (tx.calldata)) {
      tx.calldata.forEach((s, i) => {
        let callData: BN;
        if (isHex(s)) {
          callData = new BN(s.replace(/^0x*/,''), 16);  
        }
        else {
          callData = new BN(s, 10);
        }
        let chunk = new Uint8Array([
          calldata_metadata[i].encoded.length,
          ...calldata_metadata[i].encoded,
          ...callData.toArray('be', 32)
        ]);
        chunks.push(chunk);
      });
    }

    return {
      returnCode: LedgerError.ExecutionError,
      errorMessage: "Execution Error",
      r: new Uint8Array(0),
      s: new Uint8Array(0),
      v: 0
    };

    /*return this.sendApdu(
      chunks[0],
      INS.SIGN_TX,
      PAYLOAD_TYPE.INIT,
      0x80, 
    ).then(async (response) => {

      if (response.returnCode !== LedgerError.NoErrors) {
        return response;
      }

      let response: ResponseSign = {
        returnCode: LedgerError.ExecutionError,
        errorMessage: "Execution Error",
        r: new Uint8Array(0),
        s: new Uint8Array(0),
        v: 0
      };

      for (let i = 1; i < chunks.length; i += 1) {
        let result = await this.sendApdu(
          chunks[i],
          INS.SIGN_TX,
          i < (chunks.length - 1) ? PAYLOAD_TYPE.ADD:PAYLOAD_TYPE.LAST, 
          i < (chunks.length - 1) ? 0x80:0x00
        );

        if (result.returnCode !== LedgerError.NoErrors) {
          break;
        }
      }
      return result;
    }, processErrorResponse);*/
  }
}