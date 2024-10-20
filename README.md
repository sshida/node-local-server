古い。2024-10現在、[http-server-node](https://github.com/sshida/http-server-node)を使うこと

# http-server-node

## https-server.mjs
- 手元でテスト用に実行するhttpまたはhttpsサーバー
- 待受プロトコルはhttpかhttpsのどちらかを指定できます
- httpsを使うときのCN、サーバー証明書と秘密鍵のフォルダを指定できます
- サーバー証明書のフォルダーパスのデフォルト値は`~/.myCerts`です
- 待受ポート番号を指定できます。デフォルトは`8080`です
- 待受IPアドレスを指定できます。
- (未実装) リダイレクト用ホスト名を指定できます。
- ファイルを配置したフォルダー(folder, directory)を指定して、その中のファイルの内容を応答します
- ファイルの大きさが2048バイトを超えていると、1024バイト単位で分割して応答します (Transfer-Encoding: chunked)
- ファイルの大きさが2048バイト以下のときは`Content-length` HTTPヘッダーをつけて一回で応答します
- 実行後、HTTPリクエストが1時間ないと終了します

## コマンドラインオプションのヘルプ
```
./https-server.mjs -h
```

## HTTPSサーバーをlocalhost:443 port待受で実行する
```
./https-server.mjs
```

## サーバー証明書の設定
```
ln -s /etc/letsencrypt/live/my.domain.example.com ~/.myCerts

mkdir temporalServFolder
echo "<h1>Hello world</h1>" > temporalServFolder/index.html

./https-server.mjs temporalServFolder
```

