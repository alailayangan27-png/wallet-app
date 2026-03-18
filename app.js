let provider = null;
let wallet = null;

const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com"
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
    wallet.toString().slice(0, 6) + "...";

  getBalance();
}

// BALANCE
async function getBalance() {
  const balance = await connection.getBalance(wallet);
  document.getElementById("sol").innerText =
    (balance / 1e9).toFixed(4) + " SOL";
}

// OPEN SEND
function openSend() {
  document.getElementById("sendBox").style.display = "block";
}

// RECEIVE
function receive() {
  if (!wallet) return alert("Connect first");

  navigator.clipboard.writeText(wallet.toString());
  alert("Address copied!");
}

// SEND SOL
async function send() {
  try {
    const to = document.getElementById("to").value;
    const amount = document.getElementById("sendAmount").value;

    if (!to || !amount) return alert("Fill all fields");

    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports: parseFloat(amount) * 1e9
      })
    );

    transaction.feePayer = wallet;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const signed = await provider.signAndSendTransaction(transaction);

    document.getElementById("status").innerText =
      "Sent: " + signed.signature;

  } catch (err) {
    document.getElementById("status").innerText = "Send failed";
  }
}

// TOKEN
function getTokenMint(token) {
  if (token === "USDC") return "Es9vMFrzaCERsNfZLxE3v8R1qZ8c7Y3Yw5wz2nZ1t4y";
  if (token === "BONK") return "DezXAZ8z7PnrnRJjz3xP9mH7w3Cz7YX8hGZ1x1h9s9d";
  if (token === "JUP") return "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
}

// SWAP
async function swap() {
  try {
    if (!wallet) return alert("Connect first");

    const amount = document.getElementById("amount").value;
    const token = document.getElementById("token").value;

    const lamports = parseFloat(amount) * 1e9;

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
        userPublicKey: wallet.toString()
      })
    });

    const swapData = await swapRes.json();

    const tx = solanaWeb3.VersionedTransaction.deserialize(
      new Uint8Array(swapData.swapTransaction)
    );

    const signed = await provider.signAndSendTransaction(tx);

    document.getElementById("status").innerText =
      "Swap: " + signed.signature;

  } catch (err) {
    document.getElementById("status").innerText = "Swap failed";
  }
    }
