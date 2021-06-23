//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.6;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ILendingPool } from "./interfaces/ILendingPool.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract AaveInterface is BaseRelayRecipient {
    address constant AAVE_LENDING_POOL_ADDRESS = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;
    ILendingPool public lendingPool = ILendingPool(AAVE_LENDING_POOL_ADDRESS);
    
    constructor(address _trustedForwarder) {
        trustedForwarder = _trustedForwarder;
    }

    function versionRecipient() external virtual override view returns (string memory) {
        return "1.0.0";
    }

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode) public {
        IERC20 erc20Asset = IERC20(asset);  
        erc20Asset.transferFrom(_msgSender(), address(this), amount);
        erc20Asset.approve(AAVE_LENDING_POOL_ADDRESS, amount);
        lendingPool.deposit(asset, amount, onBehalfOf, referralCode);
    }
}
//AAVE 0x4c78E97D1E2d15Ad40E6D6C53FD01982639c87C9
//DAI 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063