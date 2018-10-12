import { CryptoHelper, dbDriver } from "../src";
import nacl from "tweetnacl";
import { TextEncoder, TextDecoder } from "text-encoding";
import base58 from "bs58";

test("crypto", () => {
  const pwd = "123";
  const plaintext = "hello";
  const enc = CryptoHelper.encrypt(plaintext, pwd);
  const dec = CryptoHelper.decrypt(enc, pwd);
  expect(dec).toEqual(plaintext);
});

test("pub key enc", () => {
  const msg = "123";

  const nonce = nacl.randomBytes(24);

  const alice = nacl.box.keyPair();
  const bob = nacl.box.keyPair();

  const u8enc = new TextEncoder();

  const enc = nacl.box(u8enc.encode(msg), nonce, bob.publicKey, alice.secretKey);
  const dec = nacl.box.open(enc, nonce, alice.publicKey, bob.secretKey);

  expect(new TextDecoder("utf8").decode(dec!)).toEqual(msg);
});
