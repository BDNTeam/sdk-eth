import crypto from "crypto";

export class Crypto {
  static algorithm = "aes-256-ctr";

  static encrypt(data: string | Buffer, password: string) {
    if (typeof data === "string") data = Buffer.from(data, "utf8");

    const enc = crypto.createCipher(this.algorithm, password);
    return Buffer.concat([enc.update(data), enc.final()]);
  }

  static decrypt(data: string | Buffer, password: string) {
    if (typeof data === "string") data = Buffer.from(data, "base64");

    const dec = crypto.createDecipher(this.algorithm, password);
    return Buffer.concat([dec.update(data), dec.final()]);
  }
}
