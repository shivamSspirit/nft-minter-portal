import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from 'ethers'
import myEpicNft from './utils/myEpicNft.json'
import { ColorRing } from 'react-loader-spinner'

// Constants
const TWITTER_HANDLE = 'shivamSspirit';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;


const CONTRACT_ADDRESS = '0xbde964B6c912d348EC4e6865c1257Fc4968e7418'

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [collectionLink, setCollectionLink] = useState("");
  const [loader, setLoader] = useState(false);
  console.log("coll", collectionLink)


  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  }


  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      const goerliChainId = "0x5";
      if (chainId !== goerliChainId) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: goerliChainId }],
        });
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

    } catch (error) {
      console.log(error);
    }
  }


  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])


  const onNewEpicNFTMinted = () => {
    let nftPortalContract;
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      nftPortalContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
      nftPortalContract.on("NewEpicNFTMinted", (from, tokenId) => {
        console.log("NewEpicNFTMinted", from, tokenId);
        setCollectionLink(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
      });
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        setLoader(true)
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();

        onNewEpicNFTMinted()
        setLoader(false)
        console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
              {loader ? (
                <div>
                  <ColorRing
                    visible={true}
                    height="30"
                    width="40"
                    ariaLabel="blocks-loading"
                    wrapperStyle={{}}
                    wrapperClass="blocks-wrapper"
                    colors={['#fff']}
                  />
                </div>
              ) : 'Mint NFT'}
            </button>
          )}
        </div>
        {collectionLink && (
          <div className="middle-container">
            <span className='collection-link-box'>
              <a className='collection-btn' href={collectionLink}>See your collection</a>
            </span>
          </div>
        )}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
