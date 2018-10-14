import cfg from "./config";
import axios from "axios";

const abiCache: { [k: string]: any } = {};

export class Api {
  static async buildUrl(path: string) {
    const srvAddr = cfg.base.sdkServer;
    return srvAddr + path;
  }

  static async getAbi(name: string) {
    const c = abiCache[name];
    if (c) return c;

    const u = await this.buildUrl("/contract/getAbi");
    const resp = await axios.get(u, { params: { name } });
    const data = resp.data;
    if (data.code === 0) {
      abiCache[name] = data.data;
      return data.data;
    }
    throw new Error("response error: " + data.msg);
  }

  static async getMarketAddr() {
    const u = await this.buildUrl("/contract/getMarketAddr");
    const resp = await axios.get(u);
    const data = resp.data;
    if (data.code === 0) {
      return data.data;
    }
    throw new Error("response error: " + data.msg);
  }

  static async getBdnAddr() {
    const u = await this.buildUrl("/contract/getBdnAddr");
    const resp = await axios.get(u);
    const data = resp.data;
    if (data.code === 0) {
      return data.data;
    }
    throw new Error("response error: " + data.msg);
  }
}
