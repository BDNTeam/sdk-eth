import cfg from "./config";
import axios from "axios";

const abiCache: { [k: string]: any } = {};

/**
 * Call some server api
 */
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

  /**
   * Some configuration items would be changed in the future
   * hard code them into SDK causes SDK user to upgrade SDK
   * if they are changed so these configuration item are stored
   * at server, using server api to retrieve them
   */
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
