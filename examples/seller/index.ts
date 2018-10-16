// tslint:disable:no-console

import { Seller, SellerOpts } from "../../src";

(async () => {
  const API_PATH = "http://104.238.140.52:9984/api/v1/";
  const WS_PATH = "ws://104.238.140.52:9985/api/v1/streams/valid_transactions";

  // a seller
  const sellerOpts: SellerOpts = {
    dbNode: API_PATH,
    dbWsNode: WS_PATH,
    privateKey: "0x92ee15949f64413e3d4b86fb941497d0696ecd189d002091f6746444c8aae460",
  };
  const seller = new Seller(sellerOpts);
  await seller.init();

  // ==================================
  // seller creates and push one of his assets into chain database
  //
  // the asset to be sold
  const asset = { city: "Berlin, DE", temperature: 22, dateTime: new Date().toString() };
  // it's better for seller to add his contract info into metadata
  const meta = { what: "My first BigchainDB transaction", contact: "seller@example.com" };
  const pwd = "123456";

  const assetId = await seller.createAsset(asset, meta, pwd);
  console.log("--------");
  console.log("seller's asset id: ");
  console.log(assetId);

  // mark the published asset as sellable
  const mktId = await seller.sell(assetId, 1);
  console.log("--------");
  console.log("mktId: " + mktId);

  // seller could choose either the automatic or manual way to transfer his asset
  //
  // the automatic transfer process should be run as a daemon, once it
  // receives the payment notification it will do the transfer.
  // in other words if this code is ran in a browser tab, the tab should not be closed until
  // the payment notification is received
  //
  // the manual way is shown on below comment
  seller.autoTransfer(
    mktId,
    async (err, paidInfo, tx) => {
      // tx is the transfer transaction happens in chain database
      // paidInfo is coming from payment notification
      if (err) {
        console.error(err);
        return;
      }
      console.log("--------");
      console.log("auto transfer succeed:");
      console.log(tx);
      console.log(paidInfo);
    },
    pwd,
  );
})();
