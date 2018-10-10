export default {
  base: {
    sdkServer: "http://127.0.0.1:3000",
  },
  eth: {
    metaMask: false,
    node: "ws://127.0.0.1:8545",
    txOpts: {
      gas: 6700000,
      gasPrice: "2300000000",
    },
  },
};
