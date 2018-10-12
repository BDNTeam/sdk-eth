import base58 from "bs58";
import nacl from "tweetnacl";

export class Key {
  bytes: Uint8Array;

  constructor(bytes: Uint8Array | string) {
    if (typeof bytes === "string") bytes = new Uint8Array(base58.decode(bytes));
    this.bytes = bytes;
  }

  toString() {
    return base58.encode(this.bytes);
  }
}

export class Keypair {
  signPublicKey: Key;
  boxPublicKey: Key;
  privateKey: Key;

  constructor(ethAccount: { address: string; privateKey: string }) {
    if (!ethAccount.address) throw new Error("muse be an eth account");

    const seed = new Uint8Array(
      ethAccount.privateKey.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)),
    );
    const keyPair = nacl.sign.keyPair.fromSeed(seed);

    this.privateKey = new Key(keyPair.secretKey.slice(0, 32));
    this.signPublicKey = new Key(keyPair.publicKey);

    const boxKeyPair = nacl.box.keyPair.fromSecretKey(this.privateKey.bytes);
    this.boxPublicKey = new Key(boxKeyPair.publicKey);
  }
}
