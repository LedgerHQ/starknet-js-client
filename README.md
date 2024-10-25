# STARKNET JS CLIENT

Typescript host client used to interact with [Starknet Nano application](https://github.com/LedgerHQ/nano-rapp-starknet)

## Usage

    const starknetClient = require('@ledgerhq/hw-app-starknet');

    // TODO: DEMONSTRATE API

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

*   [StarknetClient](#starknetclient)
    *   [Parameters](#parameters)
    *   [Examples](#examples)
    *   [getAppVersion](#getappversion)
    *   [getPubKey](#getpubkey)
        *   [Parameters](#parameters-1)
        *   [Examples](#examples-1)
    *   [getStarkKey](#getstarkkey)
        *   [Parameters](#parameters-2)
        *   [Examples](#examples-2)
    *   [signHash](#signhash)
        *   [Parameters](#parameters-3)
    *   [signTx](#signtx)
        *   [Parameters](#parameters-4)
    *   [signTxV1](#signtxv1)
        *   [Parameters](#parameters-5)
    *   [signDeployAccount](#signdeployaccount)
        *   [Parameters](#parameters-6)
    *   [signDeployAccountV1](#signdeployaccountv1)
        *   [Parameters](#parameters-7)
    *   [signMessage](#signmessage)
        *   [Parameters](#parameters-8)

### StarknetClient

Starknet API

#### Parameters

*   `transport` **Transport** 

#### Examples

```javascript
import Stark from "@ledgerhq/hw-app-starknet";
const stark = new StarknetClient(transport)
```

#### getAppVersion

get version of Nano Starknet application

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseVersion>** an object with a major, minor, patch

#### getPubKey

get full starknet public key derived from provided derivation path

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path in EIP-2645 format (<https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md>)
*   `show` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**  (optional, default `true`)

##### Examples

```javascript
stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponsePublicKey>** an object with publicKey

#### getStarkKey

get stark key derived from provided derivation path

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path in EIP-2645 format (<https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md>)
*   `show` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**  (optional, default `true`)

##### Examples

```javascript
stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseStarkKey>** an object with publicKey

#### signHash

sign the given hash over the staRknet elliptic curve

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Derivation path in EIP-2645 format
*   `hash` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Pedersen hash to be signed

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseHashSign>** an object with (r, s, v) signature

#### signTx

sign a Starknet Tx v3 Invoke transaction

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Derivation path in EIP-2645 format
*   `calls` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<Call>** List of calls \[(to, selector, calldata), (), ...]
*   `tx` **TxFields** Tx fields (account address, tip, l1\_gas_bounds, l2\_gas_bounds, chainID, nonce, data_availability_mode)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseTxSign>** an object with Tx hash + (r, s, v) signature

#### signTxV1

sign a Starknet Tx v1 Invoke transaction

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Derivation path in EIP-2645 format
*   `calls` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<Call>** List of calls \[(to, selector, calldata), (), ...]
*   `tx` **TxV1Fields** Tx fields (account address, max_fee, chainID, nonce)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseTxSign>** an object with Tx hash + (r, s, v) signature

#### signDeployAccount

sign a Starknet Tx v3 DeployAccount transaction

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Derivation path in EIP-2645 format
*   `tx` **DeployAccountFields** Tx fields (contract_address, tip, resourceBounds, paymaster_data, chain_id, nonce, nonceDataAvailabilityMode, feeDataAvailabilityMode, constructor_calldata, class_hash, contract_address_salt)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseTxSign>** an object with Tx hash + (r, s, v) signature

#### signDeployAccountV1

sign a Starknet Tx v1 DeployAccount transaction

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Derivation path in EIP-2645 format
*   `tx` **DeployAccountV1Fields** Tx fields (contract_address, class_hash, contract_address_salt, constructor_calldata, max_fee, chainID, nonce)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseTxSign>** an object with Tx hash + (r, s, v) signature

#### signMessage

sign a SNIP-12 encoded message

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Derivation path in EIP-2645 format
*   `message` **TypedData** message to be signed
*   `account` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** accound address to sign the message

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ResponseHashSign>** an object with (r, s, v) signature
