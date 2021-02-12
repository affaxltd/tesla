const Tesla = artifacts.require("Tesla");

module.exports = async function (deployer) {
  await deployer.deploy(Tesla);
};
