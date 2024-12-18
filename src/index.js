import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import walletConnectLogo from "./assets/img/web3/wallet-connect.jpg";
import coinbaseLogo from "./assets/img/web3/coinbase.svg";
import ethereumLogo from "./assets/img/web3/ethereum.png";
import flareLogo from "./assets/img/web3/flare.png";
import logo from "./assets/img/web3/image1.svg";

const projectId = 'ftso-v2-claim';

// const provider = new ethers.JsonRpcProvider('https://flare-api.flare.network/ext/C/rpc');
// console.log('Gas Price', await provider.send('eth_gasPrice'));

const mainnet = {
  chainId: 14,
  name: 'Flare',
  currency: 'FLR',
  explorerUrl: 'https://flare-explorer.flare.network',
  rpcUrl: 'https://flare-api.flare.network/ext/C/rpc'
};

const metadata = {
  name: 'FURY',
  description: 'Delivering highly accurate data to the Flare network through our advanced algorithms',
  url: '...', // origin must match your domain & subdomain
  icons: [logo]
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true, // true by default
  enableInjected: false, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 14, // used for the Coinbase SDK
});

createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  chainImages: {
      1: ethereumLogo,
      14: flareLogo,
  },
  connectorImages: {
      coinbaseWallet: coinbaseLogo,
      walletConnect: walletConnectLogo,
  },
  projectId
  // enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
