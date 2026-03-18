let provider = null;
let wallet = null;

// 🔥 STABLE RPC
const connection = new solanaWeb3.Connection(
  "https://rpc.ankr.com/solana"
);

// CONNECT
async function connectWallet() {
  provider = window.solana;

  if (!provider || !provider.isPhantom) {
    alert("Open in Phantom browser");
    return;
  }

  const res = await provider.connect();
  wallet = res.publicKey;

  document.getElementById("address").innerText =
    wallet.toString();

  console.log("Connected wallet:", wallet.toString());

  getBalance();
}

// REALTIME BALANCE
async function getBalance() {
  try {
    const balance = await connection.getBalance(wallet);
    document.getElementById("sol").innerText =
      (balance / 1e9).toFixed(4) + " SOL";
  } catch (e) {
    console.log(e);
  }
}

// AUTO REFRESH
setInterval(() => {
  if (wallet) getBalance();
}, 5000);

// SEND UI
function openSend() {
  document.getElementById("sendBox").style.display = "block";
}

// RECEIVE
function receive() {
  if (!wallet) return alert("Connect first");

  navigator.clipboard.writeText(wallet.toString());
  alert("Address copied!");
}

// VALIDATE ADDRESS
function isValidAddress(address) {
  try {
    new solanaWeb3.PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// SEND SOL (CONFIRMED)
async function send() {
  try {
    if (!wallet) return alert("Connect first");

    const to = document.getElementById("to").value.trim();
    const amount = document.getElementById("sendAmount").value;

    if (!isValidAddress(to)) return alert("Invalid address");
    if (parseFloat(amount) <= 0) return alert("Invalid amount");

    if (!confirm(`Send ${amount} SOL to:\n${to}`)) return;

    const lamports = Math.floor(parseFloat(amount) * 1e9);

    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports
      })
    );

    tx.feePayer = wallet;

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signed = await provider.signAndSendTransaction(tx);

    document.getElementById("status").innerText = "Confirming...";

    await connection.confirmTransaction(signed.signature);

    document.getElementById("status").innerHTML =
      `Success: <a href="https://solscan.io/tx/${signed.signature}" target="_blank">View TX</a>`;

    getBalance();

  } catch (err) {
    console.log(err);
    document.getElementById("status").innerText = "Send failed";
  }
}

// TOKEN
function getTokenMint(token) {
  if (token === "USDC") return "Es9vMFrzaCERsNfZLxE3v8R1qZ8c7Y3Yw5wz2nZ1t4y";
  if (token === "BONK") return "DezXAZ8z7PnrnRJjz3xP9mH7w3Cz7YX8hGZ1x1h9s9d";
  if (token === "JUP") return "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
}

// SWAP (CONFIRMED)
async function swap() {
  try {
    if (!wallet) return alert("Connect first");

    const amount = document.getElementById("amount").value;
    const token = document.getElementById("token").value;

    if (!amount || isNaN(amount)) return alert("Invalid amount");

    document.getElementById("status").innerText = "Processing...";

    const lamports = Math.floor(parseFloat(amount) * 1e9);

    const quoteRes = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${getTokenMint(token)}&amount=${lamports}`
    );

    const quote = await quoteRes.json();
    const route = quote.data[0];

    const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
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

    await connection.confirmTransaction(signed.signature);

    document.getElementById("status").innerHTML =
      `Swap Success: <a href="https://solscan.io/tx/${signed.signature}" target="_blank">View</a>`;

    getBalance();

  } catch (err) {
    console.log(err);
    document.getElementById("status").innerText = "Swap failed";
  }
}
