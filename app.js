let provider;
let wallet;

// CONNECT
async function connectWallet() {
  try {
    if (!window.solana) {
      alert("Open inside Phantom browser");
      return;
    }

    provider = window.solana;

    const res = await provider.connect();
    wallet = res.publicKey;

    const full = wallet.toString();
    const short = full.slice(0,4) + "..." + full.slice(-4);

    document.getElementById("address").innerText = short;

    getBalance();

    setTimeout(loadTwitter, 1500);

  } catch (err) {
    console.log(err);
    alert("Connection failed");
  }
}

// BALANCE (HYBRID FIX)
async function getBalance() {
  if (!wallet) return;

  const address = wallet.toString();

  // RPC
  try {
    const connection = new solanaWeb3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    const lamports = await connection.getBalance(wallet);

    if (lamports !== null) {
      const sol = lamports / 1e9;
      document.getElementById("sol").innerText =
        sol.toFixed(4) + " SOL";
      return;
    }

  } catch (e) {
    console.log("RPC gagal");
  }

  // FALLBACK
  try {
    const res = await fetch(
      "https://public-api.solscan.io/account/" + address
    );

    const data = await res.json();

    if (data && data.lamports) {
      const sol = data.lamports / 1e9;
      document.getElementById("sol").innerText =
        sol.toFixed(4) + " SOL";
      return;
    }

  } catch (e) {
    console.log("Solscan gagal");
  }

  document.getElementById("sol").innerText = "0.0000 SOL";
}

// SEND UI
function openSend() {
  document.getElementById("sendBox").classList.toggle("hidden");
}

// RECEIVE
function receive() {
  if (!wallet) return alert("Connect first");

  navigator.clipboard.writeText(wallet.toString());
  alert("Address copied!");
}

// VALIDATE ADDRESS
function valid(addr) {
  try {
    new solanaWeb3.PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

// SEND SOL
async function sendSOL() {
  try {
    if (!wallet) return alert("Connect first");

    const to = document.getElementById("to").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (!valid(to)) return alert("Invalid address");
    if (!amount || amount <= 0) return alert("Invalid amount");

    const connection = new solanaWeb3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports: Math.floor(amount * 1e9)
      })
    );

    tx.feePayer = wallet;

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signed = await provider.signAndSendTransaction(tx);

    alert("Success: " + signed.signature);

    getBalance();

  } catch (err) {
    console.log(err);
    alert("Send failed");
  }
}

// FIX TWITTER
function loadTwitter() {
  if (window.twttr && window.twttr.widgets) {
    window.twttr.widgets.load();
  }
}
