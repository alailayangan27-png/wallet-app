let wallet = null;
const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");

async function connectWallet() {
  try {
    if (!window.solana) {
      alert("Install Phantom Wallet!");
      return;
    }

    const res = await window.solana.connect();
    wallet = res.publicKey;

    alert("Connected: " + wallet.toString());

    getBalance();
  } catch (err) {
    console.log(err);
  }
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

async function openSend() {
  if (!wallet) {
    alert("Connect wallet first!");
    return;
  }

  const to = prompt("Receiver address:");
  const amount = prompt("Amount (SOL):");

  if (!to || !amount) return;

  try {
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports: parseFloat(amount) * 1e9,
      })
    );

    transaction.feePayer = wallet;

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signed = await window.solana.signAndSendTransaction(transaction);

    alert("TX Success: " + signed.signature);
  } catch (err) {
    console.log(err);
    alert("Transaction failed");
  }
}

function buy() {
  window.open("https://moonpay.com");
}
