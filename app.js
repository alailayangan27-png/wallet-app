let provider;
let wallet;

// 🔥 RPC RESMI (LEBIH STABIL)
const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// CONNECT
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

    addr.onclick = () => {
      navigator.clipboard.writeText(full);
      alert("Copied!");
    };

    console.log("CONNECTED:", full);

    // 🔥 langsung ambil balance
    await getBalance();

  } catch (err) {
    console.log("CONNECT ERROR:", err);
  }
}

// 🔥 BALANCE (PALING AKURAT)
async function getBalance() {
  try {
    if (!wallet) return;

    const info = await connection.getAccountInfo(wallet);

    if (!info) {
      console.log("Account kosong / belum ada");
      document.getElementById("sol").innerText = "0.0000 SOL";
      return;
    }

    const lamports = info.lamports;
    const sol = lamports / 1e9;

    console.log("LAMPORTS:", lamports);
    console.log("SOL:", sol);

    document.getElementById("sol").innerText =
      sol.toFixed(4) + " SOL";

  } catch (err) {
    console.log("BALANCE ERROR:", err);

    document.getElementById("sol").innerText = "0.0000 SOL";
  }
}

// 🔥 AUTO UPDATE (REALTIME RASA PHANTOM)
setInterval(() => {
  if (wallet) getBalance();
}, 2500);

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
