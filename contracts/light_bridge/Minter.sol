// SPDX-License-Identifier: MIT

pragma solidity =0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../RBAC.sol";
import "../interfaces/IMidas.sol";

/*
 * @title Minter - used for mint locked tokens on another chain.
 *
 */
contract Minter is RBAC(msg.sender) {
    using SafeERC20 for IERC20;

    struct Data {
        uint256 amount;
        address recipient;
    }

    address public midas;
    uint256 public nonce;

    mapping(bytes32 => Data) public data;

    event Minted(address to, uint256 amount, bytes32 tnx);

    constructor(address _midasToken) {
        require(_midasToken != address(0), "Minter: constructor zero token");

        midas = _midasToken;
    }

    function mint(
        bytes32 _txHash,
        Data calldata _data,
        bytes32 _checkSign
    ) external onlyRole(MINTER_ROLE) {
        require(
            _checkSign == keccak256(abi.encode(_txHash, _data, nonce)),
            "Minter: bed signature"
        );
        require(data[_txHash].recipient == address(0), "Minter: tnx handled");

        IMidas(midas).mint(_data.recipient, _data.amount);

        data[_txHash] = _data;
        nonce++;
        emit Minted(_data.recipient, _data.amount, _txHash);
    }
}
