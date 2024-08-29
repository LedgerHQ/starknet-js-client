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
  expect(response.returnCode).toBe(LedgerError.NoError);
  expect(response.major).toBe(1);
  expect(response.minor).toBe(0);
  expect(response.patch).toBe(0);
})

test('getPubKey()', async () => {

  const replay: string = 
    "=> 5a0100001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 0404ac45fea8814cc2c2bbca343f4280b25d2a5f6d65e511dd16977f35c3e64b74023e4ce66d2d3a466f4326a2def52c68eae80588a36b26574b369d6716fc16bd9000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const response = await app.getPubKey(PATH, false);
  expect(response.returnCode).toBe(LedgerError.NoError);

  const pubkey = new BN(response.publicKey, "hex");
  expect(pubkey.toString(16)).toEqual("4ac45fea8814cc2c2bbca343f4280b25d2a5f6d65e511dd16977f35c3e64b74023e4ce66d2d3a466f4326a2def52c68eae80588a36b26574b369d6716fc16bd");
})

test('signFelt(63 digits)', async () => {

  const replay: string = 
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a0202002002bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411" + '\n' +
    "<= 41047d6cd254c92b96d48449e9b7f228b48a67f206fc02c795f32f3e34311b83b001f5fb9f31b9f9fe736156956109e39c15a17192667e1b02e7ada5eece7daddd019000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_63, false);
  expect(result.returnCode).toBe(LedgerError.NoError)

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("47d6cd254c92b96d48449e9b7f228b48a67f206fc02c795f32f3e34311b83b0");
  expect(s.toString(16)).toEqual("1f5fb9f31b9f9fe736156956109e39c15a17192667e1b02e7ada5eece7daddd");

})

test('signFelt(62 digits)', async () => {

  const replay: string = 
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a02020020002e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417" + '\n' +
    "<= 4103e8e6fe2913d675ddefd5e3f4167a4c6d8b47ce504e1635eb24798c27ecb03e0220e6ef6353176e05fd1ad4bfdcfcaf900948513b5189c8141c8e970437e3d7019000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_62, false);
  expect(result.returnCode).toBe(LedgerError.NoError)

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("3e8e6fe2913d675ddefd5e3f4167a4c6d8b47ce504e1635eb24798c27ecb03e");
  expect(s.toString(16)).toEqual("220e6ef6353176e05fd1ad4bfdcfcaf900948513b5189c8141c8e970437e3d7");
})

test('signFelt(61 digits)', async () => {

  const replay: string = 
    "=> 5a0200001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a02020020000936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744" + '\n' +
    "<= 4105612c01ec09c48a0a41fac1c74c6e8549935dc4a8ff1a77353550ce6441eb3101bdf183821f92409d03b3992f359fb2f23603b22f5755b8c5ee0105335b027c009000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );
  const app = new StarknetClient(transport);

  const result = await app.signHash(PATH, HASH_61, false);
  expect(result.returnCode).toBe(LedgerError.NoError)

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("5612c01ec09c48a0a41fac1c74c6e8549935dc4a8ff1a77353550ce6441eb31");
  expect(s.toString(16)).toEqual("1bdf183821f92409d03b3992f359fb2f23603b22f5755b8c5ee0105335b027c");
})

test('sign Tx', async () => {

  const replay: string = 
    "=> 5a0300001880000a55c741e9c9c47a6028800000008000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a030100e007e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a000000000000000000000000000000000000000000000000000000000000000000004c315f47415300000000000000000000000000000000000000000000000000004c325f47415300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000534e5f4d41494e00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a03020000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a03030000" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a030400200000000000000000000000000000000000000000000000000000000000000001" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a03050080049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc70083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a00000000000000000000000000000000000000000000000000000000000003e8" + '\n' +
    "<= 9000" + '\n' +
    "=> 5a03050200" + '\n' +
    "<= 049274bcd122824a235c9c43a43e91155b37fa041aace120012153ab7aba7ecd41070c0616a76411b2e85a03c57332eb03a4939207d626e78c469ea93bec12ed7903340d421ce8424ce71a2b030c918722261e59b9b820eafb31cdc39d4c2c1a2d009000" + '\n';

  const transport = await openTransportReplayer(
    RecordStore.fromString(replay)
  );

  const app = new StarknetClient(transport);

  let txDetails: TxFields = {
    accountAddress: "0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
    tip: 0,
    l1_gas_bounds: "0x00004C315F474153000000000000000000000000000000000000000000000000",
    l2_gas_bounds: "0x00004C325F474153000000000000000000000000000000000000000000000000",
    paymaster_data: [],
    chainId: "0x534e5f4d41494e",
    nonce: 1,
    data_availability_mode: 0,
    account_deployment_data: []
  }

  let tx: Call[] = [
    { 
      to: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      selector: "0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e",
      calldata: ["0x07e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
                "0x00000000000000000000000000000000000000000000000000000000000003e8"]
    }     
  ]
    

  const result = await app.signTx(PATH, tx, txDetails);

  const r = new BN(result.r, "hex");
  const s = new BN(result.s, "hex");

  expect(r.toString(16)).toEqual("70c0616a76411b2e85a03c57332eb03a4939207d626e78c469ea93bec12ed79");
  expect(s.toString(16)).toEqual("3340d421ce8424ce71a2b030c918722261e59b9b820eafb31cdc39d4c2c1a2d");

})
