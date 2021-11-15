import React from 'react';
import './App.css';

import * as Web3 from 'web3'
import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types'

import PrivateKeyProvider from 'truffle-privatekey-provider'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts: [],
      numberOfAccounts: "",
      mainAccountAddress: "",
      mainAccountPrivateKey: "",
      tokenId: "",
      tokenAddress: "",
      sellerAccountAddress: "",
      sellerAccountPrivateKey: "",
      buyerAccountAddress: "",
      buyerAccountPrivateKey: "",
      startAmount: "",
      rpcUrl: "https://rinkeby.infura.io/v3/e2b6124ac31f4a5b9912b5e3e934d498"
    };
    
    this.setMainAccountAddress = this.setMainAccountAddress.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleInputClick = this.handleInputClick.bind(this);
    this.handleTransferClick = this.handleTransferClick.bind(this);
  }
  
  componentDidMount() {
    this.setState({
      startAmount: 1
    });
  }
  
  setMainAccountAddress() {
    this.setState({
      mainAccountAddress: this.state.accounts[0].address,
      mainAccountPrivateKey: this.state.accounts[0].privateKey.substr(2)
    });
  }
  
  handleChange(event) {
    this.setState({
      numberOfAccounts: event.target.value
    });
  }
  
  handleClick() {
    const sellerProvider = new PrivateKeyProvider(this.state.sellerAccountPrivateKey, this.state.rpcUrl)
    
    const sellerSeaport = new OpenSeaPort(sellerProvider, {
      networkName: Network.Rinkeby,
    });
    
    const buyerProvider = new PrivateKeyProvider(this.state.buyerAccountPrivateKey, this.state.rpcUrl)
    
    const buyerSeaport = new OpenSeaPort(buyerProvider, {
      networkName: Network.Rinkeby,
    });
    
    const listing = sellerSeaport.createSellOrder({
      asset: {
        tokenId: this.state.tokenId,
        tokenAddress: this.state.tokenAddress,
      },
      accountAddress: this.state.sellerAccountAddress,
      startAmount: this.state.startAmount,
      expirationTime: 0
    });
    
    const order = buyerSeaport.api.getOrder({
      asset_contract_address: this.state.tokenAddress,
      token_id: this.state.tokenId,
      side: OrderSide.Sell
    });
    
    const transactionHash = buyerSeaport.fulfillOrder({
      order: order,
      accountAddress: this.state.buyerAccountAddress
    });
  }
  
  handleInputClick() {
    const web3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl));
    
    let accounts = []
    for (let i = 0; i < this.state.numberOfAccounts; i++) {
      let account = web3.eth.accounts.create();
      accounts.push(account);
    }
    
    this.setState({
      accounts: [...this.state.accounts, ...accounts]
    },
    () => {
      this.setMainAccountAddress();
    });
  }
  
  async handleTransferClick() {
    const web3 = new Web3(new PrivateKeyProvider(this.state.mainAccountPrivateKey, this.state.rpcUrl));
    
    let _balance = 0;
    await web3.eth.getBalance(this.state.mainAccountAddress, async(err, balance) => {
      _balance = await web3.utils.fromWei(balance, "ether");
    });
    
    this.state.accounts.forEach(account => {
      web3.eth.sendTransaction({
        from: this.state.mainAccountAddress,
        to: account.address,
        value: web3.utils.toWei("0.001", "ether")
      });
    });
  }
  
  render() {
    return (
      <div>
        <button onClick = { this.handleClick }>
          Start
        </button>
        <div>
          <input type = "text" onChange = { this.handleChange } />
          <input type = "button" value = "create" placeholder = "Account number" onClick = { this.handleInputClick } />
        </div>
        <div>
          <input className = "form-control" type = "text" defaultValue = { this.state.mainAccountAddress } />
          <input type = "button" value = "transfer" placeholder = "Account number" onClick = { this.handleTransferClick } />
        </div>
      </div>
    );
  }
}

export default App;