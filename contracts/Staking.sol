// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./interfaces/IFungibleToken.sol";

// @title MasterChef - farming/staking contract.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once MIDAS is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract Staking is Ownable, Multicall {
	using SafeERC20 for IERC20;
	using SafeERC20 for IFungibleToken;

	// Info of each user.
	struct UserInfo {
		uint256 amount; // How many LP tokens the user has provided.
		uint256 rewardDebt; // Reward debt. See explanation below.
		//
		// We do some fancy math here. Basically, any point in time, the amount of MIDASes
		// entitled to a user but is pending to be distributed is:
		//
		//   pending reward = (user.amount * pool.accTokensPerShare) - user.rewardDebt
		//
		// Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
		//   1. The pool's `accTokensPerShare` (and `lastRewardBlock`) gets updated.
		//   2. User receives the pending reward sent to his/her address.
		//   3. User's `amount` gets updated.
		//   4. User's `rewardDebt` gets updated.
	}
	// Info of each pool.
	struct PoolInfo {
		IERC20 lpToken; // Address of LP token contract.
		uint256 lastRewardBlock; // Last block number that MIDASes distribution occurs.
		uint256 accTokensPerShare; // Accumulated MIDASes per share, times 1e12. See below.
	}
	// The MIDAS TOKEN!
	IFungibleToken public immutable midasToken;
	// Dev address.
	address public devaddr;
	// Dev fee percent reward.
	uint256 public devfee = 12;
	// MIDAS tokens created per block.
	uint256 public tokensPerBlock;
	// Bonus muliplier for early midasToken makers.
	uint256 public rewardMultiplier = 1;
	// Info of each pool.
	PoolInfo public poolInfo;
	// Info of each user that stakes LP tokens.
	mapping(address => UserInfo) public userInfo;
	// The block number when MIDAS mining starts.
	uint256 public startBlock;
	// Blocked LP for add func.
	mapping (address => bool) internal _uniqLPs;

	event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
	event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
	event EmergencyWithdraw(
		address indexed user,
		uint256 indexed pid,
		uint256 amount
	);

	constructor(
		IFungibleToken _midasToken,
		address _devaddr,
		uint256 _tokensPerBlock,
		uint256 _startBlock
	) {
		require(
			address(_midasToken) != address(0) &&
			_devaddr != address(0),
			"Master chef: constructor set"
		);

		midasToken = _midasToken;
		devaddr = _devaddr;
		tokensPerBlock = _tokensPerBlock;
		startBlock = _startBlock;

		// staking pool
		poolInfo = PoolInfo({
			lpToken: _midasToken,
			lastRewardBlock: startBlock,
			accTokensPerShare: 0
		});
	}

	/**
     * @dev Set tokens per block. Zero set disable mining.
     */
	function setTokensPerBlock(uint256 _amount) public onlyOwner {
		tokensPerBlock = _amount;
	}

	/**
     * @dev Set reward multiplier. Zero set disable mining.
     */
	function setRewardMultiplier(uint256 _multiplier) public onlyOwner {
		rewardMultiplier = _multiplier;
	}

	/**
     * @dev Return reward multiplier over the given _from to _to block.
     */
	function getMultiplier(uint256 _from, uint256 _to)
		public
		view
		returns (uint256 multiplier)
	{
		multiplier = (_to - _from) * rewardMultiplier;
	}

	/**
     * @dev View function to see pending MIDASes on frontend.
     */
	function pendingReward(address _user)
		external
		view
		returns (uint256 reward)
	{
		PoolInfo memory pool = poolInfo;
		UserInfo memory user = userInfo[_user];
		uint256 accTokensPerShare = pool.accTokensPerShare;
		uint256 lpSupply = pool.lpToken.balanceOf(address(this));
		if (block.number > pool.lastRewardBlock && lpSupply != 0) {
			uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
			uint256 tokenReward = multiplier * tokensPerBlock;
			accTokensPerShare = accTokensPerShare + (tokenReward * 1e12 / lpSupply);
		}
		reward = user.amount * accTokensPerShare / 1e12 - user.rewardDebt;
	}

	/**
     * @dev Update reward variables of the given pool to be up-to-date.
     */
	function updatePool() public {
		PoolInfo storage pool = poolInfo;
		if (block.number <= pool.lastRewardBlock) {
			return;
		}
		uint256 lpSupply = pool.lpToken.balanceOf(address(this));
		if (lpSupply == 0) {
			pool.lastRewardBlock = block.number;
			return;
		}
		uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
		uint256 tokenReward = multiplier * tokensPerBlock;
		if (tokenReward == 0) {
			return;
		}
		if (devaddr != address(0)) {
			midasToken.mint(devaddr, tokenReward * devfee / 100);
		}
		midasToken.mint(address(this), tokenReward);

		pool.accTokensPerShare = pool.accTokensPerShare + (tokenReward * 1e12 / lpSupply);
		pool.lastRewardBlock = block.number;
	}

	/**
     * @dev Deposit LP tokens to MasterChef for MIDAS allocation.
     */
	function deposit(uint256 _amount) public {
		PoolInfo storage pool = poolInfo;
		UserInfo storage user = userInfo[msg.sender];
		updatePool();
		if (user.amount > 0) {
			uint256 pending = (user.amount * pool.accTokensPerShare / 1e12) - user.rewardDebt;
			_safeTransfer(msg.sender, pending);
		}
		if (_amount != 0) {
			pool.lpToken.safeTransferFrom(
				address(msg.sender),
				address(this),
				_amount
			);
			user.amount = user.amount + _amount;
		}
		user.rewardDebt = user.amount * pool.accTokensPerShare / 1e12;
		emit Deposit(msg.sender, 0, _amount);
	}

	/**
     * @dev Withdraw LP tokens from MasterChef.
     */
	function withdraw(uint256 _amount) public {
		PoolInfo storage pool = poolInfo;
		UserInfo storage user = userInfo[msg.sender];
		require(user.amount >= _amount, "withdraw: not good");
		updatePool();
		uint256 pending = (user.amount * pool.accTokensPerShare / 1e12) - user.rewardDebt;
		if (pending > 0) {
			_safeTransfer(msg.sender, pending);
		}
		if (_amount > 0) {
			user.amount = user.amount - _amount;
			pool.lpToken.safeTransfer(address(msg.sender), _amount);
		}
		user.rewardDebt = user.amount * pool.accTokensPerShare / 1e12;
		emit Withdraw(msg.sender, 0, _amount);
	}

	/**
     * @dev Withdraw without caring about rewards. EMERGENCY ONLY.
     */
	function emergencyWithdraw() public {
		PoolInfo storage pool = poolInfo;
		UserInfo storage user = userInfo[msg.sender];
		pool.lpToken.safeTransfer(address(msg.sender), user.amount);
		emit EmergencyWithdraw(msg.sender, 0, user.amount);
		user.amount = 0;
		user.rewardDebt = 0;
	}

	/**
     * @dev Update dev address by the previous dev.
     */
	function setDev(address _account) public {
		require(msg.sender == _account, "dev: wut?");

		devaddr = _account;
	}

	function setDevFee(uint256 _fee) external {
		require(_fee <= 100, "double dev reward reached");

		devfee = _fee;
	}

	/**
     * @dev Safe midasToken transfer function, just in case
     * if rounding error causes pool to not have enough MIDASes.
     */
	function _safeTransfer(address _to, uint256 _amount) internal {
		uint256 midasBalance = midasToken.balanceOf(address(this));
		if (_amount > midasBalance) {
			midasToken.safeTransfer(_to, midasBalance);
		} else {
			midasToken.safeTransfer(_to, _amount);
		}
	}
}
