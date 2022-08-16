// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/*
 * @title Locker - used for lock tokens on main chain.
 *
 */
contract Locker {
	using SafeERC20 for IERC20;

	IERC20 public midas;

	event Locked(address from, address to, uint256 amount);

	constructor(IERC20 _midasToken) {
		require(address(_midasToken) != address(0), "Locker: constructor zero token");

		midas = _midasToken;
	}

	function lock() external {
		uint256 accountBalance = midas.balanceOf(msg.sender);
		midas.safeTransferFrom(msg.sender, address(this), accountBalance);
		emit Locked(msg.sender, msg.sender, accountBalance);
	}

	// @dev Use this function for CA.
	function lockFor(address _account) external {
		require(_account != address(0), "Locker: zero address");

		uint256 accountBalance = midas.balanceOf(msg.sender);
		midas.safeTransferFrom(msg.sender, address(this), accountBalance);
		emit Locked(msg.sender, _account, accountBalance);
	}
}
