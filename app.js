let provider;
let wallet;

// =======================
// CONNECT WALLET
// =======================
async function connectWallet() {
  try {
    provider = window.solana;

    if (!provider || !provider.isPhantom) {
      alert("Open inside Phantom browser");
      return;
    }

    const res = await provider.connect();
    wallet = res.publicKey;

    const full = wallet.toString();
    const short = full.slice(0, 4) + "..." + full.slice(-4);

    const addr = document.getElementById("address");
    addr.innerText = short;

    // copy address
    addr.onclick = () => {
      navigator.clipboard.writeText(full);
      alert("Address copied!");
    };

    console.log("CONNECTED:", full);

    // 🔥 ambil balance
    getBalance();

  } catch (err) {
    console.log("CONNECT ERROR:", err);
  }
}

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

    console.log("BALANCE:", sol);

    document.getElementById("sol").innerText =
      sol.toFixed(4) + " SOL";

  } catch (err) {
    console.log("BALANCE ERROR:", err);
    document.getElementById("sol").innerText = "0.0000 SOL";
  }
}

// 🔄 AUTO REFRESH BALANCE
setInterval(() => {
  if (wallet) getBalance();
}, 5000);

// =======================
// UI CONTROL
// =======================
function openSend() {
  document.getElementById("sendBox").classList.toggle("hidden");
}

// RECEIVE (COPY ADDRESS)
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
        fromPubkey: wallet
