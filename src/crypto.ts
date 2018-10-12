import Crypto from "crypto-js";

const AES = Crypto.AES;

export class CryptoHelper {
  static algorithm = "aes-256-ctr";

  static encrypt(data: any, password: string): string {
    data = JSON.stringify(data);
    return AES.encrypt(data, password).toString();
  }

  static decrypt(data: string, password: string): string {
    const dec = AES.decrypt(data, password).toString(Crypto.enc.Utf8);
    return JSON.parse(dec);
  }
}
