// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../RBAC.sol";

/*
 * @title Locker - used for lock tokens on main chain.
 *
 */
contract Locker is RBAC {
    using SafeERC20 for IERC20;

    // @dev MIDAS token address.
    IERC20 public immutable midas;

    // @dev Event triggered when balance locked.
    event Locked(address from, address to, uint256 amount);

    constructor(IERC20 _midasToken, address _admin) RBAC(_admin) {
        require(
            address(_midasToken) != address(0),
            "Locker: constructor zero token"
        );

        midas = _midasToken;
    }

    /**
     * @dev Lock tokens on second chain by sender account.
     */
    function lock() external {
        _lock(msg.sender, msg.sender);
    }

    /**
     * @dev Lock on second chain with change recipient address.
     */
    function lockFor(address _account) external {
        require(
            _account != address(0) && _account != address(0xdead),
            "Locker: zero address"
        );

        _lock(msg.sender, _account);
    }

    /**
     * @dev Burn missing tokens from this CA.
     */
    function burn(address[] calldata _accounts, uint256[] calldata _balances)
        external
        onlyRole(BURNER_ROLE)
    {
        require(_accounts.length == _balances.length, "Invalid input length");

        uint256 balance;
        for (uint256 i; i < _accounts.length; i++) {
            balance += _balances[i];
            emit Locked(address(this), _accounts[i], _balances[i]);
        }
        midas.safeTransfer(address(0xdead), balance);
    }

    function _lock(address _operator, address _account) internal {
        uint256 accountBalance = midas.balanceOf(_operator);
        midas.safeTransferFrom(_operator, address(0xdead), accountBalance);
        emit Locked(_operator, _account, accountBalance);
    }
}
