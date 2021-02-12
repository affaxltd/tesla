// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

// External imports
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Context} from "@openzeppelin/contracts/GSN/Context.sol";

// Internal imports
import {IERC20Approvable} from "../Interfaces/IERC20Approvable.sol";
import {IExchangeRates} from "../Interfaces/IExchangeRates.sol";
import {IBalancerPool} from "../Interfaces/IBalancerPool.sol";
import {ISystemStatus} from "../Interfaces/ISystemStatus.sol";
import {IExchanger} from "../Interfaces/IExchanger.sol";
import {ICurve} from "../Interfaces/ICurve.sol";

/**
 * ▄▄▄▄▄▄▄▄ ..▄▄ · ▄▄▌   ▄▄▄·
 * •██  ▀▄.▀·▐█ ▀. ██•  ▐█ ▀█
 *  ▐█.▪▐▀▀▪▄▄▀▀▀█▄██▪  ▄█▀▀█
 *  ▐█▌·▐█▄▄▌▐█▄▪▐█▐█▌▐▌▐█ ▪▐▌
 *  ▀▀▀  ▀▀▀  ▀▀▀▀ .▀▀▀  ▀  ▀
 */

/// @title Tesla Swap Contract
/// @author Affax
/// @dev Main contract for USDC -> sTSLA swap
/// In Code We Trust.
contract Tesla is Context {
  using SafeERC20 for IERC20Approvable;
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  // External
  IExchangeRates public constant ExchangeRates = IExchangeRates(0xd69b189020EF614796578AfE4d10378c5e7e1138);
  IBalancerPool public constant BalancerPool = IBalancerPool(0x055dB9AFF4311788264798356bbF3a733AE181c6);
  ISystemStatus public constant SystemStatus = ISystemStatus(0x1c86B3CDF2a60Ae3a574f7f71d44E2C50BDdB87E);
  IExchanger public constant Exchanger = IExchanger(0x97767D7D04Fd0dB0A1a2478DCd4BA85290556B48);
  ICurve public constant Curve = ICurve(0xA5407eAE9Ba41422680e2e00537571bcC53efBfD);

  // Tokens
  IERC20Approvable public constant USDC = IERC20Approvable(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
  IERC20 public constant sUSD = IERC20(0x57Ab1ec28D129707052df4dF418D58a2D46d5f51);
  IERC20 public constant sTSLA = IERC20(0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D);

  // Synthetix asset keys
  bytes32 public constant sTSLAKey = bytes32(0x7354534c41000000000000000000000000000000000000000000000000000000);
  bytes32 public constant sUSDKey = bytes32(0x7355534400000000000000000000000000000000000000000000000000000000);

  receive() external payable {}

  constructor() public {
    USDC.safeApprove(address(Curve), uint256(-1));
    sUSD.safeApprove(address(BalancerPool), uint256(-1));
  }

  function exchange(
    uint256 _sourceAmount,
    bool _balancer,
    uint256 _deadline,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
  ) external returns (uint256 amountReceived) {
    USDC.permit(_msgSender(), address(this), _sourceAmount, _deadline, _v, _r, _s);

    // Transfer in USDC
    USDC.safeTransferFrom(_msgSender(), address(this), _sourceAmount);

    // Exchange USDC to sUSD on Curve
    Curve.exchange(
      1, // USDC
      3, // sUSD
      _sourceAmount,
      0
    );

    uint256 exchangedAmount = sUSD.balanceOf(address(this));

    if (exchangedAmount == 0) return 0;

    if (_balancer) {
      // Swap sUSD for sTSLA on Balancer
      (amountReceived, ) = BalancerPool.swapExactAmountIn(
        address(sUSD),
        exchangedAmount,
        address(sTSLA),
        0,
        uint256(-1)
      );

      sTSLA.safeTransfer(_msgSender(), sTSLA.balanceOf(address(this)));
    } else {
      // Swap sUSD for sTSLA on Synthetix exchange
      sUSD.safeTransfer(_msgSender(), exchangedAmount);
      amountReceived = Exchanger.exchangeOnBehalf(_msgSender(), sUSDKey, exchangedAmount, sTSLAKey);
    }
  }

  function marketClosed() public view returns (bool closed) {
    (closed, ) = SystemStatus.synthExchangeSuspension(sTSLAKey);
  }

  function balancerOut(uint256 _amountIn) public view returns (uint256 amount) {
    uint256 sUSDAmount = BalancerPool.getBalance(address(sUSD));
    uint256 sTSLAAmount = BalancerPool.getBalance(address(sTSLA));
    uint256 sUSDWeight = BalancerPool.getDenormalizedWeight(address(sUSD));
    uint256 sTSLAWeight = BalancerPool.getDenormalizedWeight(address(sTSLA));
    uint256 fee = BalancerPool.getSwapFee();

    amount = BalancerPool.calcOutGivenIn(sUSDAmount, sUSDWeight, sTSLAAmount, sTSLAWeight, _amountIn, fee);
  }

  function syntheticsOut(uint256 _amountIn) public view returns (uint256 amount) {
    bytes32[] memory keys = new bytes32[](2);
    keys[0] = sUSDKey;
    keys[1] = sTSLAKey;

    uint256[] memory rates = ExchangeRates.ratesForCurrencies(keys);
    return _amountIn.mul(rates[0]).div(rates[1]);
  }
}
