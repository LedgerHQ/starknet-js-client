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
import { serializePath, toBN } from "./helper";
import type {
  ResponsePublicKey,
  ResponseHashSign,
  ResponseTxSign,
  ResponseVersion,
  ResponseGeneric,
  TxFields,
  TxV1Fields,
  DeployAccountFields,
  DeployAccountV1Fields,
  ResponseStarkKey,
} from "./types";
import { HASH_MAX_LENGTH, CLA, errorCodeToString, INS, LedgerError } from "./common";

import { type Call, CallData, hash, shortString, TypedData, typedData } from "starknet";

import { EDataAvailabilityMode, type ResourceBounds } from "@starknet-io/types-js";

export { LedgerError };
export * from "./types";

function padHash(hash: string) {
  let p_hash = hash.replace(/^0x0*/, "");
  // check hash length is 63 (252 bits) max
  if (p_hash.length > HASH_MAX_LENGTH) {
    throw "invalid hash length";
  }
  // pad left with 0 to 64 hex digits (32 bytes)
  const s = "0".repeat(1 + HASH_MAX_LENGTH - p_hash.length);
  p_hash = s.concat(p_hash);
  return p_hash;
}

function hexToBytes(hex: string) {
  const bytes: number[] = [];
  for (let c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substring(c, c + 2), 16));
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
        LedgerError.UserRejected,
      ])
      .then((response: Buffer) => {
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
    const response = await this.sendApdu(INS.GET_VERSION);
    return {
      returnCode: response.returnCode,
      errorMessage: response.errorMessage,
      major: response.data[0],
      minor: response.data[1],
      patch: response.data[2],
    };
  }

  /**
   * get full starknet public key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return an object with publicKey
   * @example
   * stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async getPubKey(path: string, show: boolean = true): Promise<ResponsePublicKey> {
    const serializedPath = serializePath(path);

    try {
      const response = await this.sendApdu(INS.GET_PUB_KEY, show ? 0x01 : 0x00, 0, serializedPath);

      const publicKey = response.data.slice(1, 65);

      return {
        publicKey,
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
      };
    } catch (e) {
      console.warn("Caught error");
      return {
        publicKey: new Uint8Array(0),
        returnCode: LedgerError.ExecutionError,
        errorMessage: errorCodeToString(LedgerError.ExecutionError),
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
  async getStarkKey(path: string, show: boolean = true): Promise<ResponseStarkKey> {
    const { publicKey, errorMessage, returnCode } = await this.getPubKey(path, show);

    if (returnCode !== LedgerError.NoError) {
      return {
        starkKey: publicKey,
        returnCode,
        errorMessage,
      };
    }

    return {
      starkKey: publicKey.slice(0, 32),
      returnCode,
      errorMessage,
    };
  }

  /**
   * sign the given hash over the staRknet elliptic curve
   * @param path Derivation path in EIP-2645 format
   * @param hash Pedersen hash to be signed
   * @return an object with (r, s, v) signature
   */
  async signHash(path: string, hash: string): Promise<ResponseHashSign> {
    const serializedPath = serializePath(path);
    const padded_hash = hexToBytes(padHash(hash));

    try {
      let response = await this.sendApdu(INS.SIGN_HASH, 0, 0, serializedPath);

      response = await this.sendApdu(INS.SIGN_HASH, 1, 0, padded_hash);

      if (response.returnCode !== LedgerError.NoError) {
        return {
          returnCode: response.returnCode,
          errorMessage: errorCodeToString(response.returnCode),
          r: new Uint8Array(0),
          s: new Uint8Array(0),
          v: 0,
        };
      } else {
        return {
          returnCode: response.returnCode,
          errorMessage: response.errorMessage,
          r: response.data.subarray(1, 1 + 32),
          s: response.data.subarray(1 + 32, 1 + 32 + 32),
          v: response.data[65],
        };
      }
    } catch (e) {
      return {
        returnCode: LedgerError.ExecutionError,
        errorMessage: errorCodeToString(LedgerError.ExecutionError),
        r: new Uint8Array(0),
        s: new Uint8Array(0),
        v: 0,
      };
    }
  }

  /**
   * sign a Starknet Tx v3 Invoke transaction
   * @param path Derivation path in EIP-2645 format
   * @param calls List of calls [(to, selector, calldata), (), ...]
   * @param tx Tx fields (account address, tip, l1_gas_bounds, l2_gas_bounds, chainID, nonce, data_availability_mode)
   * @return an object with Tx hash + (r, s, v) signature
   */
  async signTx(path: string, calls: Call[], tx: TxFields): Promise<ResponseTxSign> {
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
    const accountAddress = toBN(tx.accountAddress);
    const tip = toBN(tx.tip);
    const chain_id = toBN(tx.chainId);
    const nonce = toBN(tx.nonce);
    const data_availability_mode = toBN(
      this.encodeDataAvailabilityMode(tx.nonceDataAvailabilityMode, tx.feeDataAvailabilityMode)
    );
    const { l1_gas, l2_gas } = this.encodeResourceBounds(tx.resourceBounds);

    let data = new Uint8Array([
      ...accountAddress.toArray("be", 32),
      ...tip.toArray("be", 32),
      ...l1_gas.toArray("be", 32),
      ...l2_gas.toArray("be", 32),
      ...chain_id.toArray("be", 32),
      ...nonce.toArray("be", 32),
      ...data_availability_mode.toArray("be", 32),
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
    let nb_calls = toBN(calls.length);
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
      v: 0,
    };
    for (const call of calls) {
      const compiledCalldata = CallData.toCalldata(call.calldata);
      let data = new Uint8Array((2 + compiledCalldata.length) * 32);

      const to = toBN(call.contractAddress);
      to.toArray("be", 32).forEach((byte, pos) => (data[pos] = byte));

      const selector = toBN(hash.getSelectorFromName(call.entrypoint));
      selector.toArray("be", 32).forEach((byte, pos) => (data[32 + pos] = byte));

      compiledCalldata.forEach((s, idx) => {
        let val = toBN(s);
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
    }

    if (response?.returnCode === LedgerError.NoError) {
      return {
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
        h: response.data.subarray(0, 32),
        r: response.data.subarray(1 + 32, 1 + 32 + 32),
        s: response.data.subarray(1 + 32 + 32, 1 + 32 + 32 + 32),
        v: response.data[97],
      };
    } else return error;
  }

  /**
   * sign a Starknet Tx v1 Invoke transaction
   * @param path Derivation path in EIP-2645 format
   * @param calls List of calls [(to, selector, calldata), (), ...]
   * @param tx Tx fields (account address, max_fee, chainID, nonce)
   * @return an object with Tx hash + (r, s, v) signature
   */
  async signTxV1(path: string, calls: Call[], tx: TxV1Fields): Promise<ResponseTxSign> {
    /* APDU 0 is derivation path */
    await this.sendApdu(INS.SIGN_TX_V1, 0, 0, serializePath(path));

    /* APDU 1 =
      accountAddress (32 bytes) +
      max_fee (32 bytes) +
      chain_id (32 bytes) +
      nonce (32 bytes) 
    */
    const accountAddress = toBN(tx.accountAddress);
    const max_fee = toBN(tx.max_fee);
    const chain_id = toBN(tx.chainId);
    const nonce = toBN(tx.nonce);

    let data = new Uint8Array([
      ...accountAddress.toArray("be", 32),
      ...max_fee.toArray("be", 32),
      ...chain_id.toArray("be", 32),
      ...nonce.toArray("be", 32),
    ]);
    await this.sendApdu(INS.SIGN_TX_V1, 1, 0, data);

    /* APDU 2 = Nb of calls */
    let nb_calls = toBN(calls.length);
    data = new Uint8Array([...nb_calls.toArray("be", 32)]);
    await this.sendApdu(INS.SIGN_TX_V1, 2, 0, data);

    /* APDU Calls */
    let response;
    let error: ResponseTxSign = {
      returnCode: LedgerError.ExecutionError,
      errorMessage: "Execution Error",
      h: new Uint8Array(0),
      r: new Uint8Array(0),
      s: new Uint8Array(0),
      v: 0,
    };

    for (const call of calls) {
      const compiledCalldata = CallData.toCalldata(call.calldata);

      let data = new Uint8Array((2 + compiledCalldata.length) * 32);

      const to = toBN(call.contractAddress);
      to.toArray("be", 32).forEach((byte, pos) => (data[pos] = byte));

      const selector = toBN(hash.getSelectorFromName(call.entrypoint));
      selector.toArray("be", 32).forEach((byte, pos) => (data[32 + pos] = byte));

      compiledCalldata.forEach((s, idx) => {
        let val = toBN(s);
        val.toArray("be", 32).forEach((byte, pos) => (data[64 + 32 * idx + pos] = byte));
      });

      /* slice data into chunks of 7 * 32 bytes */
      let calldatas = [];
      for (let i = 0; i < data.length; i += 7 * 32) {
        calldatas.push(data.slice(i, i + 7 * 32));
      }

      if (calldatas.length > 1) {
        response = await this.sendApdu(INS.SIGN_TX_V1, 3, 0, calldatas[0]);
        if (response.returnCode !== LedgerError.NoError) {
          return error;
        }
        for (const calldata of calldatas.slice(1)) {
          response = await this.sendApdu(INS.SIGN_TX_V1, 3, 1, calldata);
          if (response.returnCode !== LedgerError.NoError) {
            return error;
          }
        }
      } else {
        response = await this.sendApdu(INS.SIGN_TX_V1, 3, 0, calldatas[0]);
        if (response.returnCode !== LedgerError.NoError) {
          return error;
        }
      }

      response = await this.sendApdu(INS.SIGN_TX_V1, 3, 2, new Uint8Array(0));
      if (response.returnCode !== LedgerError.NoError) {
        return error;
      }
    }

    if (response?.returnCode === LedgerError.NoError) {
      return {
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
        h: response.data.subarray(0, 32),
        r: response.data.subarray(1 + 32, 1 + 32 + 32),
        s: response.data.subarray(1 + 32 + 32, 1 + 32 + 32 + 32),
        v: response.data[97],
      };
    } else return error;
  }

  /**
   * sign a Starknet Tx v3 DeployAccount transaction
   * @param path Derivation path in EIP-2645 format
   * @param tx Tx fields (contract_address, tip, resourceBounds, paymaster_data, chain_id, nonce, nonceDataAvailabilityMode, feeDataAvailabilityMode, constructor_calldata, class_hash, contract_address_salt)
   * @return an object with Tx hash + (r, s, v) signature
   */
  async signDeployAccount(path: string, tx: DeployAccountFields): Promise<ResponseTxSign> {
    /* APDU 0 is derivation path */
    await this.sendApdu(INS.DEPLOY_ACCOUNT, 0, 0, serializePath(path));

    /* APDU 1 =
      contract_address (32 bytes) +
      chain_id (32 bytes) +
      nonce (32 bytes) +
      data_availability_mode (32 bytes) +
      class_hash (32 bytes) +
      contract_address_salt (32 bytes)
    */
    const contractAddress = toBN(tx.contractAddress);
    const chain_id = toBN(tx.chainId);
    const nonce = toBN(tx.nonce);
    const data_availability_mode = toBN(
      this.encodeDataAvailabilityMode(tx.nonceDataAvailabilityMode, tx.feeDataAvailabilityMode)
    );
    const class_hash = toBN(tx.class_hash);
    const contract_address_salt = toBN(tx.contract_address_salt);

    let data = new Uint8Array([
      ...contractAddress.toArray("be", 32),
      ...chain_id.toArray("be", 32),
      ...nonce.toArray("be", 32),
      ...data_availability_mode.toArray("be", 32),
      ...class_hash.toArray("be", 32),
      ...contract_address_salt.toArray("be", 32),
    ]);
    await this.sendApdu(INS.DEPLOY_ACCOUNT, 1, 0, data);

    /* APDU 2 = fees */
    const tip = toBN(tx.tip);
    const { l1_gas, l2_gas } = this.encodeResourceBounds(tx.resourceBounds);

    data = new Uint8Array([
      ...tip.toArray("be", 32),
      ...l1_gas.toArray("be", 32),
      ...l2_gas.toArray("be", 32),
    ]);
    await this.sendApdu(INS.DEPLOY_ACCOUNT, 2, 0, data);

    /* APDU 3 = paymaster data (*/

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
    await this.sendApdu(INS.DEPLOY_ACCOUNT, 3, 0, new Uint8Array(0));

    /* APDU 4 = constructor_calldata length */
    let nb_calls = toBN(tx.constructor_calldata.length);
    data = new Uint8Array([...nb_calls.toArray("be", 32)]);
    await this.sendApdu(INS.DEPLOY_ACCOUNT, 4, 0, data);

    /* APDUs constructor_calldata */
    let response;
    let error: ResponseTxSign = {
      returnCode: LedgerError.ExecutionError,
      errorMessage: "Execution Error",
      h: new Uint8Array(0),
      r: new Uint8Array(0),
      s: new Uint8Array(0),
      v: 0,
    };

    let calldata = new Uint8Array(tx.constructor_calldata.length * 32);
    tx.constructor_calldata.forEach((d, idx) => {
      let val = toBN(d);
      val.toArray("be", 32).forEach((byte, pos) => (calldata[32 * idx + pos] = byte));
    });

     /* slice data into chunks of 7 * 32 bytes */
    let calldatas = [];
    for (let i = 0; i < calldata.length; i += 7 * 32) {
      calldatas.push(calldata.slice(i, i + 7 * 32));
    }

    for (const data of calldatas) {
      response = await this.sendApdu(INS.DEPLOY_ACCOUNT, 5, 0, data);
      if (response.returnCode !== LedgerError.NoError) {
        return error;
      }
    }

    if (response?.returnCode === LedgerError.NoError) {
      return {
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
        h: response.data.subarray(0, 32),
        r: response.data.subarray(1 + 32, 1 + 32 + 32),
        s: response.data.subarray(1 + 32 + 32, 1 + 32 + 32 + 32),
        v: response.data[97],
      };
    } else return error;
  }

  /**
   * sign a Starknet Tx v1 DeployAccount transaction
   * @param path Derivation path in EIP-2645 format
   * @param tx Tx fields (contract_address, class_hash, contract_address_salt, constructor_calldata, max_fee, chainID, nonce)
   * @return an object with Tx hash + (r, s, v) signature
   */
  async signDeployAccountV1(path: string, tx: DeployAccountV1Fields): Promise<ResponseTxSign> {
    /* APDU 0 is derivation path */
    await this.sendApdu(INS.DEPLOY_ACCOUNT_V1, 0, 0, serializePath(path));

    /* APDU 1 =
      contract_address (32 bytes) +
      class_hash (32 bytes) +
      contract_address_salt (32 bytes) +
      chain_id (32 bytes) +
      nonce (32 bytes) +
    */
    const contractAddress = toBN(tx.contractAddress);
    const class_hash = toBN(tx.class_hash);
    const contract_address_salt = toBN(tx.contract_address_salt);
    const chain_id = toBN(tx.chainId);
    const nonce = toBN(tx.nonce);

    let data = new Uint8Array([
      ...contractAddress.toArray("be", 32),
      ...class_hash.toArray("be", 32),
      ...contract_address_salt.toArray("be", 32),
      ...chain_id.toArray("be", 32),
      ...nonce.toArray("be", 32),
    ]);
    await this.sendApdu(INS.DEPLOY_ACCOUNT_V1, 1, 0, data);

    /* APDU 2 = fees */
    const max_fee = toBN(tx.max_fee);
    data = new Uint8Array([
      ...max_fee.toArray("be", 32),
    ]);
    await this.sendApdu(INS.DEPLOY_ACCOUNT_V1, 2, 0, data);

    /* APDU 3 = constructor_calldata length */
    let nb_calls = toBN(tx.constructor_calldata.length);
    data = new Uint8Array([...nb_calls.toArray("be", 32)]);
    await this.sendApdu(INS.DEPLOY_ACCOUNT_V1, 3, 0, data);

    /* APDUs constructor_calldata */
    let response;
    let error: ResponseTxSign = {
      returnCode: LedgerError.ExecutionError,
      errorMessage: "Execution Error",
      h: new Uint8Array(0),
      r: new Uint8Array(0),
      s: new Uint8Array(0),
      v: 0,
    };

    let calldata = new Uint8Array(tx.constructor_calldata.length * 32);
    tx.constructor_calldata.forEach((d, idx) => {
      let val = toBN(d);
      val.toArray("be", 32).forEach((byte, pos) => (calldata[32 * idx + pos] = byte));
    });

     /* slice data into chunks of 7 * 32 bytes */
    let calldatas = [];
    for (let i = 0; i < calldata.length; i += 7 * 32) {
      calldatas.push(calldata.slice(i, i + 7 * 32));
    }

    for (const data of calldatas) {
      response = await this.sendApdu(INS.DEPLOY_ACCOUNT_V1, 4, 0, data);
      if (response.returnCode !== LedgerError.NoError) {
        return error;
      }
    }

    if (response?.returnCode === LedgerError.NoError) {
      return {
        returnCode: response.returnCode,
        errorMessage: response.errorMessage,
        h: response.data.subarray(0, 32),
        r: response.data.subarray(1 + 32, 1 + 32 + 32),
        s: response.data.subarray(1 + 32 + 32, 1 + 32 + 32 + 32),
        v: response.data[97],
      };
    } else return error;
  }

  /**
   * sign a SNIP-12 encoded message
   * @param path Derivation path in EIP-2645 format
   * @param message message to be signed
   * @param account accound address to sign the message
   * @return an object with (r, s, v) signature
   */
  async signMessage(path: string, message: TypedData, account: string): Promise<ResponseHashSign> {
    const hashed_data = typedData.getMessageHash(message, account);

    return this.signHash(path, hashed_data);
  }

  private encodeResourceBounds(bounds: ResourceBounds) {
    const MAX_AMOUNT_BITS = BigInt(64);
    const MAX_PRICE_PER_UNIT_BITS = BigInt(128);
    const RESOURCE_VALUE_OFFSET = MAX_AMOUNT_BITS + MAX_PRICE_PER_UNIT_BITS;
    const L1_GAS_NAME = BigInt(shortString.encodeShortString("L1_GAS"));
    const L2_GAS_NAME = BigInt(shortString.encodeShortString("L2_GAS"));

    const L1Bound =
      (L1_GAS_NAME << RESOURCE_VALUE_OFFSET) +
      (BigInt(bounds.l1_gas.max_amount) << MAX_PRICE_PER_UNIT_BITS) +
      BigInt(bounds.l1_gas.max_price_per_unit);

    const L2Bound =
      (L2_GAS_NAME << RESOURCE_VALUE_OFFSET) +
      (BigInt(bounds.l2_gas.max_amount) << MAX_PRICE_PER_UNIT_BITS) +
      BigInt(bounds.l2_gas.max_price_per_unit);

    return {
      l1_gas: toBN(L1Bound),
      l2_gas: toBN(L2Bound),
    };
  }

  private encodeDataAvailabilityMode(
    nonceDAM: EDataAvailabilityMode,
    feeDAM: EDataAvailabilityMode
  ) {
    const DATA_AVAILABILITY_MODE_BITS = BigInt(32);
    const nonceIntDAM = nonceDAM === EDataAvailabilityMode.L1 ? 0 : 1;
    const feeIntDAM = feeDAM === EDataAvailabilityMode.L1 ? 0 : 1;

    return (BigInt(nonceIntDAM) << DATA_AVAILABILITY_MODE_BITS) + BigInt(feeIntDAM);
  }
}
