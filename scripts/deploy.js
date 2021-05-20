const hre = require("hardhat");

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

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
