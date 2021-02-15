const { mainArgs, testArgs } = require("../lib/args");

const Tesla = artifacts.require("Tesla");

module.exports = async function (deployer) {
  const args = process.argv;
  const isTestnet = args.join(" ").includes("kovan");

  await deployer.deploy(Tesla, ...(isTestnet ? testArgs : mainArgs));
};
