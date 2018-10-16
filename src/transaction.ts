import base58 from "bs58";
import _ from "lodash";
import { TextDecoder, TextEncoder } from "text-encoding";
import nacl from "tweetnacl";
import url from "url";
import { CryptoHelper } from "./crypto";
import { Key, Keypair } from "./keypair";
import { isBrowser, isNode } from "browser-or-node";

// tslint:disable-next-line:no-var-requires
const driver = require("bigchaindb-driver");

export const dbDriver = driver;

export class Ws {}

/**
 * Helper to perform transaction in chain database
 */
export class TransactionHelper {
  apiPath = "";
  conn: any;

  wsPath = "";
  ws: WebSocket;

  keyPair: Keypair;

  constructor(apiPath = "", wsPath = "", account: any) {
    this.setKeyPair(account);

    this.apiPath = apiPath;
    this.conn = new driver.Connection(apiPath);

    this.wsPath = wsPath;
    this.ws = new WebSocket(this.wsPath);
  }

  /**
   * Set up key pair
   * @param ethAccount  eth account
   */
  setKeyPair(ethAccount) {
    this.keyPair = new Keypair(ethAccount);
  }

  ensureKeyPair() {
    if (!this.keyPair) throw new Error("please setup keyPair at first");
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
          driver.Transaction.makeEd25519Condition(this.keyPair.signPublicKey.toString()),
        ),
      ],
      this.keyPair.signPublicKey.toString(),
    );

    const txSigned = driver.Transaction.signTransaction(tx, this.keyPair.privateKey.toString());

    return this.conn.postTransactionCommit(txSigned);
  }

  async getAssetCreateTx(assetId: string) {
    const txs = await this.conn.listTransactions(assetId, "CREATE");
    if (txs.length === 0) throw new Error("no asset");
    return txs[0];
  }

  async transfer(assetId: string, to: string, password?: string, toBoxPubKey?: string) {
    const tx = await this.getAssetCreateTx(assetId);

    let metadata: any;
    if (password) {
      if (!toBoxPubKey) throw new Error("missing box pubKey of the new owner");

      const nonce = nacl.randomBytes(24);
      const u8enc = new TextEncoder();
      const encPwd = nacl.box(
        u8enc.encode(password),
        nonce,
        new Key(toBoxPubKey).bytes,
        this.keyPair.privateKey.bytes,
      );
      metadata = { _enc_: base58.encode(encPwd), _nonce_: base58.encode(nonce) };
    }

    const transferTx = driver.Transaction.makeTransferTransaction(
      [{ tx, output_index: 0 }],
      [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(to))],
      metadata,
    );
    const singed = driver.Transaction.signTransaction(
      transferTx,
      this.keyPair.privateKey.toString(),
    );
    return this.conn.postTransactionCommit(singed);
  }

  async createExternalTransaction(asset: string, meta: any) {
    return null;
  }

  async getAsset(assetId: string) {
    const txs = await this.conn.listTransactions(assetId);
    if (txs.length === 0) throw new Error("no asset");
    let asset: any = {};
    let metadata: any = {};
    txs.forEach(tx => {
      asset = _.merge(asset, tx.asset);
      metadata = _.merge(metadata, tx.metadata);
    });
    return { asset, metadata };
  }

  async receiveAsset(assetId: string, fromBoxPubKey?: string) {
    const { asset, metadata } = await this.getAsset(assetId);

    if (fromBoxPubKey) {
      const encAsset = asset.data.encrypted;
      if (typeof encAsset !== "string") throw new Error("deformed encrypted asset");

      if (!metadata) throw new Error("missing metadata");

      let enc = metadata._enc_;
      let nonce = metadata._nonce_;
      if (!enc || !nonce) throw new Error("deformed pwd");

      enc = new Uint8Array(base58.decode(enc));
      nonce = new Uint8Array(base58.decode(nonce));
      const key = nacl.box.open(
        enc,
        nonce,
        new Key(fromBoxPubKey).bytes,
        this.keyPair.privateKey.bytes,
      );
      if (key === null) throw new Error("illegal pwd");

      return CryptoHelper.decrypt(encAsset, new TextDecoder("utf8").decode(key));
    }

    return asset.data;
  }

  // async sell(asset: string, price: number): Promise<string> {}
}
