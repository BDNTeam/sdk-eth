// tslint:disable:no-console

import { Seller, SellerOpts, Buyer, BuyerOpts } from "../../src";

(async () => {
  const API_PATH = "http://104.238.140.52:9984/api/v1/";

  // a seller
  const sellerOpts: SellerOpts = {
    dbNode: API_PATH,
    privateKey: "0x92ee15949f64413e3d4b86fb941497d0696ecd189d002091f6746444c8aae460",
  };
  const seller = new Seller(sellerOpts);
  await seller.init();

  // a buyer
  const buyerOpts: BuyerOpts = {
    dbNode: API_PATH,
    privateKey: "0xf589d1f3df593ebb5d8870cb9689717f548d907948e0aa43bdc59ab90c7b35fc",
  };
  const buyer = new Buyer(buyerOpts);
  await buyer.init();

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

      // ===================================
      // buyer get the asset and decrypt it
      const buyerReceived = await buyer.receiveAsset(assetId, paidInfo.sellerBoxAddress, true);
      console.log("--------");
      console.log("buyerReceived: ");
      console.log(buyerReceived);

      // ===================================
      // buyer should mark the asset as dealt if the asset is pass the validation by himself
      const dealt = await buyer.deal(mktId);
      console.log("--------");
      console.log("dealt: ");
      console.log(dealt);
    },
    pwd,
  );

  // ===================================
  // buyer buys the asset
  const resp = await buyer.buy(mktId, 1);
  console.log("--------");
  console.log("buy resp: ");
  console.log(resp);

  // ===================================
  // above code shows the seller uses an automatic transfer way
  // the manual way is like below
  //
  // const transferredTx = await seller.transfer(
  //   assetId,
  //   buyer.txHelper.keyPair.signPublicKey.toString(),
  //   pwd,
  //   buyer.txHelper.keyPair.boxPublicKey.toString(),
  // );
  // console.log("--------");
  // console.log("transferred tx: ");
  // console.log(transferredTx);
})();
