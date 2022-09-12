import Stark from "../src/Stark";
import { LedgerError } from "../src/common";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import BN from "bn.js";
import { ec } from "starknet";

let transport;
let app;

const PATH = "m/2645'/1195502025'/1148870696'/0'/0'/0"


const HASH_63 = "2bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411";
const HASH_62 = "2e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417";
const HASH_61 = "936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744";

function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, function (byte) {
    return `0${byte.toString(16)}`.slice(-2);
  }).join('');
}

beforeAll(async () => {
  transport = await TransportNodeHid.create()
  app = new Stark(transport)
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
})


test('sign(63 digits)', async () => {

  const { publicKey }  = await app.getPubKey(PATH)

  const result = await app.sign(PATH, HASH_63, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);
  
  const kp = ec.getKeyPairFromPublicKey(new BN(publicKey, 16, 'be'));
  expect(ec.verify(kp, HASH_63, [r.toString(), s.toString()])).toBe(true);
})

test('sign(62 digits)', async () => {

  const { publicKey }  = await app.getPubKey(PATH)

  const result = await app.sign(PATH, HASH_62, false)
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);  

  const kp = ec.getKeyPairFromPublicKey(new BN(publicKey, 16, 'be'));
  expect(ec.verify(kp, HASH_62, [r.toString(), s.toString()])).toBe(true);
})

test('sign(61 digits)', async () => {

  const { publicKey }  = await app.getPubKey(PATH)

  const result = await app.sign(PATH, HASH_61, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);  

  const kp = ec.getKeyPairFromPublicKey(new BN(publicKey, 16, 'be'));
  expect(ec.verify(kp, HASH_61, [r.toString(), s.toString()])).toBe(true);
})