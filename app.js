let provider;
let wallet;

// =======================
// CONNECT WALLET
// =======================
async function connectWallet() {
  try {
    if (!window.solana) {
      alert("Open inside Phantom browser");
      return;
    }

    provider = window.solana;

    if (!provider.isPhantom) {
      alert("Phantom not detected");
      return;
    }

    const res = await provider.connect({ onlyIfTrusted: false });
    wallet = res.publicKey;

    const full = wallet.toString();
    const short = full.slice(0, 4) + "..." + full.slice(-4);

    const addr = document.getElementById("address");
    addr.innerText = short;

    addr.onclick = () => {
      navigator.clipboard.writeText(full);
      alert("Address copied!");
    };

    console.log("CONNECTED:", full);

    setTimeout(() => {
      getBalance();
    }, 800);

  } catch (err) {
    console.log("CONNECT ERROR:", err);
    alert("Connection failed");
  }
}

// AUTO CONNECT
window.addEventListener("load", async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      const res = await window.solana.connect({ onlyIfTrusted: true });

      wallet = res.publicKey;

      const full = wallet.toString();
      const short = full.slice(0, 4) + "..." + full.slice(-4);

      document.getElementById("address").innerText = short;

      getBalance();
    } catch {}
  }
});

// =======================
// GET BALANCE (SOLSCAN)
// =======================
async function getBalance() {
  try {
    if (!wallet) return;

    const address = wallet.toString();

    const res = await fetch(
      "https://public-api.solscan.io/account/" + address
    );

    const data = await res.json();

    if (!data || !data.lamports) {
      document.getElementById("sol").innerText = "0.0000 SOL";
      return;
    }

    const sol = data.lamports / 1e9;

    document.getElementById("sol").innerText =
      sol.toFixed(4) + " SOL";

  } catch (err) {
    console.log("BALANCE ERROR:", err);
    document.getElementById("sol").innerText = "0.0000 SOL";
  }
}

// AUTO REFRESH
setInterval(() => {
  if (wallet) getBalance();
}, 5000);

// =======================
// UI
// =======================
function openSend() {
  document.getElementById("sendBox").classList.toggle("hidden");
}

// RECEIVE
function receive() {
  if (!wallet) return alert("Connect first");

  navigator.clipboard.writeText(wallet.toString());
  alert("Address copied!");
}

// =======================
// VALIDATE ADDRESS
// =======================
function isValidAddress(addr) {
  try {
    new solanaWeb3.PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

// =======================
// SEND SOL
// =======================
async function send() {
  try {
    if (!wallet) return alert("Connect first");

    const to = document.getElementById("to").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (!isValidAddress(to)) return alert("Invalid address");
    if (!amount || amount <= 0) return alert("Invalid amount");

    const lamports = Math.floor(amount * 1e9);

    const connection = new solanaWeb3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

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

    document.getElementById("status").innerText = "Processing...";

    await connection.confirmTransaction(signed.signature);

    document.getElementById("status").innerText =
      "Success: " + signed.signature;

    getBalance();

  } catch (err) {
    console.log("SEND ERROR:", err);
    document.getElementById("status").innerText = "Failed";
  }
}
