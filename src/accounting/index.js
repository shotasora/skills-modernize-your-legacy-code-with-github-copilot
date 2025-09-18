
// Node.js版 学校会計システムアプリ（COBOLロジック移植）
const readline = require('readline');
const fs = require('fs');
const DATA_FILE = './balance.json';

// データ永続化
function loadBalance() {
  if (!fs.existsSync(DATA_FILE)) return 1000.00; // 初期残高
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return typeof data.balance === 'number' ? data.balance : 1000.00;
  } catch {
    return 1000.00;
  }
}
function saveBalance(balance) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ balance }), 'utf8');
}

async function mainMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let continueFlag = true;
  while (continueFlag) {
  console.log('--------------------------------');
  console.log('Account Management System');
  console.log('1. View Balance');
  console.log('2. Credit Account');
  console.log('3. Debit Account');
  console.log('4. Exit');
  console.log('--------------------------------');
  const answer = await question(rl, 'Enter your choice (1-4): ');
    switch (answer.trim()) {
      case '1':
  await viewBalance();
        break;
      case '2':
        await creditAccount(rl);
        break;
      case '3':
        await debitAccount(rl);
        break;
      case '4':
        continueFlag = false;
        break;
      default:
        console.log('1-4を選択してください。');
    }
  }
  rl.close();
  console.log('終了します。');
}

function question(rl, q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function viewBalance() {
  const balance = loadBalance();
  console.log(`Current balance: ${balance.toFixed(2)}`);
}

async function creditAccount(rl) {
  let balance = loadBalance();
  const input = await question(rl, 'Enter credit amount: ');
  const amount = parseFloat(input);
  if (isNaN(amount) || amount <= 0) {
    console.log('Please enter a valid amount.');
    return;
  }
  balance += amount;
  saveBalance(balance);
  console.log(`Amount credited. New balance: ${balance.toFixed(2)}`);
}

async function debitAccount(rl) {
  let balance = loadBalance();
  const input = await question(rl, 'Enter debit amount: ');
  const amount = parseFloat(input);
  if (isNaN(amount) || amount <= 0) {
    console.log('Please enter a valid amount.');
    return;
  }
  if (balance < amount) {
    console.log('Insufficient funds for this debit.');
    return;
  }
  balance -= amount;
  saveBalance(balance);
  console.log(`Amount debited. New balance: ${balance.toFixed(2)}`);
}

if (require.main === module) {
  mainMenu();
}
