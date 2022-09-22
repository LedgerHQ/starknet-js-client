import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import Stark from "../src/Stark";
import { LedgerError } from "../src/common";
import { Call, CallDetails } from "../src/types";
import BN from "bn.js";
import { ec, constants } from "starknet";

const apduPort = 4001;

const PATH = "m/2645'/1195502025'/1148870696'/0'/0'/0";
let app;
let transport;

/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
/* ! default SPECULOS PUBLIC_KEY  */
/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
const PUBLIC_KEY = "0404ac45fea8814cc2c2bbca343f4280b25d2a5f6d65e511dd16977f35c3e64b74023e4ce66d2d3a466f4326a2def52c68eae80588a36b26574b369d6716fc16bd";

const HASH_63 = "2bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411";
const HASH_62 = "2e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417";
const HASH_61 = "936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744";

function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, function (byte) {
    return `0${byte.toString(16)}`.slice(-2);
  }).join('');
}

beforeAll(async () => {
  transport = await SpeculosTransport.open({ apduPort });
  app = new Stark(transport);
})

afterAll(async () => {
  await transport.close();
})

test('getAppVersion()', async () => {
  const version = await app.getAppVersion()
  expect(version.major).toBe(1)
  expect(version.minor).toBe(0)
  expect(version.patch).toBe(0)
})

test('getPubKey()', async () => {
  const response = await app.getPubKey(PATH)
  expect(response.returnCode).toBe(LedgerError.NoErrors)
  let j = 0;
  for (let i = 0; i < PUBLIC_KEY.length; i += 2) {
    expect(response.publicKey[j++]).toBe(parseInt(PUBLIC_KEY[i]+PUBLIC_KEY[i+1], 16))
  }
})

test('signFelt(63 digits)', async () => {
  const result = await app.sign(PATH, HASH_63, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);
  
  const kp = ec.getKeyPairFromPublicKey("0x" + PUBLIC_KEY);
  expect(ec.verify(kp, HASH_63, [r.toString() as string, s.toString() as string])).toBe(true);
})

test('signFelt(62 digits)', async () => {
  const result = await app.sign(PATH, HASH_62, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);  

  const kp = ec.getKeyPairFromPublicKey("0x" + PUBLIC_KEY);
  expect(ec.verify(kp, HASH_62, [r.toString() as string, s.toString() as string])).toBe(true);
})

test('signFelt(61 digits)', async () => {
  const result = await app.sign(PATH, HASH_61, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);  

  const kp = ec.getKeyPairFromPublicKey("0x" + PUBLIC_KEY);
  expect(ec.verify(kp, HASH_61, [r.toString() as string, s.toString() as string])).toBe(true);
})

test.only('sign Tx', async () => {

  let txDetails: CallDetails = {
    accountAddress: "0x788de247ff52af4e23afe47890e2870a6c750cca97388dafc3a10401bb6e250",
    chainId: constants.StarknetChainId.MAINNET,
    nonce: 1,
    maxFee: "100000000",
    version: 1,
  }

  let tx: Call = {
    contractAddress: "0xc7c0a102d298d0310a381d1b3eb49f3c34267a5ace4a6e9d58e7a8e5dbec33",
    entryPoint: "mint",
    calldata: ["0x788de247ff52af4e23afe47890e2870a6c750cca97388dafc3a10401bb6e250", '1000']
  }
  await app.signTx(PATH, tx, txDetails);
})
