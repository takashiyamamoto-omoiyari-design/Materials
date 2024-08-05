require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // 動的インポート
const app = express();
const port = 3000;

// const fetch = require('node-fetch');
app.use(cors()); 
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/sqlChat', async (req, res) => {
  const { question, context } = req.body;
  console.log('受け取った質問:', question); // 受け取った質問をログに記録
  console.log('使用するコンテキスト:', context); // 使用するコンテキストをログに記録

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `あなたはSQLマスターです。コンテキストのSQLのみを汲み取って質問に対する回答としてSQLを提案ください。: ${context}` },
            { role: 'user', content: question }
          ],
          max_tokens: 1000,
          n: 1,
          stop: null,
          temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const answer = data.choices[0].message.content.trim();
      console.log(`\n生成された回答:\n${answer}`); // 生成された回答をログに記録
      res.json({ answer });
    } else {
      const errorDetails = await response.text();
      console.error('SQLチャットAPIの呼び出しに失敗しました:', response.statusText, errorDetails);
      res.status(response.status).send(response.statusText);
    }
  } catch (error) {
    console.error('SQLチャットAPIの呼び出し中にエラーが発生しました:', error.message);
    res.status(500).send(error.message);
  }
});

app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;
  console.log('要約するために受け取ったテキスト:', text); // 受け取ったテキストをログに記録
  
  try {
    console.log('要約APIを呼び出します');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `あなたはシニアプロダクトマネージャーです。次のテキストを前向きな表現で箇条書きを中心として体系立てて要約してください。ですます調にならないようにしてください。読み込むテキスト以上の解釈をしないようにしてください。HTML改行コードを一文ずつ付加してください。各文は左寄せにしてください。: ${text}` }], // 日本語で要約をリクエスト
          max_tokens: 1000,
          n: 1,
          stop: null,
          temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      let summary = data.choices[0].message.content.trim();
      // summary = summary.split('\n').map(line => `- ${line}`).join('\n'); // 箇条書き単位で改行して表示
      console.log(`\n生成された要約:\n${summary}`); // 生成された要約をログに記録
      res.json({ summary }); // 要約をレスポンスとして返す
    } else {
      const errorDetails = await response.text();
      console.error('要約APIの呼び出しに失敗しました:', response.statusText, errorDetails);
      res.status(response.status).send(response.statusText);
    }
  } catch (error) {
    console.error('要約APIの呼び出し中にエラーが発生しました:', error.message);
    res.status(500).send(error.message);
  }
});

app.post('/api/newSummarize', async (req, res) => {
  const { text } = req.body;
  console.log('新しい要約APIのために受け取ったテキスト:', text); // 受け取ったテキストをログに記録
  
  try {
    console.log('新しい要約APIを呼び出します');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `次のテキストを要約してください: ${text}` }], // 日本語で要約をリクエスト
          max_tokens: 500,
          n: 1,
          stop: null,
          temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const summary = data.choices[0].message.content.trim();
      console.log(`\n生成された新しい要約:\n${summary}`); // 生成された要約をログに記録
      res.json({ data }); // 要約をレスポンスとして返す
    } else {
      const errorDetails = await response.text();
      console.error('新しい要約APIの呼び出しに失敗しました:', response.statusText, errorDetails);
      res.status(response.status).send(response.statusText);
    }
  } catch (error) {
    console.error('新しい要約APIの呼び出し中にエラーが発生しました:', error.message);
    res.status(500).send(error.message);
  }
});
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Shinjyo7#',
  database: 'materials'
});

connection.connect((err) => {
  if (err) {
    console.error('MySQLへの接続エラー:', err.stack);
    return;
  }
  console.log('MySQLに接続しました。接続ID:', connection.threadId);
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.post('/api/save', (req, res) => {
  const { fileId, file, title, content } = req.body;
  console.log('受け取ったデータ:', fileId, file, title, content);

  if (fileId) {
    // 既存レコードを更新
    const updateQuery = 'UPDATE ppt SET file = ?, title = ?, content = ? WHERE id = ?';
    connection.query(updateQuery, [file, title, content, fileId], (error, results, fields) => {
       if (error) {
        console.error('MySQLデータの更新エラー:', error.stack);
        res.status(500).json({ error: 'データの更新に失敗しました' });
        return;
      }
      console.log('MySQLデータが更新されました:', results);
      res.status(200).json({ fileId, title, content });
    });
  } else {
    // 新規レコードを挿入
    const insertQuery = 'INSERT INTO ppt (file, title, content) VALUES (?, ?, ?)';
    connection.query(insertQuery, [file, title, content], (error, results, fields) => {
      if (error) {
        console.error('MySQLデータの保存エラー:', error.stack);
        res.status(500).json({ error: 'データの保存に失敗しました' });
        return;
      }
      console.log('MySQLデータが保存されました:', results);
      res.status(200).json({ file, title, content });
    });
  }
});

app.get('/api/files', (req, res) => {
  const query = 'SELECT id, file FROM ppt';
  connection.query(query, (error, results, fields) => {
    if (error) {
      console.error('MySQLデータの取得エラー:', error.stack);
      res.status(500).json({ error: 'データの取得に失敗しました' });
      return;
    }
    console.log('MySQLからデータを取得しました:', results);
    res.status(200).json(results);
  });
});

app.get('/api/files/:id', (req, res) => {
  const fileId = req.params.id;
  const query = 'SELECT * FROM ppt WHERE id = ?';
  connection.query(query, [fileId], (error, results, fields) => {
    if (error) {
      console.error('MySQLデータの取得エラー:', error.stack);
      res.status(500).json({ error: 'データの取得に失敗しました' });
      return;
    }
    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(404).json({ error: 'ファイルが見つかりません' });
    }
  });
});

app.post('/api/logFileId', (req, res) => {
  const { fileId } = req.body;
  console.log('受け取ったファイルID:', fileId); // ターミナルにログ出力
  res.sendStatus(200);
});

app.post('/api/logSelection', (req, res) => {
  const { range, rect } = req.body;
  console.log('受け取った範囲と矩形:', range, rect); // ターミナルにログ出力
  res.sendStatus(200);
});

app.post('/api/logSelectedText', (req, res) => {
  const { selectedText } = req.body;
  console.log('受け取った選択テキスト:', selectedText); // ターミナルにログ出力
  res.sendStatus(200);
});

app.post('/api/logSummary', (req, res) => {
  const { summary } = req.body;
  console.log('OpenAIからの要約:', summary); // ターミナルにログ出力
  res.status(200).send('要約をログに記録しました');
});

app.post('/api/saveSqlContext', (req, res) => {
  const { context, description } = req.body;
  const insertQuery = 'INSERT INTO sql_contexts (context, description) VALUES (?, ?)';
  
  connection.query(insertQuery, [context, description], (error, results) => {
    if (error) {
      console.error('SQLコンテキストの保存エラー:', error.message);
      console.error('SQLコンテキストの保存エラー:', error.stack);
      res.status(500).json({ error: 'SQLコンテキストの保存に失敗しました' });
      return;
    }
    console.log('SQLコンテキストが保存されました:', results);
    res.status(200).json({ id: results.insertId, context, description });
  });
});

app.post('/api/chat', async (req, res) => {
  const { question, contextId } = req.body;
  console.log('受け取った質問:', question); // 受け取った質問をログに記録

  // コンテキストを取得
  const query = 'SELECT content FROM ppt WHERE id = ?'; // Updated query
  connection.query(query, [contextId], async (error, results) => {
    if (error) {
      console.error('コンテキストの取得エラー:', error.message);
      console.error('エラースタックトレース:', error.stack);
      res.status(500).json({ error: 'コンテストの取得に失敗しました' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: '指定されたコンテキストが見つかりません' });
      return;
    }

    const context = results[0].content; // Updated variable name
    console.log('使用するコンテキスト:', context); // 使用するコンテキストをログに記録

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `以下のコンテキストに基づいて質問に答えてください。回答はHTML改行コードを一文ずつ付加して極力詳細に回答ください。各文は左寄せにしてください。: ${context}` }, // Updated message
              { role: 'user', content: question }
            ],
            max_tokens: 1000,
            n: 1,
            stop: null,
            temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data.choices[0].message.content.trim();
        console.log(`\n生成された回答:\n${answer}`); // 生成された回答をログに記録
        res.json({ answer });
      } else {
        const errorDetails = await response.text();
        console.error('チャットAPIの呼び出しに失敗しました:', response.statusText, errorDetails);
        res.status(response.status).send(response.statusText);
      }
    } catch (error) {
      console.error('チャットAPIの呼び出し中にエラーが発生しました:', error.message);
      res.status(500).send(error.message);
    }
  });
});

app.post('/api/logError', (req, res) => {
  const { errorText, status, statusText, stack } = req.body;
  console.error(`クライアントからのエラーログ: ${status} ${statusText} - ${errorText}`);
  if (stack) {
    console.error(`スタックトレース:\n${stack}`);
  }
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`サーバーがhttp://localhost:${port}で稼働中`);
});