import fs from "fs";
import util from "util";
import Web3 from "web3";
import config from "./config";

const read = util.promisify(fs.readFile);

const isBrowser = typeof window !== "undefined";

let isWindowLoaded = false;
if (isBrowser) {
  window.addEventListener("load", () => {
    isWindowLoaded = true;
  });
}

const getInstalledWeb3 = async () => {
  if (!isBrowser) return null;

  const w = window as any;
  if (isWindowLoaded) return w.web3;
  return new Promise(resolve => {
    window.addEventListener("load", () => {
      isWindowLoaded = true;
      resolve(w.web3);
    });
  });
};

export class MetaMaskNotInstalledErr extends Error {}

export interface InitWeb3Params {
  metaMask?: boolean;
  node?: string;
}

export class Web3Helper {
  web3: Web3;

  async init(
    params: InitWeb3Params = {
      metaMask: config.eth.metaMask,
      node: config.eth.node,
    },
  ) {
    if (params.metaMask) {
      const web3 = await getInstalledWeb3();
      if (!web3 || !web3.currentProvider.isMetaMask) throw new MetaMaskNotInstalledErr();
      this.web3 = new Web3(web3.currentProvider);
    } else if (params.node) {
      this.web3 = new Web3(new Web3.providers.WebsocketProvider(params.node));
    } else {
      throw new Error("invalid params to get web3");
    }
  }

  async openWallet(walletPath: string, password: string) {
    let data = await read(walletPath, { encoding: "utf8" });
    data = JSON.parse(data);
    const w = this.web3!.eth.accounts.wallet as any;
    w.decrypt(data, password);
  }

  addAccountFromPrivateKey(key: string) {
    const a = this.web3!.eth.accounts.privateKeyToAccount(key);
    this.web3!.eth.defaultAccount = a.address;
    this.web3!.eth.accounts.wallet.add(a);
  }

  ensureAccountIsReady() {
    const w = this.web3!.eth.accounts.wallet as any;
    if (w.length === 0) {
      throw new Error("no account, please import one or open a wallet");
    }
  }
}
