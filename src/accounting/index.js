// Node.js版 学生アカウント管理アプリケーション
// COBOLアプリのビジネスロジック・データフロー・メニューを再現

const readline = require('readline');
const fs = require('fs');
const DATA_FILE = './accounts.json';

// データ永続化用ファイルの初期化
function loadAccounts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveAccounts(accounts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2), 'utf8');
}

// メニュー表示
function showMenu() {
  console.log('\n--- 学生アカウント管理システム ---');
  console.log('1. 新規登録');
  console.log('2. 情報照会');
  console.log('3. 情報更新');
  console.log('4. アカウント削除');
  console.log('5. 終了');
}

// 必須項目チェック
function validateInput(account) {
  if (!account.id || !account.name || !account.studentNo) {
    console.log('エラー: 学生ID・氏名・学籍番号は必須です。');
    return false;
  }
  return true;
}

// メイン処理
async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let accounts = loadAccounts();
  while (true) {
    showMenu();
    const choice = await question(rl, '操作を選択してください: ');
    if (choice === '1') {
      // 新規登録
      const id = await question(rl, '学生ID: ');
      if (accounts.find(a => a.id === id)) {
        console.log('エラー: この学生IDは既に登録されています。');
        continue;
      }
      const name = await question(rl, '氏名: ');
      const studentNo = await question(rl, '学籍番号: ');
      const account = { id, name, studentNo };
      if (!validateInput(account)) continue;
      accounts.push(account);
      saveAccounts(accounts);
      console.log('登録が完了しました。');
    } else if (choice === '2') {
      // 情報照会
      const id = await question(rl, '照会する学生ID: ');
      const account = accounts.find(a => a.id === id);
      if (!account) {
        console.log('エラー: 学生IDが見つかりません。');
      } else {
        console.log(`ID: ${account.id}\n氏名: ${account.name}\n学籍番号: ${account.studentNo}`);
      }
    } else if (choice === '3') {
      // 情報更新
      const id = await question(rl, '更新する学生ID: ');
      const idx = accounts.findIndex(a => a.id === id);
      if (idx === -1) {
        console.log('エラー: 学生IDが見つかりません。');
        continue;
      }
      const name = await question(rl, '新しい氏名: ');
      const studentNo = await question(rl, '新しい学籍番号: ');
      const updated = { id, name, studentNo };
      if (!validateInput(updated)) continue;
      accounts[idx] = updated;
      saveAccounts(accounts);
      console.log('更新が完了しました。');
    } else if (choice === '4') {
      // アカウント削除
      const id = await question(rl, '削除する学生ID: ');
      const idx = accounts.findIndex(a => a.id === id);
      if (idx === -1) {
        console.log('エラー: 学生IDが見つかりません。');
        continue;
      }
      const confirm = await question(rl, '本当に削除しますか？ (yes/no): ');
      if (confirm.toLowerCase() === 'yes') {
        accounts.splice(idx, 1);
        saveAccounts(accounts);
        console.log('削除が完了しました。');
      } else {
        console.log('削除をキャンセルしました。');
      }
    } else if (choice === '5') {
      rl.close();
      break;
    } else {
      console.log('無効な選択です。');
    }
  }
}

function question(rl, q) {
  return new Promise(resolve => rl.question(q, resolve));
}

main();
