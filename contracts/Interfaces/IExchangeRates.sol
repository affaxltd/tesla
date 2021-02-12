// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IExchangeRates {
  function ratesForCurrencies(bytes32[] calldata currencyKeys) external view returns (uint256[] memory rates);
}
