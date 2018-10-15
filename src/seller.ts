import cfg from "./config";
import { CryptoHelper } from "./crypto";
import { MarketHelper } from "./market";
import { TransactionHelper } from "./transaction";
import { Web3Helper } from "./web3";

/**
 * Options to initialize a seller
 */
export interface SellerOpts {
  /**
   * The http address of chain database node
   */
  dbNode: string;

  /**
   * The private key of seller's ethereum account, this field
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
 * Seller class is consist of some seller logics
 */
export class Seller {
  opts: SellerOpts;

  web3Helper: Web3Helper;
  txHelper: TransactionHelper;
  marketHelper: MarketHelper;

  /**
   *
   * @param opts Options to initialize the seller
   */
  constructor(opts: SellerOpts) {
    if (!opts.ethNode) opts.ethNode = cfg.eth.node;
    this.opts = opts;
  }

  /**
   * This method should be called after constructing a seller instance to finish setups
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
    this.txHelper = new TransactionHelper(this.opts.dbNode, account);

    this.marketHelper = new MarketHelper();
    await this.marketHelper.init(this.web3Helper, txOpts);
  }

  /**
   * Creates an asset on chain database. It's better for seller to provide a meta to
   * describe his asset, for one wants to buy something could search meta to find
   * the expected asset.
   *
   * If the password is not provided the plain asset will be published otherwise the encrypted
   * asset which is encrypted by using the password will be published
   *
   * @param asset The asset to be created
   * @param meta  The meta to describe the asset
   * @param password the password of the asset
   * @returns The published asset id
   */
  async createAsset(asset, meta, password?: string) {
    if (password) {
      asset = CryptoHelper.encrypt(asset, password);
      asset = { encrypted: asset };
    }
    const resp = await this.txHelper.createTransaction(asset, meta);
    return resp.id as string;
  }

  /**
   * An asset is published into chain database, using this method to register it into
   * ethereum for selling
   *
   * @param assetId The asset id returns from `createAsset`
   * @param price The price of the asset expected to be paid
   * @returns The mkt id to identify the asset in ethereum
   */
  async sell(assetId: string, price: number) {
    return this.marketHelper.sell(
      this.txHelper.keyPair.signPublicKey.toString(),
      this.txHelper.keyPair.boxPublicKey.toString(),
      assetId,
      price * Math.pow(10, 6),
    );
  }

  /**
   * After an asset is registered into ethereum, it is moved to the selling state
   * then the seller should to start to watch the state changing, once the state is
   * changed to be paid than the seller should transfer the asset saved in chain
   * database to it's buyer.
   *
   * Using this method run an automatic process to perform above actions.
   *
   * Caveat to keep this process is running until it finishes. If the process is
   * running in a browser tab, than the tab should not be closed before the paid
   * notification of the mkt id is received
   *
   * @param mktId The mkt id to identify the asset in ethereum
   * @param cb  Callback when the Paid Notification is been received
   * @param password The password was used to encrypt the asset
   * @param txOpts Options used for process a ethereum transaction
   */
  async autoTransfer(mktId, cb: (err, paidInfo?, tx?) => void, password?: string, txOpts = {}) {
    return this.marketHelper.listenAssetPaid(
      mktId,
      async (err, info) => {
        if (err) {
          cb(err);
          return;
        }
        const { asset, buyerCdbAddress, buyerBoxAddress } = info;
        const tx = await this.transfer(asset, buyerCdbAddress, password, buyerBoxAddress);
        cb(null, info, tx);
      },
      txOpts,
    );
  }

  /**
   * Similar with [[autoTransfer]] but the seller is responsible to find out the asset is paid
   *
   * @param asset
   * @param to should be the address of chain database
   */
  async transfer(assetId, to: string, password?: string, toBoxPubKey?: string) {
    return this.txHelper.transfer(assetId, to, password, toBoxPubKey);
  }
}
