import { useEffect, useState } from 'react';
import './App.css';
import { TonConnectButton } from '@tonconnect/ui-react';
import TonConnect, {
  isWalletInfoCurrentlyEmbedded,
  WalletInfo,
  WalletInfoCurrentlyEmbedded,
} from '@tonconnect/sdk';

const connector = new TonConnect({
  manifestUrl: 'https://myapp.com/assets/tonconnect-manifest.json', // replace with your manifest URL
});

connector.restoreConnection();

function App() {
  const [walletsList, setWalletsList] = useState<WalletInfo[]>([]);
  const [universalLink, setUniversalLink] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to wallet status changes
    const unsubscribe = connector.onStatusChange(() => {
      // trigger re-render if needed; we can read connector.wallet directly
    });

    // Fetch wallets and handle embedded wallet
    const initWallets = async () => {
      try {
        const list = await connector.getWallets();
        setWalletsList(list);

        // Detect embedded wallet
        const embeddedWallet = list.find(isWalletInfoCurrentlyEmbedded) as WalletInfoCurrentlyEmbedded | undefined;
        if (embeddedWallet) {
          await connector.connect({ jsBridgeKey: embeddedWallet.jsBridgeKey });
          return;
        }

        // Prepare universal link for user (QR code / deeplink)
        const walletConnectionSource = {
          universalLink: 'https://app.tonkeeper.com/ton-connect',
          bridgeUrl: 'https://bridge.tonapi.io/bridge',
        };
        const link = await connector.connect(walletConnectionSource);
        setUniversalLink(link);
      } catch (err) {
        console.error('Error initializing wallets:', err);
      }
    };

    initWallets();

    return () => {
      unsubscribe();
    };
  }, []);

  // Safe connected wallet address
  const walletAddress = connector.wallet?.account?.address ?? 'Not connected';

  // Example transaction
  const sendTransaction = async () => {
    if (!connector.connected) {
      alert('Please connect wallet first!');
      return;
    }

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        { address: 'EQBBJBB3HagsujBqVfqeDUPJ0kXjgTPLWPFFffuNXNiJL0aA', amount: '20000000' },
        { address: 'EQDmnxDMhId6v1Ofg_h5KR5coWlFG6e86Ro3pc7Tq4CA0-Jn', amount: '60000000' },
      ],
    };

    try {
      const result = await connector.sendTransaction(transaction);
      console.log('Transaction result:', result);
      alert('Transaction sent successfully!');
    } catch (err: any) {
      if (err?.name === 'UserRejectedError') {
        alert('You rejected the transaction!');
      } else {
        console.error('Unknown error:', err);
        alert('Unknown error occurred. Check console.');
      }
    }
  };

  return (
    <div>
      <h1>CRAPPZ Dice Game</h1>

      <TonConnectButton />

      <p>Connected wallet: {walletAddress}</p>

      {universalLink && (
        <p>
          Connect via link (QR or deeplink): <a href={universalLink}>{universalLink}</a>
        </p>
      )}

      <h3>Available Wallets:</h3>
      <ul>
        {walletsList.map((w) => (
          <li key={w.name}>
            <img src={w.imageUrl} alt={w.name} width={24} height={24} /> {w.name}
          </li>
        ))}
      </ul>

      <button onClick={sendTransaction}>Send Example Transaction</button>
    </div>
  );
}

export default App;