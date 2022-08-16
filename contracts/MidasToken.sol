// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./RBAC.sol";

contract MidasToken is ERC20("Midas", "MIDAS"), RBAC {
	function mint(address _to, uint256 _amount) external onlyRole(MINTER_ROLE) {
		_mint(_to, _amount);
	}

	function burn(uint256 _amount) external onlyRole(BURNER_ROLE) {
		_burn(msg.sender, _amount);
	}
}
