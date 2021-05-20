import React, { useState, useEffect } from "react";
import { Biconomy } from "@biconomy/mexa";
import './App.css';
import { Badge, Button, Col, FormControl, InputGroup, Row } from "react-bootstrap"
import childERC20Json from "./artifacts/contracts/lib/childERC20.sol/ChildERC20.json";
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
  const [aaveInterfaceTrustedForwarderAllownace, setAaveInterfaceTrustedForwarderAllowance] = useState(0);
  const [lendingPoolAllownace, setLendingPoolAllowance] = useState(0);
  const [_biconomy, setBiconomy] = useState(0);

  const chainID = 137;
  const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
  const aaveLendingPool = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf"
  const aaveInterfaceAddress = "0xD15cEa4286A10EFc1780C6F79302C657142C254d";
  const aaveInterfaceTrustedForwarderAddress = "0x3F9b369FFbF7b960ce8c8a6398c3332c5264e9c4"; //Trusted Forwarder
  
  const biconomyApiKey = "DtqhpPPAM.2c730777-523a-4b24-955b-12c5611fca3c";

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
  
    let domainDataAave = {
        name: "AaveInterface",
        version: "1",
        verifyingContract: aaveInterfaceAddress,
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
    const nonce = await aaveInterfaceContract.methods.getNonce(selectedAddress).call()
    let functionSignature = aaveInterfaceContract.methods.depositDaiToAave(web3.utils.toWei(amount)).encodeABI();
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
        domain: domainDataAave,
        primaryType: "MetaTransaction",
        message: message
      }
    );
    console.log(message);

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
            aaveInterfaceContract.methods.executeMetaTransaction(selectedAddress, functionSignature, r, s, v).send({
              from: selectedAddress,
              gasLimit: "9999999"
            }).once("confirmation", async () => {
                setStatus(" Deposited Funds. Please check your AAVE dashboard.")
              });
          }
        })
    });
  }

  const getInterfaceDaiApproval = async () => {
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
  };


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
      <h3>
        {status}
      </h3>
      
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
        <Button variant="secondary" onClick={getInterfaceDaiApproval}>Deposit Via Custom Approach </Button>
        {/* <Button variant="secondary" onClick={getLendingPoolDaiApproval}>Approve LendingPool {lendingPoolAllownace}</Button> */}
        <Col> { "  " }</Col>
        {/* <Button variant="secondary" onClick={getInterfaceTrustedForwarderDaiApproval}>Deposit Via Trusted Forwarder</Button> */}
      </Row>
      <Row>
        <Col>{`Allowance: `+ aaveInterfaceAllownace }</Col>
        {/* <Col>{ aaveInterfaceTrustedForwarderAllownace }</Col> */}
      </Row>
    </div>
  );
}

export default App;
