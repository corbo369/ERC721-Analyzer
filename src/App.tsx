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
}

const App: React.FC = () => {
    const [address, setAddress] = useState<string>('');
    const [transactions, setTransactions] = useState<ERC721Transaction[]>([]);

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
                const formattedTransactions: ERC721Transaction[] = response.data.result.map(
                    (rawTransaction: any) => {
                        let id = rawTransaction.tokenID;
                        if (id > 10000000) id = 0;
                        return {
                            tokenName: rawTransaction.tokenName,
                            tokenSymbol: rawTransaction.tokenSymbol,
                            contractAddress: rawTransaction.contractAddress,
                            tokenID: id,
                            from: rawTransaction.from,
                            to: rawTransaction.to,
                            hash: rawTransaction.hash,
                            timeStamp: rawTransaction.timeStamp,
                        };
                    }
                );
                setTransactions(formattedTransactions);
            } else {
                throw new Error('Failed to fetch ERC721 transactions');
            }
        } catch (error) {
            // @ts-ignore
            throw new Error(error.message || 'Error fetching ERC721 transactions');
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
                        TOKEN ID
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
                            #{tx.tokenID}
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
