import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { StarknetClient } from "../src/index";
import { LedgerError } from "../src/common";
import { TxFields, TxV1Fields, DeployAccountFields, DeployAccountV1Fields } from "../src/types";
import BN from "bn.js";

import { Call, shortString, TypedData } from "starknet";

const PATH = "m/2645'/1195502025'/1148870696'/0'/0'/0";

const HASH_63 = "0x02bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411";
const HASH_62 = "0x002e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417";
const HASH_61 = "0x000936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744";

test("getAppVersion()", async () => {
  const replay: string = "=> 5a00000000" + "\n" + "<= 0100009000" + "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));
  const app = new StarknetClient(transport);

  const response = await app.getAppVersion();
  expect(response.returnCode).toBe(LedgerError.NoError);
  expect(response.major).toBe(1);
  expect(response.minor).toBe(0);
  expect(response.patch).toBe(0);
});

test("getPubKey()", async () => {
  const replay: string =
    "=> 5a0100001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 0404ac45fea8814cc2c2bbca343f4280b25d2a5f6d65e511dd16977f35c3e64b74023e4ce66d2d3a466f4326a2def52c68eae80588a36b26574b369d6716fc16bd9000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));
  const app = new StarknetClient(transport);

  const response = await app.getPubKey(PATH, false);
  expect(response.returnCode).toBe(LedgerError.NoError);

  const pubkey = new BN(response.publicKey, "hex");
  expect(pubkey.toString(16)).toEqual(
    "4ac45fea8814cc2c2bbca343f4280b25d2a5f6d65e511dd16977f35c3e64b74023e4ce66d2d3a466f4326a2def52c68eae80588a36b26574b369d6716fc16bd"
  );
});

test("signHash(63 digits)", async () => {
  const replay: string =
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a0201002002bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411" +
    "\n" +
    "<= 41047d6cd254c92b96d48449e9b7f228b48a67f206fc02c795f32f3e34311b83b001f5fb9f31b9f9fe736156956109e39c15a17192667e1b02e7ada5eece7daddd019000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_63);
  expect(result.returnCode).toBe(LedgerError.NoError);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("47d6cd254c92b96d48449e9b7f228b48a67f206fc02c795f32f3e34311b83b0");
  expect(s.toString(16)).toEqual("1f5fb9f31b9f9fe736156956109e39c15a17192667e1b02e7ada5eece7daddd");
});

test("signHash(62 digits)", async () => {
  const replay: string =
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a02010020002e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417" +
    "\n" +
    "<= 4103e8e6fe2913d675ddefd5e3f4167a4c6d8b47ce504e1635eb24798c27ecb03e0220e6ef6353176e05fd1ad4bfdcfcaf900948513b5189c8141c8e970437e3d7019000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_62);
  expect(result.returnCode).toBe(LedgerError.NoError);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("3e8e6fe2913d675ddefd5e3f4167a4c6d8b47ce504e1635eb24798c27ecb03e");
  expect(s.toString(16)).toEqual("220e6ef6353176e05fd1ad4bfdcfcaf900948513b5189c8141c8e970437e3d7");
});

test("signHash(61 digits)", async () => {
  const replay: string =
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a02010020000936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744" +
    "\n" +
    "<= 4105612c01ec09c48a0a41fac1c74c6e8549935dc4a8ff1a77353550ce6441eb3101bdf183821f92409d03b3992f359fb2f23603b22f5755b8c5ee0105335b027c009000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_61);
  expect(result.returnCode).toBe(LedgerError.NoError);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("5612c01ec09c48a0a41fac1c74c6e8549935dc4a8ff1a77353550ce6441eb31");
  expect(s.toString(16)).toEqual("1bdf183821f92409d03b3992f359fb2f23603b22f5755b8c5ee0105335b027c");
});

test("sign Tx", async () => {
  const replay: string =
    "=> 5a0300001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a0301008003fea70284ea856c2e26b561830f99391c81ab94096ce7d217ae5ee68d5b1b7100000000000000000000000000000000000000000000534e5f5345504f4c494100000000000000000000000000000000000000000000000000000000000000aa0000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a03020060000000000000000000000000000000000000000000000000000000000000000000004c315f47415300000000000000000000000000000000000011c224d0193900004c325f47415300000000001591e00000000000000000000000018f68b63c" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a03030000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a03040000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a030500200000000000000000000000000000000000000000000000000000000000000001" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a030600c0049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc70083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e00000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000666666666666000000000000000000000000000000000000000000000000000000174876e8000000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 049fab7ed92e4e9046f38a7a83e81937bfb67dbc788799d215e854f116e51c7f410318cc8d828187b63c3f067744908756b4437d78d940ca294dac9953d0cd93b300755e8e33a77ac1c25c6b714ba36c4667f0b491fe09c59af9f1b4dfef83b0d9009000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));

  const app = new StarknetClient(transport);

  // tx_v3_l1_data_gas_transfer
  let txDetails: TxFields = {
    accountAddress: "0x03fea70284ea856c2e26b561830f99391c81ab94096ce7d217ae5ee68d5b1b71",
    tip: 0,
    resourceBounds: {
      l1_gas: {
        max_amount: "0x0",
        max_price_per_unit: "0x11c224d01939",
      },
      l2_gas: {
        max_amount: "0x1591e0",
        max_price_per_unit: "0x18f68b63c",
      },
    },
    paymaster_data: [],
    chainId: "0x534e5f5345504f4c4941",
    nonce: 170,
    nonceDataAvailabilityMode: "L1",
    feeDataAvailabilityMode: "L1",
    account_deployment_data: [],
  };

  let tx: Call[] = [
    {
      contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      entrypoint: "transfer",
      calldata: [
        "0x666666666666",
        "0x174876e800",
        "0x0"
      ],
    },
  ];

  const result = await app.signTx(PATH, tx, txDetails);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("318cc8d828187b63c3f067744908756b4437d78d940ca294dac9953d0cd93b3");
  expect(s.toString(16)).toEqual("755e8e33a77ac1c25c6b714ba36c4667f0b491fe09c59af9f1b4dfef83b0d9");
});

test("sign DeployAccount", async () => {
  const replay: string =
    "=> 5a0500001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a050100c0016d12c2c06057995bd961c0eb75ffdbf6710f9776abaa1278234ed4d43bccc900000000000000000000000000000000000000000000000000534e5f4d41494e000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000001c0bb51e2ce73dc007601a1e7725453627254016c28f118251a71bbb0507fcb01f0bb51e2ce73dc007601a1e77254536272540162a8c118251a71bbb0507faf" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a05020060000000000000000000000000000000000000000000000000000000000000000000004c315f47415300000000000000000000000000000000000011c224d0193900004c325f47415300000000001591e00000000000000000000000018f68b63c" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a05030000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a050400200000000000000000000000000000000000000000000000000000000000000002" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a0505004000ddfe9f9ebc9dd230f906008e54c8b56994250505a13737609ed57f4e4d79360000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 0376f10cb01423896f57c08529e7ef3812df703ae51cfc7b8edc2ee2d36fa7b1410577c8b5142691e3e79355f6a48f9284b09ae7c12f7dfc5388c3889c980002b700b02b9f885cdb25fd30d34bc085ba3f687a2025f907fb1d2f58f7d45ca3837f009000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));

  const app = new StarknetClient(transport);

  // tx_v3_l1_data_gas_deploy_account
  let txDetails: DeployAccountFields = {
    contractAddress: "0x016d12c2c06057995bd961c0eb75ffdbf6710f9776abaa1278234ed4d43bccc9",
    tip: 0,
    resourceBounds: {
      l2_gas: {
        max_amount: "0x1591e0",
        max_price_per_unit: "0x18f68b63c"
      },
      l1_gas: {
        max_amount: "0x0",
        max_price_per_unit: "0x11c224d01939"
      },
    },
    paymaster_data: [],
    chainId: "0x534e5f4d41494e",
    nonce: 10,
    nonceDataAvailabilityMode: "L1",
    feeDataAvailabilityMode: "L1",
    constructor_calldata: ["0xddfe9f9ebc9dd230f906008e54c8b56994250505a13737609ed57f4e4d7936", "0x0"],
    class_hash: "0x01c0bb51e2ce73dc007601a1e7725453627254016c28f118251a71bbb0507fcb",
    contract_address_salt: "0x01f0bb51e2ce73dc007601a1e77254536272540162a8c118251a71bbb0507faf",
  };

  const result = await app.signDeployAccount(PATH, txDetails);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("577c8b5142691e3e79355f6a48f9284b09ae7c12f7dfc5388c3889c980002b7");
  expect(s.toString(16)).toEqual("b02b9f885cdb25fd30d34bc085ba3f687a2025f907fb1d2f58f7d45ca3837f");
});

test("sign TxV1", async () => {
  const replay: string =
    "=> 5a0400001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a0401008002314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a900000000000000000000000000000000000000000000000000000027f35e4f3400000000000000000000000000000000000000000000000000534e5f4d41494e000000000000000000000000000000000000000000000000000000000000001c" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a040200200000000000000000000000000000000000000000000000000000000000000001" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a040300c0049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc70083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e0000000000000000000000000000000000000000000000000000000000000003011f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016000000000000000000000000000000000000000000000000000009184e72a0000000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 06cc6ac647c4df86f0f0922c0d69b919318298553e252a84aec8efafa4645e4641043ab0a1362e38a1d4f5b8e0a1bc48fcadbd5876a3a11bf6878519db022e009102e475499319c6b9fefddf336ea81cc00b8533826bc71f601ed09593239f998d009000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));

  const app = new StarknetClient(transport);

  // tx_v1_transfer_ETH_0.json
  let txDetails: TxV1Fields = {
    accountAddress: "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9",
    max_fee: "171586768692",
    chainId: "0x534e5f4d41494e",
    nonce: "28",
  };

  let calls: Call[] = [
    {
      contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      entrypoint: "transfer",
      calldata: [
        "0x11f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016",
        "0x9184e72a000",
        "0x0",
      ],
    },
  ];

  const result = await app.signTxV1(PATH, calls, txDetails);

  const h = new BN(result.h, "hex");
  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(h.toString(16)).toEqual("6cc6ac647c4df86f0f0922c0d69b919318298553e252a84aec8efafa4645e46");
  expect(r.toString(16)).toEqual("43ab0a1362e38a1d4f5b8e0a1bc48fcadbd5876a3a11bf6878519db022e0091");
  expect(s.toString(16)).toEqual("2e475499319c6b9fefddf336ea81cc00b8533826bc71f601ed09593239f998d");
});

test("sign DeployAccount V1", async () => {
  const replay: string =
    "=> 5a0600001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a060100c0016d12c2c06057995bd961c0eb75ffdbf6710f9776abaa1278234ed4d43bccc901c0bb51e2ce73dc007601a1e7725453627254016c28f118251a71bbb0507fcb01f0bb51e2ce73dc007601a1e77254536272540162a8c118251a71bbb0507faf000000000000000000000000000000000000000000000000000000e8d4a5100000000000000000000000000000000000000000000000000000534e5f4d41494e0000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a060200200000000000000000000000000000000000000000000000000000000000000002" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a0603004000ddfe9f9ebc9dd230f906008e54c8b56994250505a13737609ed57f4e4d79360000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 07be80ff077bc960562b96c9d73da404de702cb1cf94f112636d1eb28ef4894b4103e0c7a3a7755b916d9e7ae9f4571649aa709b88a125d13f91995aebee1ac4d30398fc1a1f2a80c9b1d715eb77ae09d7a1fca11d4e6e7b1516208849f4bc0a7d019000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));

  const app = new StarknetClient(transport);

  // tx_v1_deploy_account.json
  let txDetails: DeployAccountV1Fields = {
    contractAddress: "0x016d12c2c06057995bd961c0eb75ffdbf6710f9776abaa1278234ed4d43bccc9",
    max_fee: "1000000000000",
    chainId: "0x534e5f4d41494e",
    nonce: "0",
    class_hash: "0x01c0bb51e2ce73dc007601a1e7725453627254016c28f118251a71bbb0507fcb",
    contract_address_salt: "0x01f0bb51e2ce73dc007601a1e77254536272540162a8c118251a71bbb0507faf",
    constructor_calldata: ["0xddfe9f9ebc9dd230f906008e54c8b56994250505a13737609ed57f4e4d7936", "0x0"],
  };

  const result = await app.signDeployAccountV1(PATH, txDetails);

  const h = new BN(result.h, "hex");
  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(h.toString(16)).toEqual("7be80ff077bc960562b96c9d73da404de702cb1cf94f112636d1eb28ef4894b");
  expect(r.toString(16)).toEqual("3e0c7a3a7755b916d9e7ae9f4571649aa709b88a125d13f91995aebee1ac4d3");
  expect(s.toString(16)).toEqual("398fc1a1f2a80c9b1d715eb77ae09d7a1fca11d4e6e7b1516208849f4bc0a7d");
});

test("sign Message", async () => {
  const replay: string =
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a0201002003c1271284e24bc997f163478cd3de6b391a86ae1383e328d4f8c0260d7c9e58" +
    "\n" +
    "<= 41035b9afedd7dd9f9ed593de6082cf2a37b24ced4ab4db395cf2779ee6e5e59d5018ae94742f4b3cadafe153a378c60e77f0b822cb19ec9a158443d49efd29696019000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));

  const app = new StarknetClient(transport);

  const typedDataValidate: TypedData = {
    types: {
      StarkNetDomain: [
        { name: "name", type: "string" },
        { name: "version", type: "felt" },
        { name: "chainId", type: "felt" },
      ],
      Airdrop: [
        { name: "address", type: "felt" },
        { name: "amount", type: "felt" },
      ],
      Validate: [
        { name: "id", type: "felt" },
        { name: "from", type: "felt" },
        { name: "amount", type: "felt" },
        { name: "nameGamer", type: "string" },
        { name: "endDate", type: "felt" },
        { name: "itemsAuthorized", type: "felt*" }, // array of felt
        { name: "chkFunction", type: "selector" }, // name of function
        { name: "rootList", type: "merkletree", contains: "Airdrop" }, // root of a merkle tree
      ],
    },
    primaryType: "Validate",
    domain: {
      name: "myToto", // put the name of your dapp to ensure that the signatures will not be used by other DAPP
      version: "1",
      chainId: shortString.encodeShortString("SN_SEPOLIA"), // shortString of 'SN_SEPOLIA' (or 'SN_MAIN'), to be sure that signature can't be used by other network.
    },
    message: {
      id: "0x0000004f000f",
      from: "0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066",
      amount: "400",
      nameGamer: "Hector26",
      endDate: "0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c",
      itemsAuthorized: ["0x01", "0x03", "0x0a", "0x0e"],
      chkFunction: "check_authorization",
      rootList: [
        {
          address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
          amount: "1554785",
        },
        {
          address: "0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b",
          amount: "2578248",
        },
        {
          address: "0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1",
          amount: "4732581",
        },
        {
          address: "0x7f14339f5d364946ae5e27eccbf60757a5c496bf45baf35ddf2ad30b583541a",
          amount: "913548",
        },
      ],
    },
  };

  const exampleAddress = "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9";

  const result = await app.signMessage(PATH, typedDataValidate, exampleAddress);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("35b9afedd7dd9f9ed593de6082cf2a37b24ced4ab4db395cf2779ee6e5e59d5");
  expect(s.toString(16)).toEqual("18ae94742f4b3cadafe153a378c60e77f0b822cb19ec9a158443d49efd29696");
});
