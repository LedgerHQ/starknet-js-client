import BN from "bn.js";
import { encode, BigNumberish } from "starknet";

const HARDENED = 0x80000000;

export function serializePath(path: string): Uint8Array {
  if (!path.startsWith("m/2645")) {
    throw new Error(
      "Path should start with 'm/2645' (e.g 'm/2645'/1195502025'/1148870696'/0'/0'/0')"
    );
  }

  const pathArray = path.split("/");

  const buf = new Uint8Array((pathArray.length - 1) * 4);

  const dataview = new DataView(buf.buffer);

  for (let i = 1; i < pathArray.length; i += 1) {
    let value = 0;
    let child = pathArray[i];
    if (child.endsWith("'")) {
      value += HARDENED;
      child = child.slice(0, -1);
    }

    const childNumber = Number(child);

    if (Number.isNaN(childNumber)) {
      throw new Error(`Invalid path : ${child} is not a number.`);
    }

    if (childNumber >= HARDENED) {
      throw new Error("Incorrect child value (bigger or equal to 0x80000000)");
    }

    value += childNumber;

    dataview.setUint32(4 * (i - 1), value);
  }

  return buf;
}

export function isHex(hex: string): boolean {
  return /^0x[0-9a-f]*$/i.test(hex);
}

export function toBN(v: BigNumberish): BN {
  if (typeof v === "bigint" || typeof v === "number") {
    return new BN(v.toString());
  } else if (typeof v === "string") {
    v = v.toLowerCase();
    if (isHex(v)) {
      return new BN(encode.removeHexPrefix(v), "hex");
    } else {
      return new BN(v);
    }
  } else {
    throw new Error("Invalid input type for sanitizeHexBN");
  }
}
