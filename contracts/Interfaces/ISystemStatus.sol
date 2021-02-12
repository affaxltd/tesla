// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface ISystemStatus {
  function synthExchangeSuspension(bytes32 input) external view returns (bool suspended, uint248 reason);
}
