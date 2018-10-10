import debug from "debug";
import Web3 from "web3";
import Contract from "web3/eth/contract";
import { Api } from "./api";
import cfg from "./config";
import { ContractFactory } from "./contract-factory";
import { Web3Helper } from "./web3";

const log = debug("CDB-SDK:market");

export class MarketHelper {
  bdn: Contract;
  market: Contract;

  web3Helper: Web3Helper;

  async init(web3Helper: Web3Helper, txOpts = {}) {
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

  async sell(asset: string, price: number, txOpts = {}) {
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
      this.market.methods.sell(asset, price).send(opts);
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

    const allowance = await this.bdn.methods
      .allowance(this.web3Helper.web3.eth.defaultAccount, spender)
      .call();

    if (allowance === 0) {
      await this.approve(spender, amount, txOpts);
    } else {
      await this.increaseApproval(spender, amount, txOpts);
    }
  }

  async buy(mktId: string, price: number, txOpts = {}) {
    await this.autoApprove(mktId, price, txOpts);
    const asset = await this.getAssetContract(mktId, txOpts);
    asset.options.from = this.web3Helper.web3.eth.defaultAccount;

    const a = asset as any;
    return new Promise<any>((resolve, reject) => {
      a.once(
        "NewBuyer",
        { filter: { mktId, buyer: this.web3Helper.web3.eth.defaultAccount } },
        (err, evt) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(evt.returnValues);
        },
      );
      asset.methods
        .buy(price)
        .send()
        .catch(e => {
          e.message = "fail to buy: " + e.message;
          throw e;
        });
    });
  }

  async deal(mktId: string, txOpts = {}) {
    const asset = await this.getAssetContract(mktId, txOpts);
    asset.options.from = this.web3Helper.web3.eth.defaultAccount;

    const a = asset as any;
    return new Promise<any>((resolve, reject) => {
      a.once(
        "NewDeal",
        { filter: { mktId, operator: this.web3Helper.web3.eth.defaultAccount } },
        (err, evt) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(evt.returnValues);
        },
      );
      asset.methods.deal().send();
    });
  }
}
