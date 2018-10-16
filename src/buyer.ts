import cfg from "./config";
import { CryptoHelper } from "./crypto";
import { MarketHelper } from "./market";
import { TransactionHelper } from "./transaction";
import { Web3Helper } from "./web3";

/**
 * Options to initialize a buyer
 */
export class BuyerOpts {
  /**
   * The http address of a chain database node
   */
  dbNode: string;

  /**
   * The websocket address of a chain database node
   */
  dbWsNode: string;

  /**
   * The private key of buyer's ethereum account, this field
   * can be optional if [[metaMask]] is set to `true`
   */
  privateKey?: string;

  /**
   * Use MetaMask or not
   */
  metaMask?: boolean;

  /**
   * The http address of the ethereum node
   */
  ethNode?: string;
}

/**
 * Encapsulates some buyer's logics
 */
export class Buyer {
  opts: BuyerOpts;

  web3Helper: Web3Helper;
  txHelper: TransactionHelper;
  marketHelper: MarketHelper;

  constructor(opts: BuyerOpts) {
    if (!opts.ethNode) opts.ethNode = cfg.eth.node;
    this.opts = opts;
  }

  /**
   * This method should be called after constructing a buyer instance to finish setups
   *
   * @param txOpts Options used for process a ethereum transaction
   */
  async init(txOpts: any = {}) {
    this.web3Helper = new Web3Helper();

    await this.web3Helper.init({
      metaMask: this.opts.metaMask,
      node: this.opts.ethNode,
    });
    if (this.opts.privateKey) this.web3Helper.addAccountFromPrivateKey(this.opts.privateKey);

    const w = this.web3Helper.web3.eth.accounts.wallet as any;
    const account = w[this.web3Helper.web3.eth.defaultAccount];
    this.txHelper = new TransactionHelper(this.opts.dbNode, this.opts.dbWsNode, account);

    this.marketHelper = new MarketHelper();
    await this.marketHelper.init(this.web3Helper, txOpts);
  }

  /**
   * Buys the asset
   *
   * @param mktId The mkt id is the identifier of chain database asset in ethereum
   * @param price Should be greater or equal that value expected by seller
   */
  async buy(mktId: string, price: number) {
    return this.marketHelper.buy(
      mktId,
      this.txHelper.keyPair.signPublicKey.toString(),
      this.txHelper.keyPair.boxPublicKey.toString(),
      price * Math.pow(10, 6),
    );
  }

  async autoReceiveAsset(asset, cb: (data) => boolean, fromBoxPubKey?: string) {
    this.txHelper.ws.addEventListener("message", evt => {
      const stop = cb(evt);
      if (stop) this.txHelper.ws.removeEventListener("message", cb);
    });
  }

  /**
   * Used to receive the asset after seller transferred the asset
   *
   * @param asset The id of asset in chain database
   * @param fromBoxPubKey The shipper address of seller, used to decrypted the encrypted data
   * @param isEncrypted
   */
  async receiveAsset(asset, fromBoxPubKey?: string) {
    if (typeof asset !== "string") asset = asset.id;
    return this.txHelper.receiveAsset(asset, fromBoxPubKey);
  }

  /**
   * After buyer accepts the validation of a asset, he should call this method to tell system that
   * his paid money is safe to seller
   *
   * @param mktId
   */
  async deal(mktId: string) {
    return this.marketHelper.deal(mktId);
  }
}
