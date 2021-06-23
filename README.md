# Aave Wrapper Contract to make Gasless Deposits
Here a new EIP2771 compatible wrapper contract is created on top of Aave Lending Pool contract and a method is created to deposit any ERC20 tokens on Aave lending contract in a gasless manner. 

Check the wrapper contract at ./contracts/aaveInterface.sol

To make a gasless deposit
<ol>
  <li>User give token approval to Aave Wrapper Contract</li>  
  <li>User call deposit method of Wrapper Contact</li>
</ol>

Both the above actions are made gasless on UI using <a href="https://biconomy.io">Biconomy</a> SDK <a href="https://github.com/bcnmy/mexa-sdk" target="_blank">MEXA</a>

Check Biconomy <a href="https://docs.biconomy.io/products/enable-gasless-transactions/eip-2771" target="_blank">Documentation</a> to know more about gasless transaction using EIP 2771

## Available Scripts

In project /src directory, you can run the UI using command

### `npm run start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
