const { accountPool, parseTokens, drain, useApproval, hoursToSeconds } = require("./_tools.js");
const { ethers } = require("ethers");

const { usdcAddress } = require("./_constants");

const IERC20Approvable = artifacts.require("IERC20Approvable");
const IDelegator = artifacts.require("IDelegator");
const IERC20 = artifacts.require("IERC20");
const Tesla = artifacts.require("Tesla");

contract(`Test $TESLA contract`, async (accounts) => {
  const pool = accountPool(accounts);

  let setup = false;

  let delegator;
  let tesla;
  let stsla;
  let usdc;

  async function setupCoreProtocol() {
    if (setup) return;
    setup = true;

    tesla = await Tesla.new();
    delegator = await IDelegator.at("0x15fd6e554874b9e70f832ed37f231ac5e142362f");
    stsla = await IERC20.at("0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D");
    usdc = await IERC20Approvable.at(usdcAddress);
  }

  beforeEach(async () => {
    await setupCoreProtocol();
  });

  pool("Should successfully swap USDC to sTSLA", async (account, _) => {
    const baseAmount = 10000;
    const amount = parseTokens(baseAmount, 6);
    await drain(usdc, "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8", account, amount);

    const deadline = Math.round(new Date().getTime() / 1000 + hoursToSeconds(48));

    const signature = await new Promise(async (resolve) => {
      web3.currentProvider.send(
        {
          method: "eth_signTypedData",
          params: [
            accounts[0],
            {
              types: {
                EIP712Domain: [
                  {
                    name: "name",
                    type: "string",
                  },
                  {
                    name: "version",
                    type: "string",
                  },
                  {
                    name: "chainId",
                    type: "uint256",
                  },
                  {
                    name: "verifyingContract",
                    type: "address",
                  },
                ],
                Permit: [
                  {
                    name: "owner",
                    type: "address",
                  },
                  {
                    name: "spender",
                    type: "address",
                  },
                  {
                    name: "value",
                    type: "uint256",
                  },
                  {
                    name: "nonce",
                    type: "uint256",
                  },
                  {
                    name: "deadline",
                    type: "uint256",
                  },
                ],
              },
              domain: {
                version: "2",
                name: "USD Coin",
                chainId: 1,
                verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              },
              primaryType: "Permit",
              message: {
                owner: accounts[0],
                spender: tesla.address,
                value: amount,
                nonce: await usdc.nonces(accounts[0]),
                deadline,
              },
            },
          ],
          from: accounts[0],
        },
        (e, { result }) => {
          resolve(result);
        }
      );
    });

    const signatureArr = signature.match(/.{1,2}/g);
    const R_HEX = signatureArr.slice(1, 33);
    const S_HEX = signatureArr.slice(33, 65);
    const V_HEX = signatureArr.slice(65, 66);

    const R_HEX_JOINED = "0x" + R_HEX.join("");
    const S_HEX_JOINED = "0x" + S_HEX.join("");
    const V_HEX_JOINED = "0x" + V_HEX.join("");

    console.log("");
    console.log("Signed USDC spending permit");
    console.log("R signed bytes32: " + R_HEX_JOINED);
    console.log("S signed bytes32: " + S_HEX_JOINED);
    console.log("V signed uint8: " + V_HEX_JOINED);
    console.log("");

    console.log("Approving exchange delegation...");
    await delegator.approveExchangeOnBehalf(tesla.address);
    console.log("Approved!");
    console.log("");

    console.log(`Exchanging ${baseAmount} USDC for sTSLA...`);
    await tesla.exchange(
      amount,
      await tesla.marketClosed(),
      deadline,
      parseInt(V_HEX_JOINED),
      R_HEX_JOINED,
      S_HEX_JOINED
    );
    console.log("Done!");
    console.log("");

    const balance = await stsla.balanceOf(account);
    assert.notEqual(0, parseInt(balance));
    console.log(
      "Final $sTSLA Balance: " +
        Math.round((parseFloat(ethers.utils.formatEther(parseInt(balance).toString())) + Number.EPSILON) * 100) / 100
    );
  });

  pool("Should return valid amounts for swap amounts", async (_, __) => {
    const amount = parseTokens(20000);

    assert.notEqual(0, parseInt(await tesla.balancerOut(amount)));
    assert.notEqual(0, parseInt(await tesla.syntheticsOut(amount)));
  });
});
