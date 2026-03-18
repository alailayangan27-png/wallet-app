let provider = null;
let wallet = null;

// 🔥 RPC SUPER STABIL
const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com",
  {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000
  }
);

// CONNECT
async function connectWallet() {
  try {
    provider = window.solana;

    if (!provider || !provider.isPhantom) {
      alert("WAJIB buka di Phantom browser");
      return;
    }

    const res = await provider.connect({ onlyIfTrusted: false });
    wallet = res.publicKey;

    const full = wallet.toString();
    const short = full.slice(0, 4) + "..." + full.slice(-4);

    const addrEl = document.getElementById("address");
    addrEl.innerText = short;

    // copy saat klik
    addrEl.onclick = () => {
      navigator.clipboard.writeText(full);
      alert("Address copied!");
    };

    console.log("CONNECTED:", full);

    getBalance();

  } catch (e) {
    console.log("CONNECT ERROR:", e);
  }
}

// BALANCE (FIXED)
async function getBalance() {
  try {
    if (!wallet) return;

    const balance = await connection.getBalance(wallet);

    const sol = balance / 1e9;

    console.log("REAL BALANCE:", sol);

    document.getElementById("sol").innerText =
      sol.toFixed(4) + " SOL";

  } catch (err) {
    console.log("BALANCE ERROR:", err);
    document.getElementById("sol").innerText = "Error";
  }
}

// AUTO REFRESH CEPAT
setInterval(() => {
  if (wallet) getBalance();
}, 2000);

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

// VALIDATE
function isValidAddress(address) {
  try {
    new solanaWeb3.PublicKey(address);
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
