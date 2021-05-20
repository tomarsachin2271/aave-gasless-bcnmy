//SPDX-License-Identifier: Unlicense
pragma solidity 0.6.0;

import { ChildERC20 } from "./childERC20.sol";
import { LendingPool } from "https://github.com/aave/protocol-v2/blob/ice/mainnet-deployment-03-12-2020/contracts/protocol/lendingpool/LendingPool.sol";
import "./EIP712MetaTransaction.sol";

contract AaveInterface is EIP712MetaTransaction("AaveInterface","1") {

    // address DAI_ADDRESS = 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD;
    address DAI_ADDRESS = 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063;
    
    // address public AAVE_LENDING_POOL_ADDRESS = 0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe;
    address public AAVE_LENDING_POOL_ADDRESS = 0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf;
    
    LendingPool public lendingPool = LendingPool(AAVE_LENDING_POOL_ADDRESS);
    ChildERC20 public childERC20 = ChildERC20(DAI_ADDRESS);  
    
    function depositDaiToAave(address onBehalfOf, uint256 amount) public {
        childERC20.transferFrom(onBehalfOf, address(this), amount);
        childERC20.approve(AAVE_LENDING_POOL_ADDRESS, amount);
        lendingPool.deposit(DAI_ADDRESS, amount, onBehalfOf, 0);
    }
    

}
//AAVE 0x4c78E97D1E2d15Ad40E6D6C53FD01982639c87C9
//DAI 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063