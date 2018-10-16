import debug from "debug";
import Web3 from "web3";
import Contract from "web3/eth/contract";
import { Api } from "./api";
import cfg from "./config";
import { ContractFactory } from "./contract-factory";
import { Web3Helper } from "./web3";

const log = debug("CDB-SDK:market");

/**
 * Helper to do marking
 */
export class MarketHelper {
  bdn: Contract;
  market: Contract;

  web3Helper: Web3Helper;

  async init(web3Helper: Web3Helper, txOpts: any = {}) {
    const marketAddr = await Api.getMarketAddr();
    const bdnAddr = await Api.getBdnAddr();

    this.web3Helper = web3Helper;

    ContractFactory.setWeb3(web3Helper.web3);
    this.bdn = await ContractFactory.createInst("BDNToken", bdnAddr, txOpts);
    this.bdn.options.from = web3Helper.web3.eth.defaultAccount;

    this.market = await ContractFactory.createInst("Market", marketAddr, txOpts);
    this.market.options.from = web3Helper.web3.eth.defaultAccount;
  }

  async getAssetContract(addr: string, txOpts = {}) {
    return ContractFactory.createInst("Asset", addr, txOpts);
  }

  async sell(cdbAddress: string, boxAddress: string, asset: string, price: number, txOpts = {}) {
    this.web3Helper.ensureAccountIsReady();

    const opts = { ...cfg.eth.txOpts, ...txOpts };
    const c = this.market as any;
    return new Promise<string>((resolve, reject) => {
      c.once("NewAsset", { filter: { asset } }, (err, evt) => {
        if (err) {
          reject(err);
          return;
        }
        return resolve(evt.returnValues.mktId);
      });
      this.market.methods.sell(cdbAddress, boxAddress, asset, price).send(opts);
    });
  }

  async approve(spender: string, amount: number, txOpts = {}) {
    this.web3Helper.ensureAccountIsReady();

    const opts = { ...cfg.eth.txOpts, ...txOpts };
    const b = this.bdn as any;
    return new Promise((resolve, reject) => {
      b.once(
        "Approval",
        {
          filter: {
            _owner: this.web3Helper.web3.eth.defaultAccount,
            _spender: spender,
          },
        },
        (err, evt) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        },
      );
      this.bdn.methods.approve(spender, amount).send(opts);
    });
  }

  async increaseApproval(spender: string, amount: number, txOpts = {}) {
    this.web3Helper.ensureAccountIsReady();

    const opts = { ...cfg.eth.txOpts, ...txOpts };
    const b = this.bdn as any;
    return new Promise((resolve, reject) => {
      b.once(
        "Approval",
        {
          filter: {
            _owner: this.web3Helper.web3.eth.defaultAccount,
            _spender: spender,
          },
        },
        (err, evt) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        },
      );
      this.bdn.methods.increaseApproval(spender, amount).send(opts);
    });
  }

  async autoApprove(spender: string, amount: number, txOpts = {}) {
    this.web3Helper.ensureAccountIsReady();

    const opts = { ...cfg.eth.txOpts, ...txOpts };
    const allowance = await this.bdn.methods
      .allowance(this.web3Helper.web3.eth.defaultAccount, spender)
      .call(opts);

    if (allowance === 0) {
      await this.approve(spender, amount, txOpts);
    } else {
      await this.increaseApproval(spender, amount, txOpts);
    }
  }

  async listenAssetPaid(
    mktId: string,
    cb: (
      err,
      info: { asset: string; buyer: string; buyerCdbAddress: string; buyerBoxAddress: string },
    ) => void,
    txOpts = {},
  ) {
    const opts = { ...cfg.eth.txOpts, ...txOpts };
    const asset = await this.getAssetContract(mktId, opts);
    asset.options.from = this.web3Helper.web3.eth.defaultAccount;
    const a = asset as any;

    a.once("Paid", null, (err, evt) => {
      cb(err, evt.returnValues);
    });
  }

  async isAssetBuyable(mktId: string, txOpts = {}) {
    const opts = { ...cfg.eth.txOpts, ...txOpts };
    const asset = await this.getAssetContract(mktId, opts);
    asset.options.from = this.web3Helper.web3.eth.defaultAccount;
    return asset.methods.isBuyable().call(opts);
  }

  async balanceOf(address: string, txOpts = {}) {
    const opts = { ...cfg.eth.txOpts, ...txOpts };
    return this.bdn.methods.balanceOf(address).call(opts);
  }

  async buy(
    mktId: string,
    buyerCdbAddress: string,
    buyerBoxAddress: string,
    price: number,
    txOpts = {},
  ) {
    const isBuyable = await this.isAssetBuyable(mktId);
    if (!isBuyable) throw new Error("asset is not buyable");

    const balance = await this.balanceOf(this.web3Helper.web3.eth.defaultAccount);
    if (balance < price) throw new Error("no sufficient balance");

    const opts = { ...cfg.eth.txOpts, ...txOpts };
    await this.autoApprove(mktId, price, opts);
    const asset = await this.getAssetContract(mktId, opts);
    asset.options.from = this.web3Helper.web3.eth.defaultAccount;

    const a = asset as any;
    return new Promise<any>((resolve, reject) => {
      a.once("Paid", null, (err, evt) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(evt.returnValues);
      });
      asset.methods
        .buy(buyerCdbAddress, buyerBoxAddress, price)
        .send(opts)
        .catch(e => {
          e.message = "fail to buy: " + e.message;
          reject(e);
        });
    });
  }

  async deal(mktId: string, txOpts = {}) {
    const opts = { ...cfg.eth.txOpts, ...txOpts };
    const asset = await this.getAssetContract(mktId, opts);
    asset.options.from = this.web3Helper.web3.eth.defaultAccount;

    const a = asset as any;
    return new Promise<any>((resolve, reject) => {
      a.once("Dealt", null, (err, evt) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(evt.returnValues);
      });
      asset.methods.deal().send(opts);
    });
  }
}
