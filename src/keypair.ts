import base58 from "bs58";
import nacl from "tweetnacl";

/**
 * The wrapper of key bytes
 */
export class Key {
  bytes: Uint8Array;

  constructor(bytes: Uint8Array | string) {
    if (typeof bytes === "string") bytes = new Uint8Array(base58.decode(bytes));
    this.bytes = bytes;
  }

  /**
   * Gets base58 encoded key bytes
   */
  toString() {
    return base58.encode(this.bytes);
  }
}

/**
 * Constructs a chain database keypair from an ethereum account
 */
export class Keypair {
  /**
   * address in chain database, used to identify a virtual user in chain database and works
   * with [[privateKey]] to sign transactions of chain database
   */
  signPublicKey: Key;

  /**
   * used as signature of shipper if it's used as seller's keypair or as signature of recipient
   * if it's being used as buyer's keypair, works with [[privateKey]] to encrypt or decrypt asset
   */
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
