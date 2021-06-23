import React, { useState, useEffect } from "react";
import { Biconomy } from "@biconomy/mexa";
import './App.css';
import { Badge, Button, Col, FormControl, InputGroup, Row } from "react-bootstrap"
import childERC20Json from "./erc20ABI";
import aaveInterfaceABI from "./aaveInterfaceABI";
import aaveInterfaceTrustedForwarderABI from "./aaveInterfaceTrustedForwarderABI";

import Web3 from "web3";

function App() {
  const [web3, setWeb3] = useState({});
  const [amount, setAmount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [daiContract, setDaiContract] = useState({});
  const [status, setStatus] = useState(" ");
  const [aaveInterfaceContract, setAaveInterfaceContract] = useState({});
  const [aaveInterfaceTrustedForwarderContract, setAaveInterfaceTrustedForwarderContract] = useState({});
  const [aaveInterfaceAllownace, setAaveInterfaceAllowance] = useState(0);
  const [aaveInterfaceAllownaceInDecimal, setAaveInterfaceAllowanceInDecimal] = useState(0);
  const [aaveInterfaceTrustedForwarderAllownace, setAaveInterfaceTrustedForwarderAllowance] = useState(0);
  const [lendingPoolAllownace, setLendingPoolAllowance] = useState(0);
  const [_biconomy, setBiconomy] = useState(0);

  const chainID = 137;
  const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
  const aaveLendingPool = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf"
  const aaveInterfaceAddress = "0xA8830CC3A0f7F7aedE570279D570fbF0675784b4";
  const aaveInterfaceTrustedForwarderAddress = "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8"; //Trusted Forwarder
  
  const biconomyApiKey = "ohIA3P9Jb.d4b7cf7e-5c02-4881-a8dd-c25af51ee403";

  const domainType = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
  ];

  const metaTransactionType = [
      { name: "nonce", type: "uint256" },
      { name: "from", type: "address" },
      { name: "functionSignature", type: "bytes" }
  ];

  let domainDataDai = {
      name: "(PoS) Dai Stablecoin",
      version: "1",
      verifyingContract: daiAddress,
      salt: '0x' + (chainID).toString(16).padStart(64, '0')
  };

  useEffect(() => {
    async function init() {
      if ( typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask ) {
          const provider = window.ethereum;
          await provider.enable();
          console.log("Initializing Biconomy ...");
        setSelectedAddress(provider.selectedAddress);
        const biconomy = new Biconomy(provider,
            { apiKey: biconomyApiKey, debug: true });
        const _web3 = new Web3(biconomy);
        setBiconomy(biconomy);
        setWeb3(_web3);
        biconomy.onEvent(biconomy.READY, async () => {
              console.log("Biconomy Ready");
              const _daiContract = new _web3.eth.Contract(childERC20Json, daiAddress);
              const _aaveInterfaceContract = new _web3.eth.Contract(aaveInterfaceABI, aaveInterfaceAddress);
              const _aaveInterfaceTrustedForwarderContract = new _web3.eth.Contract(aaveInterfaceTrustedForwarderABI, aaveInterfaceTrustedForwarderAddress);
              setAaveInterfaceContract(_aaveInterfaceContract);
              setDaiContract(_daiContract);
              setAaveInterfaceTrustedForwarderContract(_aaveInterfaceTrustedForwarderContract);
              const _aaveInterfaceAllownace = await  _daiContract.methods.allowance(provider.selectedAddress, aaveInterfaceAddress).call();
              const _aaveInterfaceTFAllownace = await  _daiContract.methods.allowance(provider.selectedAddress, aaveInterfaceTrustedForwarderAddress).call();
              const _lendingPoolAllowance = await  _daiContract.methods.allowance(provider.selectedAddress, aaveLendingPool).call();
              setAaveInterfaceAllowance(_aaveInterfaceAllownace);
              setAaveInterfaceAllowanceInDecimal(await _web3.utils.fromWei(_aaveInterfaceAllownace));
              setLendingPoolAllowance(_lendingPoolAllowance);
              setAaveInterfaceTrustedForwarderAllowance(_aaveInterfaceTFAllownace);
            }).onEvent(biconomy.ERROR, (error, message) => {
                console.log(message);
                console.log(error);
            });
      } else {
          alert("Metamask not installed");
      }
    }
    init();
  }, []);
    

  const depositFundsToAave = async () => {
    if(aaveInterfaceContract) {
      // TODO: Handle the conversion differently for tokens whole decimal is not 18
      let amountInSmallestUnit = web3.utils.toWei(amount);
      aaveInterfaceContract.methods.deposit(daiAddress, amountInSmallestUnit, selectedAddress,0).send({
        from: selectedAddress,
        signatureType: "EIP712_SIGN" // Optional. If this is not present, personal signatures are used
      }).once("transactionHash", async (hash) => {
        setStatus("Transaction sent. Waiting for confirmation..");
      }).once("confirmation", async (confirmationNumber, receipt) => {
        console.log(confirmationNumber);
        console.log(receipt);
        if(receipt && receipt.status) {
          setStatus(<div>Deposited Funds. Please check your AAVE <a href="https://app.aave.com/dashboard" target="_blank">Dashboard</a> <div>Check <a href={`https://polygonscan.com/tx/${receipt.transactionHash}`} target="_blank">Explorer</a></div></div>)
        } else {
          setStatus(<div>Transaction failed. Check <a href={`https://polygonscan.com/tx/${receipt.transactionHash}`} target="_blank">Explorer</a></div>);
        }
      });
    } else {
      alert(`AaveInterface Contract is not defined`);
    }
  }

  const getInterfaceDaiApproval = async () => {
    if(amount > 0) {

      let currentApproval = await daiContract.methods.allowance(selectedAddress, aaveInterfaceAddress).call();
      let amountToTransfer = web3.utils.toWei(amount);

      console.log(`current approval ${currentApproval}`)
      console.log(`amountToTransfer  ${amountToTransfer}`)
      if(parseFloat(currentApproval) < parseFloat(amountToTransfer)) {
        // To approval first
        console.log('Approval not found. Approve Aave Wrapper first');
        approveAaveWrapper();
      } else {
        // Do the deposit here
        console.log(`Approval found, doing the deposit directly.`);
        depositFundsToAave();
      }
    } else {
      alert('Please enter amount greater than 0');
    }
  };

  const approveAaveWrapper = async () => {
    const nonce = await daiContract.methods.getNonce(selectedAddress).call()
      let functionSignature = daiContract.methods.approve(aaveInterfaceAddress, web3.utils.toWei(amount)).encodeABI();
      let message = {};
      message.nonce = nonce;
      message.from = selectedAddress;
      message.functionSignature = functionSignature;
      const dataToSign = JSON.stringify(
        {
          types: {
            EIP712Domain: domainType,
            MetaTransaction: metaTransactionType
          },
          domain: domainDataDai,
          primaryType: "MetaTransaction",
          message: message
        }
      );
      return new Promise(function (resolve, reject) {
        web3.currentProvider.sendAsync(
          {
            jsonrpc: "2.0",
            id: 999999999999,
            method: "eth_signTypedData_v4",
            params: [selectedAddress, dataToSign],
          }, (err, result) => {
            if (err) {
              reject(err);
            } else {
              const r = result.result.slice(0, 66);
              const s = "0x" + result.result.slice(66, 130);
              const v = Number("0x" + result.result.slice(130, 132));
              daiContract.methods.executeMetaTransaction(selectedAddress, functionSignature, r, s, v).send({
                from: selectedAddress,
              }).once("confirmation", async () => {
                setStatus("Allowance Granted to interface contract. Depositing Funds.")
                await depositFundsToAave();
              });
            
              setStatus("Wait. Granting Allowance.")
            }
          })
      });
  }


  const getInterfaceTrustedForwarderDaiApproval = async () => {
    const nonce = await daiContract.methods.getNonce(selectedAddress).call()
    let functionSignature = daiContract.methods.approve(aaveInterfaceTrustedForwarderAddress, amount).encodeABI();
    let message = {};
    message.nonce = nonce;
    message.from = selectedAddress;
    message.functionSignature = functionSignature;
    const dataToSign = JSON.stringify(
      {
        types: {
          EIP712Domain: domainType,
          MetaTransaction: metaTransactionType
        },
        domain: domainDataDai,
        primaryType: "MetaTransaction",
        message: message
      }
    );
    return new Promise(function (resolve, reject) {
      web3.currentProvider.sendAsync(
        {
          jsonrpc: "2.0",
          id: 999999999999,
          method: "eth_signTypedData_v4",
          params: [selectedAddress, dataToSign],
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            const r = result.result.slice(0, 66);
            const s = "0x" + result.result.slice(66, 130);
            const v = Number("0x" + result.result.slice(130, 132));
            daiContract.methods.executeMetaTransaction(selectedAddress, functionSignature, r, s, v).send({
              from: selectedAddress,
            }).once("confirmation",async () => {
              await makeDepositViaTrustedForwarder();
             });
          }
        })
    });
  };


  const makeDepositViaTrustedForwarder = async () => {
    await aaveInterfaceTrustedForwarderContract.methods.depositDaiToAave(amount).send({
      from: selectedAddress,
      gasLimit: "9999999"
      // signatureType: _biconomy.EIP712_SIGN,
    })
  }


  return (
    <div className="App">
      <div className="deposit-status">
        {status}
      </div>
      
      <h3>
        Deposit Dai to <Badge variant="secondary">AAVE</Badge>
      </h3>
      <InputGroup className="mb-3">
        <FormControl
          placeholder="Amount"
          type="number"
          onChange={(event) => {
            setAmount(event.target.value);
          }}
        />
      </InputGroup>
      <Row>
        <Button variant="secondary" onClick={getInterfaceDaiApproval}>Deposit Via Wrapper </Button>
        {/* <Button variant="secondary" onClick={getLendingPoolDaiApproval}>Approve LendingPool {lendingPoolAllownace}</Button> */}
        
        {/* <Button variant="secondary" onClick={getInterfaceTrustedForwarderDaiApproval}>Deposit Via Trusted Forwarder</Button> */}
      </Row>
      <Row>
        <Col>
          <div style={{marginTop: "20px"}}>
            {`Allowance Given: ${aaveInterfaceAllownaceInDecimal} DAI` }
          </div>
        </Col>
        {/* <Col>{ aaveInterfaceTrustedForwarderAllownace }</Col> */}
      </Row>
    </div>
  );
}

export default App;
