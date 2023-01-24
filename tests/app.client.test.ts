import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import { StarknetClient } from "../src/stark";
import { LedgerError } from "../src/common";
import { Call, TxFields } from "../src/types";
import BN from "bn.js";

const PATH = "m/2645'/1195502025'/1148870696'/0'/0'/0";

const HASH_63 = "2bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411";
const HASH_62 = "2e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417";
const HASH_61 = "936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744";

test('getAppVersion()', async () => {

  const replay: string = 
    "=> 5a00000000" + '\n' +
    "<= 0100009000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const response = await app.getAppVersion();
  expect(response.returnCode).toBe(LedgerError.NoErrors);
  expect(response.major).toBe(1);
  expect(response.minor).toBe(0);
  expect(response.patch).toBe(0);
})

/*test('getAppInfo()', async () => {

  const replay: string = 
    "=> 5a01000000" + '\n' +
    "<= 535441524b4e45549000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const response = await app.getAppInfo();
  expect(response.returnCode).toBe(LedgerError.NoErrors);
  expect(response.appName).toBe("STARKNET");
    
})*/

test('getPubKey()', async () => {

  const replay: string = 
    "=> 5a0100001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 410404ac45fea8814cc2c2bbca343f4280b25d2a5f6d65e511dd16977f35c3e64b74023e4ce66d2d3a466f4326a2def52c68eae80588a36b26574b369d6716fc16bd9000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const response = await app.getPubKey(PATH, false);
  expect(response.returnCode).toBe(LedgerError.NoErrors);

  const pubkey = new BN(response.publicKey, "hex");
  expect(pubkey.toString(16)).toEqual("404ac45fea8814cc2c2bbca343f4280b25d2a5f6d65e511dd16977f35c3e64b74023e4ce66d2d3a466f4326a2def52c68eae80588a36b26574b369d6716fc16bd");
})

test('signFelt(63 digits)', async () => {

  const replay: string = 
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a020200202bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c4110" + '\n' +
    "<= 41047d6cd254c92b96d48449e9b7f228b48a67f206fc02c795f32f3e34311b83b001f5fb9f31b9f9fe736156956109e39c15a17192667e1b02e7ada5eece7daddd019000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_63, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("47d6cd254c92b96d48449e9b7f228b48a67f206fc02c795f32f3e34311b83b0");
  expect(s.toString(16)).toEqual("1f5fb9f31b9f9fe736156956109e39c15a17192667e1b02e7ada5eece7daddd");

})

test('signFelt(62 digits)', async () => {

  const replay: string = 
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a0202002002e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb4170" + '\n' +
    "<= 4103e8e6fe2913d675ddefd5e3f4167a4c6d8b47ce504e1635eb24798c27ecb03e0220e6ef6353176e05fd1ad4bfdcfcaf900948513b5189c8141c8e970437e3d7019000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_62, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("3e8e6fe2913d675ddefd5e3f4167a4c6d8b47ce504e1635eb24798c27ecb03e");
  expect(s.toString(16)).toEqual("220e6ef6353176e05fd1ad4bfdcfcaf900948513b5189c8141c8e970437e3d7");
})

test('signFelt(61 digits)', async () => {

  const replay: string = 
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a0202002000936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab2347440" + '\n' +
    "<= 4105612c01ec09c48a0a41fac1c74c6e8549935dc4a8ff1a77353550ce6441eb3101bdf183821f92409d03b3992f359fb2f23603b22f5755b8c5ee0105335b027c009000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_61, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("5612c01ec09c48a0a41fac1c74c6e8549935dc4a8ff1a77353550ce6441eb31");
  expect(s.toString(16)).toEqual("1bdf183821f92409d03b3992f359fb2f23603b22f5755b8c5ee0105335b027c");
})

test('sign Tx', async () => {

  const replay: string = 
    "=> 5a0300001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a030100a007e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000534e5f474f45524c4900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a0302004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a030300650507446de5cfcb833d4e786f3a0510deb2429ae753741a836a7efa80c9c747cb046d696e7400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a030301680507446de5cfcb833d4e786f3a0510deb2429ae753741a836a7efa80c9c747cb07617070726f766500000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a0304004007e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a00000000000000000000000000000000000000000000000000000000000003e8" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a0304014007e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a0000000000000000000000000000000000000000000000000000000000002710" + '\n' +
    "<= 4103962dc939a61dbda65a311a0d0836a41104cc9f37bf4500aff461176d6b7f4d017cef10956773241b1bc28b09fc3db4bfad503afb727e02bda6aa0cbbf5685a009000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );

  const app = new StarknetClient(transport);

  let txDetails: TxFields = {
    accountAddress: "0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
    chainId: "0x534e5f474f45524c49",
    nonce: 1,
    maxFee: "1000000000000000",
    version: 1,
  }

  let tx: Call[] = [
    { 
      to: "0x0507446de5cfcb833d4e786f3a0510deb2429ae753741a836a7efa80c9c747cb",
      entrypoint: "mint",
      calldata: ["0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a", '1000']
    },
    { 
      to: "0x0507446de5cfcb833d4e786f3a0510deb2429ae753741a836a7efa80c9c747cb",
      entrypoint: "approve",
      calldata: ["0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a", '10000']
    }     
  ]
    

  const result = await app.signTx(PATH, tx, txDetails);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("3962dc939a61dbda65a311a0d0836a41104cc9f37bf4500aff461176d6b7f4d");
  expect(s.toString(16)).toEqual("17cef10956773241b1bc28b09fc3db4bfad503afb727e02bda6aa0cbbf5685a");

})
