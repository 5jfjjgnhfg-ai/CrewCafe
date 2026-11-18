# クルーめし（仮称）— 社員食堂メニュー閲覧Webアプリ

社員食堂「クルーカフェ」の月間メニューを、スマートフォンで見やすく確認するための静的Webアプリ（PWA）です。
ビルド作業は不要で、このフォルダの中身をそのまま GitHub に置けば GitHub Pages で公開できます。

- サーバー・ログイン・外部通信・外部CDN・外部フォント・アナリティクスは使いません。
- メニューデータは **この端末・このブラウザ・このURL** の IndexedDB にだけ保存されます。別端末への自動同期はありません。
- コードにはメニューの実データを入れていません。初回起動時は「データなし」です。

---

## 1. ファイル構成

| パス | 内容 |
|---|---|
| `index.html` | 画面の土台（ハッシュ方式のSPA：`#/home` `#/calendar` `#/search` `#/favorites` `#/data` `#/review`） |
| `css/style.css` | デザイン |
| `js/config.js` | **設定（アプリ名 `APP_NAME` など）** |
| `js/dates.js` | 日本時間の暦日計算（`Intl.DateTimeFormat` ＋ `Date.UTC`） |
| `js/storage.js` | IndexedDB／localStorage の読み書き（1トランザクション・complete後に成功） |
| `js/validate.js` | 自動チェック（エラー・警告） |
| `js/ui.js` | 共通部品（カード、モーダル、トースト） |
| `js/app.js` | ルーター、ホーム、カレンダー、検索、お気に入り、フッター、Service Worker登録 |
| `js/editor.js` | 取り込み内容の確認・編集画面 |
| `js/manage.js` | データ管理（取り込み、月の管理、全体バックアップと復元、書き出しの代替手段） |
| `manifest.webmanifest` | PWAのマニフェスト |
| `sw.js` | Service Worker（アプリ本体ファイルのキャッシュのみ） |
| `icons/` | アイコン（文字「CM」だけのPNG。192／512／maskable／apple-touch-icon 180） |
| `sample/sample-2099-01.json` | 架空サンプル（2099年1月・3日分）。自動では取り込まれません |
| `tests/` | 開発用の自己テストページ（架空データのみ、専用の保存領域を使用。**公開しなくても動作に影響なし**。不要なら削除可） |

## 2. 保存方式

| データ | 保存先 | 名前 |
|---|---|---|
| メニュー（月ごと） | IndexedDB | DB名 `crewmeshi-db`、ストア `months`、キー `"YYYY-MM"`。レコード `{ key, data: <取り込み形式の月JSON>, updatedAt }` |
| お気に入り（料理名の配列） | localStorage | `crewmeshi-favorites` |
| 表示設定（全カフェ共通／CSCカフェ） | localStorage | `crewmeshi-settings` → `{ "locationMode": "all" \| "csc" }` |
| 最後に全体バックアップを取り出した日時 | localStorage | `crewmeshi-last-backup-at` |

- 名前はアプリ名に依存しない固定名です（アプリ名を変えてもデータは消えません）。
- カテゴリ・価格・注意書きは月ごとのJSONに含まれ、月ごとに保存されます。過去の月は自動削除しません。
- 自己テスト（`?selftest=1`）は `crewmeshi-selftest-` で始まる別の保存領域を使い、終了時に削除します。

## 3. JSON仕様（schemaVersion "1.0"）

1か月分を1ファイルとします。形式は依頼書の第5章どおりです（`schemaVersion` `year` `month` `sourceFileName` `notices` `categories[{id,label,price,location}]` `days[{date, items[{categoryId,name,status,priceOverride,note}]}]` `reviewNotes[{date,categoryId,message}]`）。
スキーマの変更・拡張はしていません。完全な例は `sample/sample-2099-01.json` を参照してください。

全体バックアップ形式：
```json
{ "backupFormat": "crew-menu-full-backup", "backupVersion": "1.0", "exportedAt": "<ISO日時>",
  "months": [<取り込み形式の月JSON>, ...], "favorites": ["料理名", ...], "settings": { "locationMode": "all" } }
```

## 4. GitHub Pages に公開する手順

1. GitHub にログインし、右上の「＋」→「New repository」。リポジトリ名（例：`crewmeshi`）を入力し、**Public** を選んで作成します（無料プランの Pages は公開リポジトリが必要です）。
2. 作成したリポジトリの「Add file」→「Upload files」で、このフォルダの中身（`index.html`、`css/`、`js/`、`icons/`、`sample/`、`manifest.webmanifest`、`sw.js`、`README.md`。`tests/` は任意）をフォルダ構成のままドラッグ＆ドロップし、「Commit changes」。
   - `index.html` がリポジトリの一番上（ルート）にあることを確認してください。
3. リポジトリの「Settings」→ 左メニュー「Pages」→「Build and deployment」の Source を「Deploy from a branch」、Branch を `main`／`/ (root)` にして「Save」。
4. 同じ画面の「Enforce HTTPS」にチェックが入っていることを確認します（`github.io` では通常最初から有効。Service Worker は HTTPS でしか動きません）。
5. 数分後、Pages の画面上部に公開URL（`https://<ユーザー名>.github.io/<リポジトリ名>/`）が表示されます。スマートフォンで開いて動作を確認してください。

サブディレクトリ（`/<リポジトリ名>/`）でも動くよう、参照はすべて `./` から始まる相対パス、画面切り替えはハッシュ方式（`#/home` など）です。再読み込みしても 404 になりません。

### 重要：公開リポジトリについて
- 無料プランではリポジトリが **公開** になり、コードは誰でも見られます。
- **メニューJSON、バックアップJSON、原本PDFをリポジトリに置かないでください。** データはアプリの「データ管理」から各端末に取り込みます。

## 5. アプリを更新するとき

1. 変更したファイルを GitHub にアップロード（上書き）します。
2. **`sw.js` の先頭にある `var CACHE_VERSION = 'crewmeshi-v1';` の数字を上げます**（例：`crewmeshi-v2`）。上げないと、端末が古いキャッシュを使い続けることがあります。
3. ファイルを追加・改名した場合は、`sw.js` の `APP_FILES` の一覧も直します。
4. 利用者がアプリを開くと、画面上部に「新しいバージョンがあります。再読み込みで更新します」と「更新する」ボタンが出ます。押すと新しいバージョンになります。
   - 古いキャッシュ（`crewmeshi-` で始まる別バージョン）だけを削除します。IndexedDB のメニューと localStorage は消えません。
   - 確認中の未保存データがあるときは自動で再読み込みしません（押したときに確認します）。

## 6. アプリ名を変えるとき

| 場所 | 書き換える内容 |
|---|---|
| `js/config.js` の `APP_NAME` | **ここが本体**。画面タイトル・ヘッダー・`<title>`・フッターはここから読み込みます |
| `manifest.webmanifest` の `name` と `short_name` | 定数を読めないため手で変更（ホーム画面の名前） |
| `index.html` の `<title>`、`apple-mobile-web-app-title`、ヘッダーの `.app-name` | JS が動く前の初期表示用（JS 実行後は `APP_NAME` で上書き）。ホーム画面に追加するときの名前に影響するため、合わせて変更推奨 |
| `icons/` | 文字「CM」の画像。変える場合は同じサイズのPNGに差し替え |

変更後は `sw.js` の `CACHE_VERSION` を上げてください。保存データの名前は固定なので、データは引き継がれます。

## 7. 公開URLを変えるとき（データの引き継ぎ）

保存データは URL のオリジン（例：`https://<ユーザー名>.github.io`）ごとに分かれます。**ユーザー名・ドメインを変えると、データは自動では引き継がれません。**
（同じユーザー名でリポジトリ名だけ変える場合はオリジンが同じなので通常は残りますが、ホーム画面アプリは追加し直しが必要です。）
Genspark 上のプレビューURLで保存したデータも、GitHub Pages では見えません。

変える前の手順：
1. 今のURLで「データ管理」→「全体バックアップを取り出す」（ダウンロード／共有メニューで保存／全文コピー）。
2. 新しいURLを開き、「データ管理」→「全体バックアップから復元」でファイルを選ぶか、テキストを貼り付けます。
3. iPhone・iPad はホーム画面アプリと Safari で保存データが別です。ふだん使う方で復元してください。

## 8. 毎月の更新（コード変更・再デプロイ不要）

1. アプリ外のAI（ChatGPT等）で原本PDFを第3章の形式のJSONに変換します。
2. アプリの「データ管理」→ ファイルを選ぶか、テキストを貼り付けて取り込みます。
3. 確認画面でエラー・警告・一覧表を原本と見比べ、必要ならセルをタップして修正します。
4. 「保存して反映」。同じ年月があれば置き換えの確認が出ます。
5. 定期的に「全体バックアップを取り出す」を実行してください。

## 9. 実装済みの機能

- ホーム（今日／前日／翌日／日付選択、月またぎ、visibilitychange で今日を再計算、全カフェ共通／CSCカフェ切り替え、CSCカフェ限定バッジ、お気に入り登録）
- カレンダー（保存済みの月だけ切り替え、日別表示、月曜始まりの週間表示、土日の色と曜日の文字、今日の強調）
- 検索（全月対象の部分一致、カテゴリ絞り込み、300円以下、日付昇順、0件表示）
- お気に入り（料理名の完全一致で月をまたいで提供日を一覧）
- データ管理（案内文・状態表示、ファイル／貼り付けの取り込み、確認画面、編集、上書き確認、月の一覧・JSON取り出し・削除・編集、全体バックアップと復元、ダウンロード／共有／コピー、サンプル、ホーム画面への追加方法）
- 自動チェック（エラーで保存不可、警告は件数つき確認）
- PWA（manifest、Service Worker、オフライン起動、更新の案内）

## 10. 開発用の自己テスト

`tests/selftest.html`（第1部）と `tests/selftest2.html`（第2部）をブラウザで開くと、架空データで自動テストを実行し、PASS／FAIL を表示します。専用の保存領域を使い、終了時に削除します。本番の保存データには触れません。
`tests/visual-*.html` は表示確認用です。

## 11. 未確認・今後の作業

- GitHub Pages の実URL、実機（iPhone／Android）、ホーム画面アプリでの動作、オフライン起動、Service Worker の更新案内は、Genspark のプレビュー環境では確認できていません。公開後に実機で確認してください（確認手順は完了報告を参照）。
- アイコンは文字「CM」だけの簡易的なものです。必要に応じて差し替えてください。
