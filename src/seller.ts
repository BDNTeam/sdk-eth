import cfg from "./config";
import { CryptoHelper } from "./crypto";
import { MarketHelper } from "./market";
import { TransactionHelper } from "./transaction";
import { Web3Helper } from "./web3";

export interface SellerOpts {
  dbNode: string;
  privateKey?: string;
  metaMask?: boolean;
  ethNode?: string;
}

export class Seller {
  opts: SellerOpts;

  web3Helper: Web3Helper;
  txHelper: TransactionHelper;
  marketHelper: MarketHelper;

  constructor(opts: SellerOpts) {
    if (!opts.ethNode) opts.ethNode = cfg.eth.node;
    this.opts = opts;
  }

  async init(txOpts: any = {}) {
    this.web3Helper = new Web3Helper();

    await this.web3Helper.init({
      metaMask: this.opts.metaMask,
      node: this.opts.ethNode,
    });
    if (this.opts.privateKey) this.web3Helper.addAccountFromPrivateKey(this.opts.privateKey);

    const w = this.web3Helper.web3.eth.accounts.wallet as any;
    const account = w[this.web3Helper.web3.eth.defaultAccount];
    this.txHelper = new TransactionHelper(this.opts.dbNode, account);

    this.marketHelper = new MarketHelper();
    await this.marketHelper.init(this.web3Helper, txOpts);
  }

  async createAsset(asset, meta, password?: string) {
    if (password) {
      asset = CryptoHelper.encrypt(asset, password);
      asset = { encrypted: asset };
    }
    const resp = await this.txHelper.createTransaction(asset, meta);
    return resp.id;
  }

  async sell(assetId: string, price: number) {
    return this.marketHelper.sell(assetId, price * Math.pow(10, 6));
  }

  async autoTransfer(mktId, cb: (err, tx?) => void, password?: string, txOpts = {}) {
    return this.marketHelper.listenAssetPaid(
      mktId,
      async (err, info) => {
        if (err) {
          cb(err);
          return;
        }
        const { asset, buyerCdbAddress, buyerBoxAddress } = info;
        const tx = await this.transfer(asset, buyerCdbAddress, password, buyerBoxAddress);
        cb(null, tx);
      },
      txOpts,
    );
  }

  /**
   *
   * @param asset
   * @param to should be the address of chain database
   */
  async transfer(assetId, to: string, password?: string, toBoxPubKey?: string) {
    return this.txHelper.transfer(assetId, to, password, toBoxPubKey);
  }
}
