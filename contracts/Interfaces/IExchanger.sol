// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IExchanger {
  function exchange(
    bytes32 sourceCurrencyKey,
    uint256 sourceAmount,
    bytes32 destinationCurrencyKey
  ) external returns (uint256 amountReceived);

  function exchangeOnBehalf(
    address exchangeForAddress,
    bytes32 sourceCurrencyKey,
    uint256 sourceAmount,
    bytes32 destinationCurrencyKey
  ) external returns (uint256 amountReceived);
}
