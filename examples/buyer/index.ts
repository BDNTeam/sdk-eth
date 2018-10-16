// tslint:disable:no-console

import { Buyer, BuyerOpts } from "../../src";

(async () => {
  const API_PATH = "http://104.238.140.52:9984/api/v1/";
  const WS_PATH = "ws://104.238.140.52:9985/api/v1/streams/valid_transactions";

  // a buyer
  const buyerOpts: BuyerOpts = {
    dbNode: API_PATH,
    dbWsNode: WS_PATH,
    privateKey: "0xf589d1f3df593ebb5d8870cb9689717f548d907948e0aa43bdc59ab90c7b35fc",
  };
  const buyer = new Buyer(buyerOpts);
  await buyer.init();

  // mark the published asset as sellable
  const assetId = "";
  const mktId = "";
  const sellerBoxAddress = "";

  // ===================================
  // buyer buys the asset
  const resp = await buyer.buy(mktId, 1);
  console.log("--------");
  console.log("buy resp: ");
  console.log(resp);

  // ===================================
  // buyer get the asset and decrypt it
  const buyerReceived = await buyer.receiveAsset(assetId, sellerBoxAddress);
  console.log("--------");
  console.log("buyerReceived: ");
  console.log(buyerReceived);

  // ===================================
  // buyer should mark the asset as dealt if the asset is pass the validation by himself
  const dealt = await buyer.deal(mktId);
  console.log("--------");
  console.log("dealt: ");
  console.log(dealt);
})();
