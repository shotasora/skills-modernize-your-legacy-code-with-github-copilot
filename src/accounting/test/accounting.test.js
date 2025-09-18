
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { expect } = require('chai');
const mockStdin = require('mock-stdin').stdin;

const DATA_FILE = path.join(__dirname, '../balance.json');
const APP_PATH = path.join(__dirname, '../index.js');

describe('会計管理システム E2Eテスト', function() {
  let stdin;
  beforeEach(() => {
    stdin = mockStdin();
    if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
  });
  afterEach(() => {
    stdin.restore();
    if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
  });

  function runAppWithInputs(inputs, done, assertFn) {
    const proc = spawn('node', [APP_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    proc.stdout.on('data', d => { output += d.toString(); });
    proc.stderr.on('data', d => { output += d.toString(); });
    proc.on('close', code => {
      assertFn(output);
      done();
    });
    // 入力を順次送信
    (async () => {
      for (const inp of inputs) {
        await new Promise(res => setTimeout(res, 100));
        proc.stdin.write(inp + '\n');
      }
    })();
  }

  it('TC-01: 残高照会（正常系）', function(done) {
    runAppWithInputs(['1', '4'], done, (output) => {
      expect(output).to.include('Current balance: 1000.00');
    });
  });

  it('TC-02: 入金処理（正常系）', function(done) {
    runAppWithInputs(['2', '500', '1', '4'], done, (output) => {
      expect(output).to.include('Amount credited. New balance: 1500.00');
      expect(output).to.include('Current balance: 1500.00');
    });
  });

  it('TC-03: 出金処理（正常系）', function(done) {
    // まず500円入金してから500円出金
    runAppWithInputs(['2', '500', '3', '500', '1', '4'], done, (output) => {
      expect(output).to.include('Amount debited. New balance: 1000.00');
      expect(output).to.include('Current balance: 1000.00');
    });
  });

  it('TC-04: 出金処理（残高不足）', function(done) {
    runAppWithInputs(['3', '2000', '4'], done, (output) => {
      expect(output).to.include('Insufficient funds for this debit.');
    });
  });

  it('TC-05: 入出金時の金額バリデーション', function(done) {
    runAppWithInputs(['2', '-100', '3', '0', '4'], done, (output) => {
      expect(output).to.include('Please enter a valid amount.');
    });
  });

  it('TC-06: データ永続化の確認', function(done) {
    // 1回入金して終了→再起動して残高照会
    runAppWithInputs(['2', '100', '4'], () => {
      // 2回目起動
      runAppWithInputs(['1', '4'], done, (output) => {
        expect(output).to.include('Current balance: 1100.00');
      });
    }, () => {});
  });
});

