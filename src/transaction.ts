import nacl from "tweetnacl";
import base58 from "bs58";

// tslint:disable-next-line:no-var-requires
const driver = require("bigchaindb-driver");

export const dbDriver = driver;

export class TransactionHelper {
  apiPath = "";
  conn: any;

  keyPair: { publicKey: string; privateKey: string };

  constructor(apiPath = "", account: any) {
    this.apiPath = apiPath;
    this.conn = new driver.Connection(apiPath);
    this.setKeyPair(account);
  }

  /**
   * Set up key pair
   * @param keyPair Ed25519Keypair or eth account
   */
  setKeyPair(keyPair: any) {
    keyPair = keyPair.address
      ? nacl.box.keyPair.fromSecretKey(Buffer.from(keyPair.privateKey.slice(2), "hex"))
      : keyPair;

    this.keyPair = {
      publicKey: base58.encode(keyPair.publicKey),
      privateKey: base58.encode(keyPair.secretKey),
    };
  }

  ensureKeyPair() {
    if (this.keyPair === null) throw new Error("please setup keyPair at first");
  }

  /**
   * Create a normal transaction
   * @param asset
   * @param meta
   * @returns retrievedTx
   */
  async createTransaction(asset: any, meta: any): Promise<any> {
    this.ensureKeyPair();

    const tx = driver.Transaction.makeCreateTransaction(
      asset,
      meta,
      [
        driver.Transaction.makeOutput(
          driver.Transaction.makeEd25519Condition(this.keyPair.publicKey),
        ),
      ],
      this.keyPair.publicKey,
    );

    const txSigned = driver.Transaction.signTransaction(tx, this.keyPair.privateKey);

    return this.conn.postTransactionCommit(txSigned);
  }

  async createExternalTransaction(asset: string, meta: any) {
    return null;
  }

  // async sell(asset: string, price: number): Promise<string> {}
}
