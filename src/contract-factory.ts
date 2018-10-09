import fs from "fs";
import util from "util";
import Web3 from "web3";
import { Config } from "./config";

const read = util.promisify(fs.readFile);

export class ContractFactory {
  web3: Web3;

  constructor() {
    this.web3 = new Web3();
  }

  async getAbi(name: string) {
    const cfg = await Config.singleton();
    const built = await read(cfg.abiPath(name), { encoding: "utf8" });
    const raw = JSON.parse(built);
    return raw.abi;
  }

  async createInst(name: string, addr: string, gasOpts = {}) {
    const abi = await this.getAbi(name);
    const cfg = await Config.singleton();
    gasOpts = cfg.gasOpts(gasOpts);
    return new this.web3.eth.Contract(abi, addr, gasOpts);
  }
}
