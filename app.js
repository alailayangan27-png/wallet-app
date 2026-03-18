let wallet = null;
let provider = null;
let quoteData = null;

const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");

// DETECT WALLET
function getProvider() {
  if ("solana" in window) {
    const p = window.solana;
    if (p.isPhantom) return p;
  }
  return null;
}

// CONNECT
async function connectWallet() {
  try {
    provider = getProvider();

    if (!provider) {
      alert("Install Phantom Wallet");
      return;
    }

    const res = await provider.connect();
    wallet = res.publicKey;

    alert("Connected");
    getBalance();

  } catch (err) {
    alert("Connect error");
  }
}

// BALANCE
async function getBalance() {
  try {
    const balance = await connection.getBalance(wallet);
    const sol = balance / 1e9;

    document.getElementById("sol").innerText = sol.toFixed(4) + " SOL";
    document.getElementById("solBalance").innerText = sol.toFixed(4) + " SOL";

    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const data = await res.json();

    const usd = sol * data.solana.usd;

    document.getElementById("usd").innerText = "$" + usd.toFixed(2);
    document.getElementById("solUsd").innerText = "$" + usd.toFixed(2);

  } catch (err) {
    console.log(err);
  }
}

// SEND
async function openSend() {
  if (!wallet) return alert("Connect first");

  const to = prompt("Address:");
  const amount = prompt("SOL:");

  if (!to || !amount) return;

  try {
    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports: Math.floor(amount * 1e9)
      })
    );

    tx.feePayer = wallet;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signed = await provider.signAndSendTransaction(tx);

    alert("Sent!");

  } catch {
    alert("Send error");
  }
}

// GET PRICE (FIX TOTAL)
async function getQuote() {
  try {
    document.getElementById("quote").innerText = "Loading...";

    const amount = document.getElementById("amount").value;
    const token = document.getElementById("token").value;

    if (!amount || isNaN(amount)) {
      alert("Enter valid amount");
      return;
    }

    const lamports = Math.floor(parseFloat(amount) * 1e9);

    const outputMint = token === "USDC"
      ? "Es9vMFrzaCERsNfZLxE3v8R1qZ8c7Y3Yw5wz2nZ1t4y"
      : "DezXAZ8z7PnrnRJjz3xP9mH7w3Cz7YX8hGZ1x1h9s9d";

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outputMint}&amount=${lamports}&slippageBps=50`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      document.getElementById("quote").innerText = "No route found";
      return;
    }

    quoteData = data.data[0];

    const out = quoteData.outAmount / 1e6;

    document.getElementById("quote").innerText =
      "≈ " + out.toFixed(4) + " " + token;

  } catch (err) {
    console.log(err);
    document.getElementById("quote").innerText = "Error";
  }
}

// SWAP
async function swap() {
  try {
    if (!wallet) return alert("Connect first");
    if (!quoteData) return alert("Get price first");

    const res = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: wallet.toString(),
        wrapAndUnwrapSol: true
      })
    });

    const data = await res.json();

    const tx = solanaWeb3.VersionedTransaction.deserialize(
      new Uint8Array(data.swapTransaction)
    );

    const signed = await provider.signAndSendTransaction(tx);

    alert("Swap success");

  } catch (err) {
    console.log(err);
    alert("Swap error");
  }
}

// BUY
function buy() {
  window.open("https://moonpay.com");
}
