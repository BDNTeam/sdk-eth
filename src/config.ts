import fs from "fs";
import ini from "ini";
import objectPath from "object-path";
import os from "os";
import path from "path";
import util from "util";

const exists = util.promisify(fs.exists);
const read = util.promisify(fs.readFile);
const write = util.promisify(fs.writeFile);
const copy = util.promisify(fs.copyFile);

const defaultCfgPath = path.resolve(__dirname, "./config.ini");
const cfgPath = path.join(os.homedir(), ".chain-db-sdk-eth.ini");
const abiDir = path.resolve(__dirname, "contract/");

export class Config {
  static inst: Config | null = null;

  data: any;

  constructor(data: any) {
    this.data = data;
  }

  static async singleton() {
    if (this.inst === null) {
      await this.copy2home();
      const raw = await read(cfgPath, { encoding: "utf8" });
      const data = ini.parse(raw);
      this.inst = new Config(data);
    }
    return this.inst;
  }

  static async copy2home() {
    const ok = await exists(cfgPath);
    if (!ok) {
      await copy(defaultCfgPath, cfgPath);
    }
  }

  get<T>(keyPath: string) {
    return objectPath.get<T, T>(this.data, keyPath);
  }

  async set(keyPath: string, v: any) {
    objectPath.set(this.data, keyPath, v);
    await this.save();
  }

  async save() {
    await write(cfgPath, ini.stringify(this.data));
  }

  gasOpts(force = {}) {
    const gas = parseInt(this.data.base.gas, 10);
    const gasPrice = this.data.base.gasPrice;
    const c = { gas, gasPrice };
    return {
      ...c,
      ...force
    };
  }
}
