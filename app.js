let provider;
let wallet;

// 🔥 MULTI RPC (ANTI GAGAL)
const RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana.public-rpc.com"
];

function getConnection() {
  const url = RPCS[Math.floor(Math.random() * RPCS.length)];
  return new solanaWeb3.Connection(url, "confirmed");
}

// CONNECT
async function connectWallet() {
  try {
    provider = window.solana;

    if (!provider || !provider.isPhantom) {
      alert("Open in Phantom browser");
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

    getBalance();

  } catch (err) {
    console.log("CONNECT ERROR:", err);
  }
}

// 🔥 BALANCE (MULTI TRY)
async function getBalance() {
  try {
    if (!wallet) return;

    let lamports = 0;
    let success = false;

    for (let i = 0; i < RPCS.length; i++) {
      try {
        const connection = getConnection();
        lamports = await connection.getBalance(wallet);

        if (lamports !== null) {
          success = true;
          break;
        }
      } catch (e) {
        console.log("RPC FAIL, TRY NEXT...");
      }
    }

    if (!success) {
      console.log("ALL RPC FAILED");
      document.getElementById("sol").innerText = "0.0000 SOL";
      return;
    }

    const sol = lamports / 1e9;

    console.log("BALANCE:", sol);

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
}, 4000);

// UI
function openSend() {
  document.getElementById("sendBox").classList.toggle("hidden");
}

// RECEIVE
function receive() {
  if (!wallet) return alert("Connect first");

  navigator.clipboard.writeText(wallet.toString());
  alert("Address copied");
}

// VALIDASI
function isValidAddress(addr) {
  try {
    new solanaWeb3.PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

// SEND (pakai RPC pertama)
async function send() {
  try {
    if (!wallet) return alert("Connect first");

    const to = document.getElementById("to").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (!isValidAddress(to)) return alert("Invalid address");
    if (!amount || amount <= 0) return alert("Invalid amount");

    const lamports = Math.floor(amount * 1e9);

    const connection = new solanaWeb3.Connection(RPCS[0], "confirmed");

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
    console.log(err);
    document.getElementById("status").innerText = "Failed";
  }
}
