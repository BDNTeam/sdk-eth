import cfg from "./config";
import { Crypto } from "./crypto";
import { MarketHelper } from "./market";
import { TransactionHelper } from "./transaction";
import { Web3Helper } from "./web3";

export class BuyerOpts {
  dbNode: string;
  privateKey?: string;
  metaMask?: boolean;
  ethNode?: string;
}

export class Buyer {
  opts: BuyerOpts;

  web3Helper: Web3Helper;
  txHelper: TransactionHelper;
  marketHelper: MarketHelper;

  constructor(opts: BuyerOpts) {
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

  async buy(mktId: string, price: number) {
    return this.marketHelper.buy(mktId, price * Math.pow(10, 6));
  }

  async deal(mktId: string) {
    return this.marketHelper.deal(mktId);
  }
}
