import Web3 from "web3";
import { Api } from "./api";
import cfg from "./config";

export class ContractFactory {
  static web3: Web3;

  static setWeb3(web3: Web3) {
    this.web3 = web3;
    return this;
  }

  static async createInst(name: string, addr: string, txOpts = {}) {
    const abi = await Api.getAbi(name);
    const opts = { ...cfg.eth.txOpts, ...txOpts };
    return new this.web3.eth.Contract(abi, addr, opts);
  }
}
