import { TransactionHelper, dbDriver } from "./transaction";

(async () => {
  const API_PATH = "http://104.238.140.52:9984/api/v1/";

  const alice = new dbDriver.Ed25519Keypair();
  const helper = new TransactionHelper(API_PATH, alice);

  const asset = { city: "Berlin, DE", temperature: 22, datetime: new Date().toString() };
  const meta = { what: "My first BigchainDB transaction" };

  const tx = await helper.createTransaction(asset, meta);
  console.log(tx);
})();
