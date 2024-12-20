import React, { useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import './App.css';

const etherscanApiKey = 'TBWEGFJ52NW3NS8KQX9RNMC9PX8ICRI88E';

interface ERC721Transaction {
    tokenName: string;
    tokenSymbol: string;
    contractAddress: string;
    tokenID: string;
    from: string;
    to: string;
    hash: string;
    timeStamp: string;
    cost: string;
}

const App: React.FC = () => {
    const [address, setAddress] = useState<string>('');
    const [transactions, setTransactions] = useState<ERC721Transaction[]>([]);

    const getTransactionDetails = async (txHash: string): Promise<string> => {
        try {
            const apiUrl = 'https://api.etherscan.io/api';
            const response = await axios.get(apiUrl, {
                params: {
                    module: 'proxy',
                    action: 'eth_getTransactionByHash',
                    txhash: txHash,
                    apiKey: etherscanApiKey,
                },
            });

            if (response.data.result) {
                // `value` is in Wei, convert it to Ether
                const valueInWei = response.data.result.value;
                const valueInEther = ethers.formatEther(valueInWei);
                return valueInEther;
            } else {
                throw new Error('Transaction details not found');
            }
        } catch (error) {
            // @ts-ignore
            console.error(`Failed to fetch transaction details for hash: ${txHash}`, error.message);
            return '0';
        }
    };

    const getERC721MintTransactions = async (address: string): Promise<void> => {
        try {
            const apiUrl = 'https://api.etherscan.io/api';
            const response = await axios.get(apiUrl, {
                params: {
                    module: 'account',
                    action: 'tokennfttx',
                    address,
                    startblock: 0,
                    endblock: 99999999,
                    sort: 'asc',
                    apiKey: etherscanApiKey,
                },
            });

            if (response.data.status === '1') {
                const rawTransactions = response.data.result;
                const tokenOwnership: Record<string, string> = {};

                // Track token ownership based on all transactions
                rawTransactions.forEach((tx: any) => {
                    const tokenKey = `${tx.contractAddress}:${tx.tokenID}`;
                    if (tx.to.toLowerCase() === address.toLowerCase()) {
                        tokenOwnership[tokenKey] = tx.to.toLowerCase();
                    }
                    if (tx.from.toLowerCase() === address.toLowerCase()) {
                        delete tokenOwnership[tokenKey];
                    }
                });

                // Filter transactions for tokens currently owned by the address
                const filteredTransactions = rawTransactions.filter((tx: any) => {
                    const tokenKey = `${tx.contractAddress}:${tx.tokenID}`;
                    return tokenOwnership[tokenKey] === address.toLowerCase();
                });

                // Fetch transaction details and include mint/buy costs
                const formattedTransactions: ERC721Transaction[] = await Promise.all(
                    filteredTransactions.map(async (rawTransaction: any) => {
                        const mintOrBuyCost = await getTransactionDetails(rawTransaction.hash);
                        return {
                            tokenName: rawTransaction.tokenName,
                            tokenSymbol: rawTransaction.tokenSymbol,
                            contractAddress: rawTransaction.contractAddress,
                            tokenID: rawTransaction.tokenID,
                            from: rawTransaction.from,
                            to: rawTransaction.to,
                            hash: rawTransaction.hash,
                            timeStamp: rawTransaction.timeStamp,
                            cost: mintOrBuyCost,
                        };
                    })
                );

                setTransactions(formattedTransactions);
            } else {
                throw new Error('Failed to fetch ERC721 transactions');
            }
        } catch (error) {
            // @ts-ignore
            console.error('Error:', error.message || 'Error fetching ERC721 transactions');
        }
    };


    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (!ethers.isAddress(address)) {
            alert('Invalid Ethereum address');
            return;
        }

        try {
            await getERC721MintTransactions(address);
        } catch (error) {
            // @ts-ignore
            console.error(error.message);
            alert('Failed to fetch ERC721 transactions');
        }
    };

    const handleTimeStamp = (timeStamp: number) => {
        const date = new Date(timeStamp * 1000);

        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Month is zero-based, so add 1
        const day = date.getDate();


        return `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    }

    return (
        <div className="App">
            <div className="header">
                <div className="title">
                    <h1>ERC721 TRANSACTION ANALYZER</h1>
                    <div className="form-container">
                        <form onSubmit={handleFormSubmit}>
                            <label htmlFor="addressInput">Ethereum Address:</label>
                            <input
                                type="text"
                                id="addressInput"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                            />
                            <button type="submit">Fetch Transactions</button>
                        </form>
                    </div>
                </div>
                <div className="infobar">
                    <div className="type">
                        TYPE
                    </div>
                    <div className="name">
                        TOKEN NAME (SYMBOL)
                    </div>
                    <div className="id">
                        COST
                    </div>
                    <div className="hash">
                        ERC721 TXN HASH
                    </div>
                    <div className="date">
                        DATE
                    </div>
                </div>
            </div>
            <ul>
                {transactions.map((tx) => (
                    <li
                        key={tx.hash}
                    >
                        {tx.from === "0x0000000000000000000000000000000000000000" ? (
                            <div className="type" id="mint"> MINT </div>
                        ) : (
                            tx.from === address.toLowerCase() ? (
                                <div className="type" id="sell"> SELL </div>
                            ) : (
                                <div className="type" id="buy"> BUY </div>
                            )
                        )}
                        <div className="name">
                                {tx.tokenName}
                                {" "}
                                <a href={`https://etherscan.io/token/${tx.contractAddress}`} target="_">({tx.tokenSymbol})</a>
                        </div>
                        <div className="id">
                            {tx.cost}
                        </div>
                        <div className="hash">
                            <a href={`https://etherscan.io/tx/${tx.hash}`} target="_">{tx.hash}</a>
                        </div>
                        <div className="date">
                            {handleTimeStamp(Number(tx.timeStamp))}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default App;
