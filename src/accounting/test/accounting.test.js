const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const mockStdin = require('mock-stdin').stdin;
const { spawn } = require('child_process');

describe('学生アカウント管理システム (Node.js)', function() {
  const DATA_FILE = path.join(__dirname, '../accounts.json');
  let stdin;

  beforeEach(() => {
    // テスト用データファイルを初期化
    if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
    stdin = mockStdin();
  });

  afterEach(() => {
    if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
    stdin.restore();
  });

  function runApp(inputs, done, assertions) {
    const proc = spawn('node', [path.join(__dirname, '../index.js')], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    proc.stdout.on('data', data => { output += data.toString(); });
    proc.stderr.on('data', data => { output += data.toString(); });
    proc.on('close', code => { assertions(output); done(); });
    // 入力を順次送信
    (async () => {
      for (const input of inputs) {
        await new Promise(res => setTimeout(res, 100));
        proc.stdin.write(input + '\n');
      }
    })();
  }

  it('TC-01: 学生アカウント新規登録（正常系）', function(done) {
    runApp(['1', '100', '山田太郎', 'S0001', '5'], done, (output) => {
      expect(output).to.include('登録が完了しました。');
    });
  });

  it('TC-02: 学生アカウント新規登録（ID重複）', function(done) {
    // 先に1件登録
    fs.writeFileSync(DATA_FILE, JSON.stringify([{ id: '100', name: '山田太郎', studentNo: 'S0001' }], null, 2));
    runApp(['1', '100', '佐藤花子', 'S0002', '5'], done, (output) => {
      expect(output).to.include('この学生IDは既に登録されています。');
    });
  });

  it('TC-03: 必須項目未入力時の登録', function(done) {
    runApp(['1', '', '山田太郎', '', '5'], done, (output) => {
      expect(output).to.include('エラー: 学生ID・氏名・学籍番号は必須です。');
    });
  });

  it('TC-04: 学生アカウント情報照会（存在するID）', function(done) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([{ id: '100', name: '山田太郎', studentNo: 'S0001' }], null, 2));
    runApp(['2', '100', '5'], done, (output) => {
      expect(output).to.include('ID: 100');
      expect(output).to.include('氏名: 山田太郎');
      expect(output).to.include('学籍番号: S0001');
    });
  });

  it('TC-05: 学生アカウント情報照会（存在しないID）', function(done) {
    runApp(['2', '999', '5'], done, (output) => {
      expect(output).to.include('エラー: 学生IDが見つかりません。');
    });
  });

  it('TC-06: 学生アカウント情報更新（正常系）', function(done) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([{ id: '100', name: '山田太郎', studentNo: 'S0001' }], null, 2));
    runApp(['3', '100', '田中一郎', 'S9999', '5'], done, (output) => {
      expect(output).to.include('更新が完了しました。');
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      expect(data[0].name).to.equal('田中一郎');
      expect(data[0].studentNo).to.equal('S9999');
    });
  });

  it('TC-07: 学生アカウント情報更新（存在しないID）', function(done) {
    runApp(['3', '999', '田中一郎', 'S9999', '5'], done, (output) => {
      expect(output).to.include('エラー: 学生IDが見つかりません。');
    });
  });

  it('TC-08: 学生アカウント削除（正常系）', function(done) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([{ id: '100', name: '山田太郎', studentNo: 'S0001' }], null, 2));
    runApp(['4', '100', 'yes', '5'], done, (output) => {
      expect(output).to.include('削除が完了しました。');
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      expect(data.length).to.equal(0);
    });
  });

  it('TC-09: 学生アカウント削除（存在しないID）', function(done) {
    runApp(['4', '999', 'yes', '5'], done, (output) => {
      expect(output).to.include('エラー: 学生IDが見つかりません。');
    });
  });

  it('TC-10: データ永続化の確認', function(done) {
    runApp(['1', '200', '永続太郎', 'S2000', '5'], () => {
      // 再起動して照会
      runApp(['2', '200', '5'], done, (output) => {
        expect(output).to.include('ID: 200');
        expect(output).to.include('氏名: 永続太郎');
        expect(output).to.include('学籍番号: S2000');
      });
    }, () => {});
  });
});
