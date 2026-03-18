let provider = null;
let wallet = null;

const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com"
);

// DETECT WALLET
function getProvider() {
  if (window.solana && window.solana.isPhantom) {
    return window.solana;
  }
  return null;
}

// CONNECT
async function connectWallet() {
  try {
    provider = getProvider();

    if (!provider) {
      alert("Open in Phantom browser");
      return;
    }

    const res = await provider.connect();
    wallet = res.publicKey;

    document.getElementById("address").innerText =
      wallet.toString().slice(0, 6) + "...";

    getBalance();

  } catch (err) {
    alert("Connect failed");
  }
}

// GET BALANCE
async function getBalance() {
  try {
    const balance = await connection.getBalance(wallet);
    const sol = balance / 1e9;

    document.getElementById("sol").innerText =
      sol.toFixed(4) + " SOL";

  } catch (err) {
    console.log(err);
  }
}

// TOKEN MINT
function getTokenMint(token) {
  if (token === "USDC") return "Es9vMFrzaCERsNfZLxE3v8R1qZ8c7Y3Yw5wz2nZ1t4y";
  if (token === "BONK") return "DezXAZ8z7PnrnRJjz3xP9mH7w3Cz7YX8hGZ1x1h9s9d";
  if (token === "JUP") return "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
}

// SWAP REAL
async function swap() {
  try {
    if (!wallet) return alert("Connect first");

    const amount = document.getElementById("amount").value;
    const token = document.getElementById("token").value;

    if (!amount || isNaN(amount)) {
      alert("Invalid amount");
      return;
    }

    document.getElementById("status").innerText = "Loading...";

    const lamports = Math.floor(parseFloat(amount) * 1e9);

    const inputMint = "So11111111111111111111111111111111111111112";
    const outputMint = getTokenMint(token);

    // GET QUOTE
    const quoteRes = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=50`
    );

    const quoteData = await quoteRes.json();

    if (!quoteData.data || quoteData.data.length === 0) {
      document.getElementById("status").innerText = "No route";
      return;
    }

    const route = quoteData.data[0];

    // GET TX
    const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quoteResponse: route,
        userPublicKey: wallet.toString(),
        wrapAndUnwrapSol: true
      })
    });

    const swapData = await swapRes.json();

    const tx = solanaWeb3.VersionedTransaction.deserialize(
      new Uint8Array(swapData.swapTransaction)
    );

    const signed = await provider.signAndSendTransaction(tx);

    document.getElementById("status").innerText =
      "Success: " + signed.signature;

  } catch (err) {
    console.log(err);
    document.getElementById("status").innerText = "Error";
  }
}
