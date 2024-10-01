import {
  openTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import { StarknetClient } from "../src/stark";
import { LedgerError } from "../src/common";
import { TxFields, TxV1Fields } from "../src/types";
import BN from "bn.js";

import { Call, shortString, TypedData } from "starknet";

const PATH = "m/2645'/1195502025'/1148870696'/0'/0'/0";

const HASH_63 =
  "0x02bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411";
const HASH_62 =
  "0x002e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417";
const HASH_61 =
  "0x000936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744";

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

  expect(r.toString(16)).toEqual(
    "47d6cd254c92b96d48449e9b7f228b48a67f206fc02c795f32f3e34311b83b0"
  );
  expect(s.toString(16)).toEqual(
    "1f5fb9f31b9f9fe736156956109e39c15a17192667e1b02e7ada5eece7daddd"
  );
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

  expect(r.toString(16)).toEqual(
    "3e8e6fe2913d675ddefd5e3f4167a4c6d8b47ce504e1635eb24798c27ecb03e"
  );
  expect(s.toString(16)).toEqual(
    "220e6ef6353176e05fd1ad4bfdcfcaf900948513b5189c8141c8e970437e3d7"
  );
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

  expect(r.toString(16)).toEqual(
    "5612c01ec09c48a0a41fac1c74c6e8549935dc4a8ff1a77353550ce6441eb31"
  );
  expect(s.toString(16)).toEqual(
    "1bdf183821f92409d03b3992f359fb2f23603b22f5755b8c5ee0105335b027c"
  );
});

test("sign Tx", async () => {
  const replay: string =
    "=> 5a0300001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a030100e007e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a000000000000000000000000000000000000000000000000000000000000000000004c315f47415300000000000003ad00000000000000000005cff80d86108b00004c325f47415300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000534e5f4d41494e00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a03020000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a03030000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a030400200000000000000000000000000000000000000000000000000000000000000001" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a03050080049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc70083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a00000000000000000000000000000000000000000000000000000000000003e8" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a03050200" +
    "\n" +
    "<= 049274bcd122824a235c9c43a43e91155b37fa041aace120012153ab7aba7ecd41070c0616a76411b2e85a03c57332eb03a4939207d626e78c469ea93bec12ed7903340d421ce8424ce71a2b030c918722261e59b9b820eafb31cdc39d4c2c1a2d009000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));

  const app = new StarknetClient(transport);

  let txDetails: TxFields = {
    accountAddress:
      "0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
    tip: 0,
    resourceBounds: {
      l1_gas: {
        max_amount: "0x3ad",
        max_price_per_unit: "0x5cff80d86108b"
      },
      l2_gas: {
        max_amount: "0x0",
        max_price_per_unit: "0x0"
      }
    },
    paymaster_data: [],
    chainId: "0x534e5f4d41494e",
    nonce: 1,
    nonceDataAvailabilityMode: "L1",
    feeDataAvailabilityMode: "L1",
    account_deployment_data: []
  };

  let tx: Call[] = [
    {
      contractAddress:
        "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      entrypoint: "transfer",
      calldata: [
        "0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
        "0x00000000000000000000000000000000000000000000000000000000000003e8"
      ]
    }
  ];

  const result = await app.signTx(PATH, tx, txDetails);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual(
    "70c0616a76411b2e85a03c57332eb03a4939207d626e78c469ea93bec12ed79"
  );
  expect(s.toString(16)).toEqual(
    "3340d421ce8424ce71a2b030c918722261e59b9b820eafb31cdc39d4c2c1a2d"
  );
});

test("sign TxV1", async () => {
  const replay: string =
    "=> 5a0400001880000a55c741e9c9c47a6028800000008000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a0401008002314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a900000000000000000000000000000000000000000000000000000027fa19228400000000000000000000000000000000000000000000000000534e5f4d41494e000000000000000000000000000000000000000000000000000000000000001c" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a040200200000000000000000000000000000000000000000000000000000000000000001" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a040300a0049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc70083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e011f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016000000000000000000000000000000000000000000000000000009184e72a0000000000000000000000000000000000000000000000000000000000000000000" +
    "\n" +
    "<= 9000" +
    "\n" +
    "=> 5a04030200" +
    "\n" +
    "<= 062d7552814015c9820754f15df1196b220356d7fa812a411d439047c9ab0bce410288bf2ffdbc7a81c8a3749d6bc8ef0877d9bb3251a1d6010eaa3326ab367c61033d8448aadad62cf67f52e611e8aebc9b152691dfbb46988730491b80cf7e22019000" +
    "\n";

  const transport = await openTransportReplayer(RecordStore.fromString(replay));

  const app = new StarknetClient(transport);

  let txDetails: TxV1Fields = {
    accountAddress:
      "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9",
    max_fee: "171699675780",
    chainId: "0x534e5f4d41494e",
    nonce: "28"
  };

  let calls: Call[] = [
    {
      contractAddress:
        "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      entrypoint: "transfer",
      calldata: [
        "0x11f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016",
        "0x9184e72a000",
        "0x0"
      ]
    }
  ];

  const result = await app.signTxV1(PATH, calls, txDetails);

  const h = new BN(result.h, "hex");
  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(h.toString(16)).toEqual(
    "62d7552814015c9820754f15df1196b220356d7fa812a411d439047c9ab0bce"
  );
  expect(r.toString(16)).toEqual(
    "288bf2ffdbc7a81c8a3749d6bc8ef0877d9bb3251a1d6010eaa3326ab367c61"
  );
  expect(s.toString(16)).toEqual(
    "33d8448aadad62cf67f52e611e8aebc9b152691dfbb46988730491b80cf7e22"
  );
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
        { name: "chainId", type: "felt" }
      ],
      Airdrop: [
        { name: "address", type: "felt" },
        { name: "amount", type: "felt" }
      ],
      Validate: [
        { name: "id", type: "felt" },
        { name: "from", type: "felt" },
        { name: "amount", type: "felt" },
        { name: "nameGamer", type: "string" },
        { name: "endDate", type: "felt" },
        { name: "itemsAuthorized", type: "felt*" }, // array of felt
        { name: "chkFunction", type: "selector" }, // name of function
        { name: "rootList", type: "merkletree", contains: "Airdrop" } // root of a merkle tree
      ]
    },
    primaryType: "Validate",
    domain: {
      name: "myToto", // put the name of your dapp to ensure that the signatures will not be used by other DAPP
      version: "1",
      chainId: shortString.encodeShortString("SN_SEPOLIA") // shortString of 'SN_SEPOLIA' (or 'SN_MAIN'), to be sure that signature can't be used by other network.
    },
    message: {
      id: "0x0000004f000f",
      from: "0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066",
      amount: "400",
      nameGamer: "Hector26",
      endDate:
        "0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c",
      itemsAuthorized: ["0x01", "0x03", "0x0a", "0x0e"],
      chkFunction: "check_authorization",
      rootList: [
        {
          address:
            "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
          amount: "1554785"
        },
        {
          address:
            "0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b",
          amount: "2578248"
        },
        {
          address:
            "0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1",
          amount: "4732581"
        },
        {
          address:
            "0x7f14339f5d364946ae5e27eccbf60757a5c496bf45baf35ddf2ad30b583541a",
          amount: "913548"
        }
      ]
    }
  };

  const exampleAddress =
    "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9";

  const result = await app.signMessage(PATH, typedDataValidate, exampleAddress);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual(
    "35b9afedd7dd9f9ed593de6082cf2a37b24ced4ab4db395cf2779ee6e5e59d5"
  );
  expect(s.toString(16)).toEqual(
    "18ae94742f4b3cadafe153a378c60e77f0b822cb19ec9a158443d49efd29696"
  );
});
