// tslint:disable:no-console

import { Seller, SellerOpts, Buyer, BuyerOpts } from "../src";

(async () => {
  // create and push your asset onto chain database
  const API_PATH = "http://104.238.140.52:9984/api/v1/";

  // asset to be sold
  const asset = { city: "Berlin, DE", temperature: 22, dateTime: new Date().toString() };
  const meta = { what: "My first BigchainDB transaction" };

  // publish the asset into chain database
  const sellerOpts: SellerOpts = {
    dbNode: API_PATH,
    privateKey: "0x92ee15949f64413e3d4b86fb941497d0696ecd189d002091f6746444c8aae460",
  };
  const seller = new Seller(sellerOpts);
  await seller.init();

  const tx = await seller.createAsset(asset, meta);
  console.log(tx);

  // mark the published asset as sellable
  const mktId = await seller.sell(tx, 1);
  console.log(mktId);

  // someone buy the asset
  const buyerOpts: BuyerOpts = {
    dbNode: API_PATH,
    privateKey: "0xf589d1f3df593ebb5d8870cb9689717f548d907948e0aa43bdc59ab90c7b35fc",
  };
  const buyer = new Buyer(buyerOpts);
  await buyer.init();

  const resp = await buyer.buy(mktId, 1);
  console.log(resp);

  // buyer should mark the asset as dealt if the asset is pass the validation by himself
  const deal = await buyer.deal(mktId);
  console.log(deal);
})();
