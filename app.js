let wallet = null;
let quoteData = null;

const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");

// CONNECT
async function connectWallet() {
  if (!window.solana) return alert("Install Phantom");

  const res = await window.solana.connect();
  wallet = res.publicKey;

  getBalance();
}

// BALANCE
async function getBalance() {
  const balance = await connection.getBalance(wallet);
  const sol = balance / 1e9;

  document.getElementById("sol").innerText = sol.toFixed(4) + " SOL";
  document.getElementById("solBalance").innerText = sol.toFixed(4) + " SOL";

  const price = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
  const data = await price.json();

  const usd = sol * data.solana.usd;

  document.getElementById("usd").innerText = "$" + usd.toFixed(2);
  document.getElementById("solUsd").innerText = "$" + usd.toFixed(2);
}

// SEND
async function openSend() {
  if (!wallet) return alert("Connect first");

  const to = prompt("Address:");
  const amount = prompt("SOL:");

  if (!to || !amount) return;

  const tx = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.transfer({
      fromPubkey: wallet,
      toPubkey: new solanaWeb3.PublicKey(to),
      lamports: amount * 1e9
    })
  );

  tx.feePayer = wallet;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  const signed = await window.solana.signAndSendTransaction(tx);

  alert("Sent: " + signed.signature);
}

// QUOTE
async function getQuote() {
  const amount = document.getElementById("amount").value;
  const token = document.getElementById("token").value;

  if (!amount) return alert("Enter amount");

  const lamports = amount * 1e9;

  const outputMint = token === "USDC"
    ? "Es9vMFrzaCERsNfZLxE3v8R1qZ8c7Y3Yw5wz2nZ1t4y"
    : "DezXAZ8z7PnrnRJjz3xP9mH7w3Cz7YX8hGZ1x1h9s9d";

  const res = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outputMint}&amount=${lamports}`);
  const data = await res.json();

  quoteData = data.data[0];

  document.getElementById("quote").innerText =
    "Est: " + (quoteData.outAmount / 1e6).toFixed(4);
}

// SWAP
async function swap() {
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

  const signed = await window.solana.signAndSendTransaction(tx);

  alert("Swap: " + signed.signature);
}

// BUY
function buy() {
  window.open("https://moonpay.com");
}
