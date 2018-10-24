import Web3 from "web3";
import { Api } from "./api";
import cfg from "./config";

/**
 * Factory to construct smart contract instance
 */
export class ContractFactory {
  static web3: Web3;

  static setWeb3(web3: Web3) {
    this.web3 = web3;
    return this;
  }

  /**
   * Smart contracts will be updated in the future to provide
   * more useful functionalities, so their information like address
   * and ABI are stored at server.
   *
   * This strategy let SDK users does not need to update their
   * installed SDK when the contract's information is changed.
   *
   * @param name
   * @param addr
   * @param txOpts
   */
  static async createInst(name: string, addr: string, txOpts = {}) {
    const abi = await Api.getAbi(name);
    const opts = { ...cfg.eth.txOpts, ...txOpts };
    return new this.web3.eth.Contract(abi, addr, opts);
  }
}
