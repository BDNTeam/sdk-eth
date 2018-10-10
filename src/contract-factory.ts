import fs from "fs";
import util from "util";
import Web3 from "web3";
import { Api } from "./api";
import { Config } from "./config";

export class ContractFactory {
  web3: Web3;

  constructor() {
    this.web3 = new Web3();
  }

  async createInst(name: string, addr: string, gasOpts = {}) {
    const abi = await Api.getAbi(name);
    const cfg = await Config.singleton();
    gasOpts = cfg.gasOpts(gasOpts);
    return new this.web3.eth.Contract(abi.data, addr, gasOpts);
  }
}
