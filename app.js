let provider;
let wallet;

// RPC stabil (tidak gampang error)
const connection = new solanaWeb3.Connection(
  "https://rpc.ankr.com/solana",
  "confirmed"
);

// CONNECT WALLET
async function connectWallet() {
  try {
    provider = window.solana;

    if (!provider || !provider.isPhantom) {
      alert("Open using Phantom browser");
      return;
    }

    const res = await provider.connect();
    wallet = res.publicKey;

    const full = wallet.toString();
    const short = full.slice(0, 4) + "..." + full.slice(-4);

    const addrEl = document.getElementById("address");
    addrEl.innerText = short;

    addrEl.onclick = () => {
      navigator.clipboard.writeText(full);
      alert("Address copied");
    };

    console.log("Connected:", full);

    // delay supaya tidak error
    setTimeout(() => {
      getBalance();
    }, 1000);

  } catch (err) {
    console.log("Connect error:", err);
  }
}

// GET BALANCE (ANTI ERROR)
async function getBalance() {
  try {
    if (!wallet) return;

    let balance = 0;

    // retry kalau RPC gagal
    for (let i = 0; i < 2; i++) {
      try {
        balance = await connection.getBalance(wallet);
        break;
      } catch (e) {
        console.log("Retry RPC...");
      }
    }

    const sol = balance / 1e9;

    console.log("Balance:", sol);

    document.getElementById("sol").innerText =
      sol.toFixed(4) + " SOL";

  } catch (err) {
    console.log("Balance error:", err);

    // jangan tampilkan error
    document.getElementById("sol").innerText = "0.0000 SOL";
  }
}

// AUTO UPDATE
setInterval(() => {
  if (wallet) getBalance();
}, 3000);

// UI
function openSend() {
  document.getElementById("sendBox").style.display = "block";
}

// RECEIVE
function receive() {
  if (!wallet) return alert("Connect first");

  navigator.clipboard.writeText(wallet.toString());
  alert("Address copied");
}

// VALIDASI ADDRESS
function isValidAddress(addr) {
  try {
    new solanaWeb3.PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

// SEND SOL
async function send() {
  try {
    if (!wallet) return alert("Connect first");

    const to = document.getElementById("to").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (!isValidAddress(to)) return alert("Invalid address");
    if (!amount || amount <= 0) return alert("Invalid amount");

    const lamports = Math.floor(amount * 1e9);

    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports: lamports
      })
    );

    tx.feePayer = wallet;

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signed = await provider.signAndSendTransaction(tx);

    document.getElementById("status").innerText = "Processing...";

    await connection.confirmTransaction(signed.signature);

    document.getElementById("status").innerHTML =
      "Success: " + signed.signature;

    getBalance();

  } catch (err) {
    console.log(err);
    document.getElementById("status").innerText = "Failed";
  }
}
