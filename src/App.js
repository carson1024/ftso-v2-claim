import { Input, TextField, Box, FormControlLabel, Checkbox, FormGroup, Button } from '@mui/material';
import './App.css';
import React, { useState, useEffect } from 'react';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import { ethers } from 'ethers';
import RewardManagerAbi from './contracts/RewardManager.json';
import { REWARD_MANAGER_ADDRESS } from './config.js';
import axios from 'axios';

function App() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const [firstEpochId, setFirstEpochId] = React.useState(0);
  const [currentEpochId, setCurrentEpochId] = React.useState(0);
  const [rewardOwner, setRewardOwner] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [checkedWrap, setCheckedWrap] = React.useState(false);
  const [claimableAmount, setClaimableAmount] = React.useState(0);
  const [rewardManagerContract, setRewardManagerContract] = useState();

  const handleWrapChange = (event) => {
    setCheckedWrap(event.target.checked);
  };

  useEffect(() => {
    loadData();
  }, [address, isConnected]);

  const loadData = async () => {
    console.log("loaded", address, isConnected);
    if (isConnected && address) {
      try {
        let _rewardManagerContract;
        const browserProvider = new ethers.BrowserProvider(walletProvider);
        if (!rewardManagerContract && window.ethereum) {
          const new_signer = await browserProvider.getSigner();
          // if (!new_signer) setSigner(new_signer);
          _rewardManagerContract = new ethers.Contract(REWARD_MANAGER_ADDRESS, RewardManagerAbi, new_signer);
          setRewardManagerContract(_rewardManagerContract);
        }
  
        if (_rewardManagerContract) {
          let firstEpoch = parseInt(await _rewardManagerContract.firstClaimableRewardEpochId());
          let currentEpoch = parseInt(await _rewardManagerContract.getCurrentRewardEpochId());
          setFirstEpochId(firstEpoch);
          setCurrentEpochId(currentEpoch);
        }
        setRewardOwner(address);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const claim = async (isSimulate) => {
    if (!rewardOwner) return;
    const requests = [];
    for (let i = firstEpochId; i < currentEpochId; ++i) {
      requests.push(axios
        .get(`https://raw.githubusercontent.com/flare-foundation/fsp-rewards/main/flare/${i}/reward-distribution-data.json`)
        .catch(error => {
          console.error(`Error fetching ${i}:`, error.message);
          return null; // Return `null` or a fallback value to indicate failure
        }));
    }
    const results = await Promise.all(requests);
    let proofs = [];
    results.map((result) => {
      if (!result || result.status != 200 || !result.data || !result.data.rewardClaims) return;
      proofs.push(...(result.data.rewardClaims.filter((data) => data.body.beneficiary.toLowerCase() == rewardOwner.toLowerCase())));
    });
    if (isSimulate) {
      try {
        const rewardAmountWei = await rewardManagerContract.claim.staticCall(
          rewardOwner,
          recipient || rewardOwner,
          currentEpochId - 1,
          checkedWrap,
          proofs
        );
        setClaimableAmount(Number(rewardAmountWei));
      } catch (e) {
        setClaimableAmount(0);
      }
    }else {
      const tx = await rewardManagerContract.claim(
        rewardOwner,
        recipient || rewardOwner,
        currentEpochId - 1,
        checkedWrap,
        proofs
      );
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      setClaimableAmount(0);
    }
  }

  useEffect(() => {
    if (!rewardOwner || rewardOwner.length != 42) return;
    claim(true);
  }, [rewardOwner]);

  const formatEther = (num) => {
    return (Number(num) / 10 ** 18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="container p-5">
      <h1 className='text-3xl mb-5'>Claim FTSOv2 Rewards</h1>
      <h1 className='text-xl mb-5'>Current EpochId: { currentEpochId }</h1>
      <div>
        <TextField
          style={{
            marginRight: 20,
            width: 450
          }}
          label="Reward Owner"
          value={rewardOwner}
          onChange={(event) => {
            setRewardOwner(event.target.value);
          }}
        />
        <TextField
          style={{
            marginRight: 20,
            width: 450
          }}
          label="Recipient"
          value={recipient}
          onChange={(event) => {
            setRecipient(event.target.value);
          }}
        />
        <FormControlLabel control={
          <Checkbox
            checked={checkedWrap}
            onChange={handleWrapChange}
            inputProps={{ 'aria-label': 'controlled' }}
          />
        } label="Wrap" />
      </div>
      <div className='mt-3'>
        <span className='mr-2'>Claimable: { formatEther(claimableAmount) } FLR</span>
        <Button disabled={!claimableAmount} variant="contained" style={{ marginRight: 10 }} onClick={() => claim(false)}>Claim</Button>
        <Button
          onClick={() => open()}
          variant="contained"
        >
          {isConnected ? `${address.slice(0, 7)}....${address.slice(-5)}` : 'Connect Wallet'}
        </Button>
      </div>
    </div>
  );
}

export default App;
