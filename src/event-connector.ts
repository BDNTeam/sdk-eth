import { Web3Helper } from "./web3";

// tslint:disable-next-line:no-var-requires
const abiDecoder = require("abi-decoder");

// tslint:disable-next-line:no-var-requires
const abi = require("/Users/siyuanhsiao/workspace/Work/sdk-eth-connector/build/contracts/BDNToken.json")
  .abi;

abiDecoder.addABI(abi);

(async () => {
  const h = new Web3Helper();
  await h.init();

  h.web3.eth.subscribe(
    "logs",
    { address: "0xc34eaaf652bd3c72b1e1ec55a7be1e08c929e346" },
    (err, res) => {
      h.web3.eth.abi.decodeLog()
      const dec = abiDecoder.decodeLogs([res]);
      console.log(dec);
    },
  );
})();
