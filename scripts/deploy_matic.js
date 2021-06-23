
const main = async () => {
  const trustedForwarder = "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8";
  const AaveInterface = await ethers.getContractFactory("AaveInterface");
  const aaveInterface = await AaveInterface.deploy(trustedForwarder);
  await aaveInterface.deployed();
  console.log("✅ Aave Interface deployed at : ", aaveInterface.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
