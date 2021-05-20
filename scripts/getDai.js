const hre = require("hardhat");

const main = async () => {
    const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const accounts = await ethers.getSigners();
    const owner = await accounts[0].getAddress();
    const notOwner = await accounts[1].getAddress();

    const uniswapRouter = await ethers.getContractAt(
        "IUniswapV2Router02",
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );
  
   const dai = await ethers.getContractAt(
        "Dai",
        "0x6b175474e89094c44da98b954eedeac495271d0f"
    );

    await uniswapRouter.swapExactETHForTokens(
        0,
        [WETHAddress, daiAddress],
        owner,
        "1000000000000000000000000", {
            value: ethers.utils.parseEther("0.1").toString()
        }
    );
  
  const balance = await dai.balanceOf(owner);
  console.log(balance.toString());

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
