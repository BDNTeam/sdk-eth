import { Config } from "./config";
import axios from "axios";
import url from "url";

export class Api {
  static async buildUrl(path: string) {
    const cfg = await Config.singleton();
    const srvAddr = cfg.get<string>("base.sdkServer");
    return url.resolve(srvAddr, path);
  }

  static async getAbi(name: string) {
    const u = await this.buildUrl("/abi/get");
    const resp = await axios.get(u, { params: { name } });
    const data = resp.data;
    if (data.code === 0) return data.data;
    throw new Error("response error: " + data.msg);
  }
}
