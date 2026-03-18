let wallet = null;
const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");

async function connectWallet() {
  if (!window.solana) {
    alert("Install Phantom Wallet");
    return;
  }

  const res = await window.solana.connect();
  wallet = res.publicKey;

  getBalance();
}

async function getBalance() {
  const balance = await connection.getBalance(wallet);
  const sol = balance / 1e9;

  document.getElementById("sol").innerText = sol.toFixed(4) + " SOL";

  const price = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
  const data = await price.json();

  const usd = sol * data.solana.usd;

  document.getElementById("usd").innerText = "$" + usd.toFixed(2);
  document.getElementById("solUsd").innerText = "$" + usd.toFixed(2);
}

function openSend() {
  alert("Send feature coming next 🔥");
}

function buy() {
  window.open("https://moonpay.com");
}
