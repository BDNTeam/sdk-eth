// tslint:disable:no-console

import { TransactionHelper, dbDriver } from "./transaction";
import { MarketHelper } from "./market";
import { Web3Helper } from "./web3";

(async () => {
  // create and push your asset onto chain database
  const API_PATH = "http://104.238.140.52:9984/api/v1/";

  const alice = new dbDriver.Ed25519Keypair();
  const helper = new TransactionHelper(API_PATH, alice);

  const asset = { city: "Berlin, DE", temperature: 22, dateTime: new Date().toString() };
  const meta = { what: "My first BigchainDB transaction" };

  const tx = await helper.createTransaction(asset, meta);
  console.log(tx);

  // mark your asset as sellable
  const sellerWeb3Helper = new Web3Helper();
  await sellerWeb3Helper.init();
  sellerWeb3Helper.addAccountFromPrivateKey(
    "0x92ee15949f64413e3d4b86fb941497d0696ecd189d002091f6746444c8aae460",
  );

  const sellerMarketHelper = new MarketHelper();
  await sellerMarketHelper.init(sellerWeb3Helper);
  const mktId = await sellerMarketHelper.sell(tx.id, 1 * Math.pow(10, 6));
  console.log(mktId);

  // someone buy the asset
  const buyerWeb3Helper = new Web3Helper();
  await buyerWeb3Helper.init();
  buyerWeb3Helper.addAccountFromPrivateKey(
    "0xf589d1f3df593ebb5d8870cb9689717f548d907948e0aa43bdc59ab90c7b35fc",
  );

  const buyerMarketHelper = new MarketHelper();
  await buyerMarketHelper.init(buyerWeb3Helper);
  const resp = await buyerMarketHelper.buy(mktId, 1 * Math.pow(10, 6));
  console.log(resp);

  // buy should mark the asset as dealt if the asset is valid
  const deal = await buyerMarketHelper.deal(mktId);
  console.log(deal);
})();
