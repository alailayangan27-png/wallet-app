let provider;
let wallet;

async function connectWallet() {
  try {
    if (!window.solana) {
      alert("Open in Phantom browser");
      return;
    }

    provider = window.solana;

    const res = await provider.connect();
    wallet = res.publicKey;

    const full = wallet.toString();
    const short = full.slice(0,4) + "..." + full.slice(-4);

    document.getElementById("address").innerText = short;

    getBalance();

  } catch (err) {
    console.log(err);
    alert("Connection failed");
  }
}

async function getBalance() {
  try {
    const connection = new solanaWeb3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    const lamports = await connection.getBalance(wallet);
    const sol = lamports / 1e9;

    document.getElementById("sol").innerText =
      sol.toFixed(4) + " SOL";

  } catch (err) {
    console.log(err);
    document.getElementById("sol").innerText = "Error";
  }
}

async function sendSOL() {
  try {
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;

    const connection = new solanaWeb3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: new solanaWeb3.PublicKey(to),
        lamports: amount * 1e9
      })
    );

    transaction.feePayer = wallet;

    let { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;

    const signed = await provider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());

    alert("Success: " + signature);

  } catch (err) {
    console.log(err);
    alert("Send failed");
  }
}

function receive() {
  if (!wallet) return;

  const full = wallet.toString();
  navigator.clipboard.writeText(full);

  alert("Address copied!");
}
