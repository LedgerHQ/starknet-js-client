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
  ResponseHashSign,
  ResponseTxSign,
  ResponseVersion,
  ResponseGeneric,
  Call,
  TxFields,
  Abi,
  ResponseStarkKey
} from "./types";
import {
  HASH_MAX_LENGTH,
  CLA,
  errorCodeToString,
  INS,
  LedgerError,
  PAYLOAD_TYPE
} from "./common";

import BN from "bn.js";

export { LedgerError };
export * from "./types";

function fixHash(hash: string) {
  let fixed_hash = hash.replace(/^0x0*/, "");
  if (fixed_hash.length > HASH_MAX_LENGTH) {
    throw "invalid hash length";
  }
  const s = "0".repeat(HASH_MAX_LENGTH - fixed_hash.length);
  fixed_hash = s.concat(fixed_hash);
  return "0" + fixed_hash;
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
    ins: number = INS.GET_VERSION,
    p1: number = 0x00,
    p2: number = 0x00,
    data: Uint8Array = new Uint8Array(0)
  ): Promise<ResponseGeneric> {
    return this.transport
      .send(CLA, ins, p1, p2, Buffer.from(data), [
        LedgerError.NoError,
        LedgerError.BadCla,
        LedgerError.BadIns,
        LedgerError.InvalidP1P2,
        LedgerError.UserRejected
      ])
      .then((response: Buffer) => {
        const errorCodeData = response.subarray(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
        let errorMessage = errorCodeToString(returnCode);
        return {
          data: response.subarray(0, -2),
          returnCode: returnCode,
          errorMessage: errorMessage
        };
      });
  }

  /**
   * get version of Nano Starknet application
   * @return an object with a major, minor, patch
   */
  async getAppVersion(): Promise<ResponseVersion> {
    const response = await this.sendApdu(INS.GET_VERSION);
    return {
      returnCode: response.returnCode,
      errorMessage: response.errorMessage,
      major: response.data[0],
      minor: response.data[1],
      patch: response.data[2]
    };
  }

  /*async getAppInfo(): Promise<ResponseAppInfo> {

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
   * get full starknet public key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return an object with publicKey
   * @example
   * stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async getPubKey(
    path: string,
    show: boolean = true
  ): Promise<ResponsePublicKey> {
    const serializedPath = serializePath(path);

    try {
      const response = await this.sendApdu(
        INS.GET_PUB_KEY,
        show ? 0x01 : 0x00,
        0,
        serializedPath
      );

      const publicKey = response.data.slice(1, 65);

      return {
        publicKey,
        returnCode: response.returnCode,
        errorMessage: response.errorMessage
      };
    } catch (e) {
      console.warn("Caught error");
      return {
        publicKey: new Uint8Array(0),
        returnCode: LedgerError.ExecutionError,
        errorMessage: errorCodeToString(LedgerError.ExecutionError)
      };
    }
  }

  /**
   * get stark key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return an object with publicKey
   * @example
   * stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async getStarkKey(
    path: string,
    show: boolean = true
  ): Promise<ResponseStarkKey> {
    const { publicKey, errorMessage, returnCode } = await this.getPubKey(
      path,
      show
    );

    if (returnCode !== LedgerError.NoError) {
      return {
        starkKey: publicKey,
        returnCode,
        errorMessage
      };
    }

    return {
      starkKey: publicKey.slice(0, 32),
      returnCode,
      errorMessage
    };
  }

  /**
   * sign the given hash over the staRknet elliptic curve
   * @param path Derivation path in EIP-2645 format
   * @param hash Pedersen hash to be signed
   * @param show Show hash on device before signing (default = true)
   * @return an object with (r, s, v) signature
   */
  async signHash(
    path: string,
    hash: string,
    show = true
  ): Promise<ResponseHashSign> {
    const serializedPath = serializePath(path);
    const fixed_hash = hexToBytes(fixHash(hash));

    try {
      let response = await this.sendApdu(
        INS.SIGN_HASH,
        PAYLOAD_TYPE.INIT,
        show ? 1 : 0,
        serializedPath
      );

      response = await this.sendApdu(
        INS.SIGN_HASH,
        PAYLOAD_TYPE.LAST,
        show ? 1 : 0,
        fixed_hash
      );

      if (response.returnCode !== LedgerError.NoError) {
        return {
          returnCode: response.returnCode,
          errorMessage: errorCodeToString(response.returnCode),
          r: new Uint8Array(0),
          s: new Uint8Array(0),
          v: 0
        };
      } else {
        return {
          returnCode: response.returnCode,
          errorMessage: response.errorMessage,
          r: response.data.subarray(1, 1 + 32),
          s: response.data.subarray(1 + 32, 1 + 32 + 32),
          v: response.data[65]
        };
      }
    } catch (e) {
      return {
        returnCode: LedgerError.ExecutionError,
        errorMessage: errorCodeToString(LedgerError.ExecutionError),
        r: new Uint8Array(0),
        s: new Uint8Array(0),
        v: 0
      };
    }
  }

  /**
   * sign a Starknet Invoke transaction (display some relevant Tx fields before signing)
   * @param path Derivation path in EIP-2645 format
   * @param calls List of calls [(to, entry_point, calldata), (), ...]
   * @param tx Tx fields (account address, tip, l1_gas_bounds, l2_gas_bounds, chainID, nonce, data_availability_mode)
   * @return an object with Tx hash + (r, s, v) signature
   */
  async signTx(
    path: string,
    calls: Call[],
    tx: TxFields
  ): Promise<ResponseTxSign> {

    /* APDU 0 is derivation path */
    await this.sendApdu(INS.SIGN_TX, 0, 0, serializePath(path));

    /* APDU 1 =
      accountAddress (32 bytes) +
      tip (32 bytes) +
      l1_gas_bounds (32 bytes) +
      l2_gas_bounds (32 bytes) +
      chain_id (32 bytes) +
      nonce (32 bytes) +
      data_availability_mode (32 bytes)
    */
    const accountAddress = new BN(tx.accountAddress.replace(/^0x*/, ""), 16);
    const tip = new BN(tx.tip as string, 10);
    const l1_gas_bounds = new BN(tx.l1_gas_bounds.replace(/^0x*/, ""), 16);
    const l2_gas_bounds = new BN(tx.l2_gas_bounds.replace(/^0x*/, ""), 16);
    const chain_id = new BN(tx.chainId.replace(/^0x*/, ""), 16);
    const nonce = new BN(tx.nonce as string, 10);
    const data_availability_mode = new BN(tx.data_availability_mode as string, 10);

    let data = new Uint8Array([
      ...accountAddress.toArray("be", 32),
      ...tip.toArray("be", 32),
      ...l1_gas_bounds.toArray("be", 32),
      ...l2_gas_bounds.toArray("be", 32),
      ...chain_id.toArray("be", 32),
      ...nonce.toArray("be", 32),
      ...data_availability_mode.toArray("be", 32)
    ]);
    await this.sendApdu(INS.SIGN_TX, 1, 0, data);

    /* APDU 2 = paymaster data (*/
    
    /* slice data into chunks of 7 BigNumberish */
    /*let datas = [];
     for (let i = 0; i < tx.paymaster_data.length; i += 7) {
      datas.push(tx.paymaster_data.slice(i, i + 7));
    }
    for (const data of datas) {
      let paymaster_data = new Uint8Array(7 * 32);
      data.forEach((d, idx) => {
        let val = new BN(d as string, 10);
        val.toArray("be", 32).forEach((byte, pos) => (paymaster_data[32 * idx + pos] = byte));
      });
      await this.sendApdu(INS.SIGN_TX, 2, 0, paymaster_data);
    }*/

    await this.sendApdu(INS.SIGN_TX, 2, 0, new Uint8Array(0));

    /* APDU 3 = account deployment data */
    /*let datas = [];
     for (let i = 0; i < tx.account_deployment_data.length; i += 7) {
      datas.push(tx.account_deployment_data.slice(i, i + 7));
    }
    for (const data of datas) {
      let account_deployment_data = new Uint8Array(7 * 32);
      data.forEach((d, idx) => {
        let val = new BN(d as string, 10);
        val.toArray("be", 32).forEach((byte, pos) => (account_deployment_data[32 * idx + pos] = byte));
      });
      await this.sendApdu(INS.SIGN_TX, 3, 0, account_deployment_data);
    }*/

    await this.sendApdu(INS.SIGN_TX, 3, 0, new Uint8Array(0));

    /* APDU 4 = Nb of calls */
    let nb_calls = new BN(calls.length, 10);
    data = new Uint8Array([...nb_calls.toArray("be", 32)]);
    await this.sendApdu(INS.SIGN_TX, 4, 0, data);

    /* APDU Calls */
    let response;
    let error: ResponseTxSign = {
      returnCode: LedgerError.ExecutionError,
      errorMessage: "Execution Error",
      h: new Uint8Array(0),
      r: new Uint8Array(0),
      s: new Uint8Array(0),
      v: 0
    }
    for (const call of calls) {

      let data = new Uint8Array((2 + call.calldata.length) * 32);
      
      const to = new BN(call.to.replace(/^0x*/, ""), 16);
      to.toArray("be", 32).forEach((byte, pos) => (data[pos] = byte));

      const selector = new BN(call.selector.replace(/^0x*/, ""), 16);
      selector.toArray("be", 32).forEach((byte, pos) => (data[32 + pos] = byte));
      
      call.calldata.forEach((s, idx) => {
        let val = new BN(s.replace(/^0x*/, ""), 16);
        val.toArray("be", 32).forEach((byte, pos) => (data[64 + 32 * idx + pos] = byte));
      });

      /* slice data into chunks of 7 * 32 bytes */
      let calldatas = [];
      for (let i = 0; i < data.length; i += 7 * 32) {
        calldatas.push(data.slice(i, i + 7 * 32));
      }

      if (calldatas.length > 1) {
        response = await this.sendApdu(INS.SIGN_TX, 5, 0, calldatas[0]);
        if (response.returnCode !== LedgerError.NoError) {
          return error;
        }
        for (const calldata of calldatas.slice(1)) {
          response = await this.sendApdu(INS.SIGN_TX, 5, 1, calldata);
          if (response.returnCode !== LedgerError.NoError) {
            return error;
          }
        }
      } else {
        response = await this.sendApdu(INS.SIGN_TX, 5, 0, calldatas[0]);
        if (response.returnCode !== LedgerError.NoError) {
          return error;
        }
      }
      
      response = await this.sendApdu(INS.SIGN_TX, 5, 2, new Uint8Array(0));
      if (response.returnCode !== LedgerError.NoError) {
        return error;
      }
    };

    if (response?.returnCode === LedgerError.NoError) {
      return {
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
        h: response.data.subarray(0, 32),
        r: response.data.subarray(1 + 32, 1 + 32 + 32),
        s: response.data.subarray(1 + 32 + 32, 1 + 32 + 32 + 32),
        v: response.data[97]
      };
    } else
      return error;
  }
}