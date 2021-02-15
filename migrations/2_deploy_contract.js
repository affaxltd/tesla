const Tesla = artifacts.require("Tesla");

module.exports = async function (deployer) {
  const args = process.argv;
  const network = args[args.length - 1];
  const isTestnet = network.includes("kovan");

  const mainArgs = [
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
    "0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D",
    "0xd69b189020EF614796578AfE4d10378c5e7e1138",
    "0x055dB9AFF4311788264798356bbF3a733AE181c6",
    "0x0000000000000000000000000000000000000000",
    "0x1c86B3CDF2a60Ae3a574f7f71d44E2C50BDdB87E",
    "0x97767D7D04Fd0dB0A1a2478DCd4BA85290556B48",
    false,
  ];

  const testArgs = [
    "0x0509508dFFf482e166Bbc0e8fE5148f772c51c4C",
    "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
    "0xC811087cb1d3Ef5889C4A9DF4432494A309152Bb",
    "0xC9985cAc4a69588Da66F74E42845B784798fe5aB",
    "0x80B71a0663Bb8B983B1c17fE458c22534318b13c",
    "0xBD8D9fD8ad0eBF54b970CF90dF39d3E4BF5F53c6",
    "0xcf8B3d452A56Dab495dF84905655047BC1Dc41Bc",
    "0x07aCC2B253218535c21a3E57BcB81eB13345a34A",
    true,
  ];

  await deployer.deploy(Tesla, ...(isTestnet ? testArgs : mainArgs));
};
