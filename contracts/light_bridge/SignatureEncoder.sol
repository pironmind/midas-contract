// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

contract SignatureEncoder {
    struct Data {
        uint256 amount;
        address recipient;
    }

    function getSignature(
        bytes32 _txHash,
        Data calldata _data,
        uint256 _nonce
    ) external pure returns (bytes32 signature) {
        signature = keccak256(abi.encode(_txHash, _data, _nonce));
    }
}
