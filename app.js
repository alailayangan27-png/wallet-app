let wallet = null;
let provider = null;
let quoteData = null;

const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");

// ✅ DETECT PHANTOM (FIX)
function getProvider() {
  if ("solana" in window) {
    const p = window.solana;
    if (p.isPhantom) return p;
  }
  return null;
}

// ✅ CONNECT WALLET (FIX TOTAL)
async function connectWallet() {
  try {
    provider = getProvider();

    if (!provider) {
      alert("Phantom not found! Install it first.");
      return;
    }

    const res = await provider.connect();
    wallet = res.publicKey;

    alert("Connected: " + wallet.toString());

    getBalance();

  } catch (err) {
    console.log(err);
    alert("Connection failed");
  }
}

// ✅ GET BALANCE (SAFE)
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

// ✅ SEND SOL (FIX)
async function openSend() {
  try {
    if (!wallet) {
      alert("Connect wallet first");
      return;
    }

    const to = prompt("Recipient address:");
    const amount = prompt("Amount (SOL):");

    if (!to || !amount) return;

    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports: Math.floor(parseFloat(amount) * 1e9)
      })
    );

    tx.feePayer = wallet;

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signed = await provider.signAndSendTransaction(tx);

    alert("TX Success: " + signed.signature);

  } catch (err) {
    console.log(err);
    alert("Send failed");
  }
}

// ✅ GET QUOTE (FIX JUPITER API)
async function getQuote() {
  try {
    const amount = document.getElementById("amount").value;
    const token = document.getElementById("token").value;

    if (!amount) {
      alert("Enter amount");
      return;
    }

    const lamports = Math.floor(parseFloat(amount) * 1e9);

    const outputMint = token === "USDC"
      ? "Es9vMFrzaCERsNfZLxE3v8R1qZ8c7Y3Yw5wz2nZ1t4y"
      : "DezXAZ8z7PnrnRJjz3xP9mH7w3Cz7YX8hGZ1x1h9s9d";

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outputMint}&amount=${lamports}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      alert("No route found");
      return;
    }

    quoteData = data.data[0];

    document.getElementById("quote").innerText =
      "Est: " + (quoteData.outAmount / 1e6).toFixed(4);

  } catch (err) {
    console.log(err);
    alert("Quote error");
  }
}

// ✅ SWAP (FIX VERSIONED TX)
async function swap() {
  try {
    if (!wallet) {
      alert("Connect wallet first");
      return;
    }

    if (!quoteData) {
      alert("Get price first");
      return;
    }

    const res = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: wallet.toString(),
        wrapAndUnwrapSol: true
      })
    });

    const data = await res.json();

    if (!data.swapTransaction) {
      alert("Swap failed (no tx)");
      return;
    }

    const tx = solanaWeb3.VersionedTransaction.deserialize(
      new Uint8Array(data.swapTransaction)
    );

    const signed = await provider.signAndSendTransaction(tx);

    alert("Swap Success: " + signed.signature);

  } catch (err) {
    console.log(err);
    alert("Swap failed");
  }
}

// ✅ BUY BUTTON (SAFE)
function buy() {
  window.open("https://moonpay.com", "_blank");
      }
