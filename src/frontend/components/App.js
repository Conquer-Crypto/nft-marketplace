
import './App.css';

import { ethers } from "ethers";
import { useState } from 'react';

import Navigation from './Navbar';

import MarketplaceAbi from '../contractsData/Marketplace.json';
import MarketplaceAddress from '../contractsData/Marketplace-address.json';
import NFTAbi from '../contractsData/BlocksNFT.json';
import NFTAddress from '../contractsData/BlocksNFT-address.json';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from './Home';
import Create from './Mint';
import MyListedItems from './MyListedItem';
import MyPurchases from './MyPurchases';
import { Spinner } from 'react-bootstrap';


function App() {

  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState({});
  const [marketplace, setMarketplace] = useState({});
  const [loading, setLoading] = useState(true); // Para saber si estamos leyendo datos de la blockchain

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
    setAccount(accounts[0]);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    loadContracts(signer);
  }

  const loadContracts = async (signer) => {
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer);
    setMarketplace(marketplace);
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
    setNFT(nft);
    setLoading(false);
  }


  return (
    <BrowserRouter>
    <div className="App">
      <Navigation web3Handler={web3Handler} account={account} />
      
      <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home marketplace={marketplace} nft={nft} />
              } />
              <Route path="/mint" element={
                <Create marketplace={marketplace} nft={nft} />
              } />
              <Route path="/my-listed-items" element={
                <MyListedItems marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-purchases" element={
                <MyPurchases marketplace={marketplace} nft={nft} account={account} />
              } />
            </Routes>
          )}
      </div>


    </div>
    </BrowserRouter>
  );
}

export default App;
