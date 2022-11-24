import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';

import contractAbi from './utils/contractAbi.json';

import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
import toast from "react-hot-toast";




// Constants
const TWITTER_HANDLE = 'ras_kimonic';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const POLYGON_TWITTER_HANDLE = "0xPolygon";
const POLYGON_TWITTER_LINK = `https://twitter.com/${POLYGON_TWITTER_HANDLE}`;
const BASE_TWITTER_PROFILE = "https://twitter.com/";
//domain name wey i dey mint
const tld = '.polygon';
const CONTRACT_ADDRESS = '0xc3F2602aa604738BB08C3585426059E9466a73e3'

const App = () => {
	//state variable wey go store the user wallet and user data
	const [currentAccount, setCurrentAccount] = useState('');
	const [domain, setDomain] = useState('');
	const [loading, setLoading] = useState('false');
	const [editing, setEditing] = useState(false);
	const [nickname, setNickname] = useState("");
  	const [spotifyLink, setSpotifyLink] = useState("");
  	const [twitter, setTwitter] = useState("");
	const [network, setNetwork] = useState('');
	const [mints, setMints] = useState([]);


	//function to take connect wallet
	const connectWallet = async () => {
		try {
		  const { ethereum } = window;
	
		  if (!ethereum) {
			alert("Get MetaMask -> https://metamask.io/");
			return;
		  }
	
		  //  method to request access to account.
		  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
		
		  // Chikena! This go print the public address once we authorize Metamask.
		  console.log("Connected", accounts[0]);
		  setCurrentAccount(accounts[0]);
		} catch (error) {
		  console.log(error)
		}
	  }


	  const switchNetwork = async () => {
		if (window.ethereum) {
		  try {
			// Try to switch to the Mumbai testnet
			await window.ethereum.request({
			  method: 'wallet_switchEthereumChain',
			  params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
			});
		  } catch (error) {
			// This error code means that the chain we want has not been added to MetaMask
			// In this case we ask the user to add it to their MetaMask
			if (error.code === 4902) {
			  try {
				await window.ethereum.request({
				  method: 'wallet_addEthereumChain',
				  params: [
					{	
					  chainId: '0x13881',
					  chainName: 'Polygon Mumbai Testnet',
					  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
					  nativeCurrency: {
						  name: "Mumbai Matic",
						  symbol: "MATIC",
						  decimals: 18
					  },
					  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
					},
				  ],
				});
			  } catch (error) {
				console.log(error);
			  }
			}
			console.log(error);
		  }
		} else {
		  // If window.ethereum is not found then MetaMask is not installed
		  alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		} 
	  }





	//make sure this  is async.
	const checkIfWalletIsConnected = async () => {
		//fess check for access to the window.ethereum object
		const { ethereum } = window;

		if (!ethereum) {
			console.log("Make sure you have metamask installed");
			return;
		} else {
			console.log("We have the ethereum object", ethereum);
		}

		//check whether them don authorize us to access the user wallet
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		//users fi authorize many accounts so pick the first one if e dey there
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log("Found an authorized account:", account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}

		//check the user's network chain ID
		const chainId = await ethereum.request({ method: 'eth_chainId' });
    	setNetwork(networks[chainId]);

    	ethereum.on('chainChanged', handleChainChanged);
		ethereum.on("accountsChanged", handleAccountChanged);

		//reload page if user change network
		function handleChainChanged(_chainId) {
			window.location.reload();
		}

		function handleAccountChanged() {
			window.location.reload();
		  }
    };


	const mintDomain = async () => {
		//  no work if the domain dey empty
		if (!domain) { return }
		// error prompt if the domain too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}
		// Calculate price based on length of domain (change this to match your contract)	
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price = domain.length === 3 ? '0.3' : domain.length === 4 ? '0.2' : '0.1';
		console.log("Minting domain", domain, "with price", price);

		//doublecheck here if you run into error
		setLoading(true);
	  try {
		const { ethereum } = window;
		if (ethereum) {
		  const provider = new ethers.providers.Web3Provider(ethereum);
		  const signer = provider.getSigner();
		  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				console.log("Going to pop wallet now to pay gas...")
		  let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
		  // Wait make them mine the transaction
				const receipt = await tx.wait();
	
				// Check sey the transaction dey completed
				if (receipt.status === 1) {
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);

					const nftId = await contract.getNftId(domain);

					// Set the record for the domain
					tx = await contract.setAllRecords(
						domain,
						nickname,
						spotifyLink,
						twitter
					  );
					  await tx.wait();
			
					  console.log(
						"All records set! https://mumbai.polygonscan.com/tx/" + tx.hash
					  );
			
					  toast.custom(
						<div className="toast">
						  <p>Domain minted!
							Check it at
							<a
							  className="link underlined"
							  href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${nftId}`}
							  target="_blank"
							  rel="noopener noreferrer"
							>
							  {" "}
							  {domain}
							  {tld}{" "}
							</a>
						  </p>
					  </div>
					  );


					// Call fetchMints() after 2 seconds
					setTimeout(() => {
						fetchMints();
					  }, 2000);
					
					clearInput();
				}
				else {
					alert("Transaction failed! Please try again");
				}
		}
	  }
	  catch(error){
		console.log(error);
	  }
	  //check here later for errors
	  setLoading(false);
	}

	const fetchMints = async () => {
		try {
		  const { ethereum } = window;
		  if (ethereum) {
			// same old same old
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
			  
			// Get all the domain names from our contract
			const names = await contract.getAllNames();
			  
			// For each name, get the record and the address
			const mintRecords = await Promise.all(names.map(async (name) => {
			const mintRecord = await contract.getRecord(name);
			const owner = await contract.getAddress(name);
			return {
			  id: names.indexOf(name),
			  name: name,
			  nickname: mintRecord.nickname,
			  spotifyLink: mintRecord.spotifyLink,
			  twitter: mintRecord.twitter,
			  owner: owner,
			};
		  }));
	  
		  console.log("MINTS FETCHED ", mintRecords);
		  setMints(mintRecords);
		  }
		} catch(error){
		  console.log(error);
		}
	  }

	const updateDomain = async () => {
		if (!nickname || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with records:", nickname, spotifyLink, twitter);
		  try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	  
			let tx = await contract.setAllRecords(domain, nickname, spotifyLink, twitter);
			await tx.wait();
			console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
	  
			fetchMints();
			clearInput();
		  }
		  } catch(error) {
			console.log(error);
		  }
		setLoading(false);
		setEditing(false);
	  }



	//RENDER METHODS

	//function wey go render if you never connect wallet yet.
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
		  <img src="https://media.giphy.com/media/MyelJSkejME7bpdx6b/giphy.gif" alt="Polygon gif" />
		  <button onClick={connectWallet} className="cta-button connect-wallet-button">
			Connect Wallet
		  </button>
		</div>
		);

	//form to enter domain name and data
	const renderForm = () => {
		// If user no dey on Polygon Mumbai Testnet, render "Please connect to Polygon Mumbai Testnet"
		if (network !== 'Polygon Mumbai Testnet') {
			return (
			  <div className="connect-wallet-container">
				<h2>Please connect to the Polygon Mumbai Testnet</h2>
				<button className='cta-button mint-button' onClick={switchNetwork} >Click here to switch</button>
			  </div>
			);
		  }
		  return (
			<div className="form-container">
			  <div className="first-row">
				<input
				  type="text"
				  value={domain}
				  placeholder='domain'
				  onChange={e => setDomain(e.target.value)}
				/>
				<p className='tld'> {tld} </p>
			  </div>
			  <div className='first-row'>
					<img
					className="at"
					src="https://img.icons8.com/external-kmg-design-glyph-kmg-design/32/ffffff/external-user-back-to-school-kmg-design-glyph-kmg-design.png"
					alt="User icon"
				/>
				<input
					type="text"
					value={nickname}
					placeholder="Your nickname"
					onChange={(e) => setNickname(e.target.value)}
				/>
			  </div>
			  <div className='first-row'>
					<img
					className="at"
					src="https://img.icons8.com/color/30/000000/spotify--v1.png"
					alt="Spotify logo"
				/>
				<input
					type="text"
					value={spotifyLink}
					placeholder="Link to your spotify playlist"
					onChange={(e) => setSpotifyLink(e.target.value)}
				/>
			  </div>
			  <div className='first-row'>
					<p className="at">@</p>
				<input
					type="text"
					value={twitter}
					placeholder="Your twitter account"
					onChange={(e) => setTwitter(e.target.value)}
				/>
			  </div>
				{/* If the editing variable is true, return the "Set record" and "Cancel" button */}
				{editing ? (
				  <div className="button-container">
					{/* This will call the updateDomain function we just made */}
					<button className='cta-button mint-button' disabled={null} onClick={updateDomain}>
					  Set record
					</button>  
					{/* This will let us get out of editing mode by setting editing to false */}
					<button className='cta-button mint-button' onClick={() => {setEditing(false); clearInput(); }}>
					  Cancel
					</button>  
				  </div>
				) : (
				  // If editing is not true, the mint button will be returned instead
				  <button className='cta-button mint-button' disabled={false} onClick={mintDomain}>
					{loading ? "Mint" : "Mint"}
				  </button>  
				)}
			</div>
		  );
	}


	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
		  return (
			<div className="mint-container">
			  <p className="subtitle"> Recently minted domains!</p>
			  <div className="mint-list">
				{ mints.map((mint, index) => {
				  return (
					<div className="mint-item" key={index}>
					  <div className='mint-row'>
						<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
						  <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
						</a>
						{/* If mint.owner is currentAccount, add an "edit" button*/}
						{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ? (
						  <button className="edit-button" onClick={() => editRecord(mint.name,
							mint.nickname,
							mint.spotifyLink,
							mint.twitter)}>
							<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
						  </button>
						) :
						  null
						}
					  </div>
				<p> {mint.nickname} </p>
				<div className="spotify-box">
                    {mint.spotifyLink && (
                      <iframe
                        title={mint.name + mint.id}
                        src={formatSpotifyLink(mint.spotifyLink)}
                        width="300"
                        height="80"
                        frameBorder="0"
                        allow="encrypted-media"
                      ></iframe>
                    )}
                  </div>
                  <div>
                    {mint.twitter && (
                      <div>
                        <a
                          className="footer-text"
                          href={BASE_TWITTER_PROFILE + mint.twitter}
                          target="_blank"
                          rel="noreferrer"
                        >{`@${mint.twitter}`}</a>
                      </div>
                    )}
                  </div>
			  </div>
			  );
			})}
			</div>
		  </div>
		  );
		}
	  };

	  const editRecord = (name, nickname, spotifyLink, twitter) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
		setNickname(nickname);
    	setSpotifyLink(spotifyLink);
    	setTwitter(twitter);
	  };

	  const clearInput = () => {
		setNickname("");
		setSpotifyLink("");
		setTwitter("");
		setDomain("");
	  };

	  const formatSpotifyLink = (spotifyLink) => {
		return spotifyLink.replace(
		  "https://open.spotify.com",
		  "https://open.spotify.com/embed"
		);
	  };
	

	//this one go run our function as the page dey load
	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])


	// This will run any time currentAccount or network are changed
	useEffect(() => {
		if (network === 'Polygon Mumbai Testnet') {
		  fetchMints();
		}
	  }, [currentAccount, network]);

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title">Polygon Name Service</p>
              <p className="subtitle">🙏 Et Metam Es Immortalitatis 👨‍💻</p>
            </div>
			<div className="right">
      		<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
    		{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
    		</div>
					</header>
				</div>

		{/* if wallet dey connected then hide connect button */}
		{!currentAccount && renderNotConnectedContainer()}

		{/* show the input form if wallet dey connected */}
		{currentAccount && renderForm()}

		{mints && renderMints()}

        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built by @${TWITTER_HANDLE}`}</a>
					&nbsp; for &nbsp;
					<a
						className="footer-text"
						href={POLYGON_TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`@${POLYGON_TWITTER_HANDLE} Africa Bootcamp 2022`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
