# Curio

**Read a little. Learn a lot.**

英語初心者向けのマイクロリーディングアプリです。宇宙・テクノロジー・歴史などの雑学を、1文ずつの短い英語で読みながら単語やフレーズを学べます。

## 機能

- 興味のあるカテゴリ・レベル・1日の目標を設定するオンボーディング
- 興味と既読状況にもとづくおすすめフィード
- 単語タップでの意味表示、和訳・補足情報の表示
- Web Speech API による読み上げ
- 文・単語の保存、学習履歴、週間アクティビティ

学習データはブラウザの `localStorage` に保存され、サーバーや外部 API は不要です。フォントも npm パッケージ（Fontsource）から同梱しているため、実行時に外部サービスへアクセスしません。

## 開発

Node.js 22.18 以上が必要です（記事生成スクリプトを TypeScript のまま実行するため）。

```bash
npm install
npm run dev
```

| コマンド            | 内容                         |
| ------------------- | ---------------------------- |
| `npm run dev`       | 開発サーバーを起動           |
| `npm run build`     | 型チェックと本番ビルド       |
| `npm run preview`   | ビルド結果をプレビュー       |
| `npm run typecheck` | 型チェックのみ               |
| `npm test`          | ユニットテスト（Vitest）     |
| `npm run generate:topic` | Claude で記事を1件生成（要 `ANTHROPIC_API_KEY`） |

## コンテンツの追加・更新

記事は `content/topics/` に **1トピック = 1 JSON ファイル** で置いています。追加はファイルを1つ増やすだけです。

```jsonc
// content/topics/topic-<slug>.json（ファイル名は id と一致させる）
{
  "id": "topic-<slug>",
  "categoryId": "space-science",   // space-science | technology | history | world-culture | business-economy | human-psychology
  "titleEn": "...",
  "titleJa": "...",
  "subtitleJa": "...",
  "difficulty": "beginner",        // beginner | elementary | intermediate
  "estimatedMinutes": 2,
  "publishedAt": "2026-12-01",     // この日付以降に表示（未来日付で予約公開）
  "sentences": [                   // ちょうど 5 文
    {
      "id": "sent-<slug>-1",       // 全ファイルで一意
      "english": "...",
      "japanese": "...",
      "additionalInfoEn": "...",
      "additionalInfoJa": "...",
      "difficulty": "beginner",
      "estimatedSeconds": 20,
      "vocabulary": [{ "word": "...", "pos": "名詞", "meaningJa": "..." }],
      "usefulPhrase": { "en": "...", "ja": "..." },
      "explanationJa": "..."
    }
  ]
}
```

- スキーマは [`src/content/schema.ts`](src/content/schema.ts)（Zod）で定義しています。
- `npm run dev` / `npm run build` / `npm test` の実行時に全ファイルを検証し、不正な内容があればビルドが失敗します。
- 既存の `id` は利用者の既読・保存データと紐づくため、変更しないでください。

## 記事の自動生成と運用

GitHub Actions（[`.github/workflows/generate-topic.yml`](.github/workflows/generate-topic.yml)）が毎日 06:00 JST に記事を1件生成し、**PR として提出**します。人がレビューしてマージした記事だけが本番に出ます。

```
毎日 06:00 JST  GitHub Actions
  → scripts/generate-topic.ts が Claude（claude-opus-5-5）でトピックを1件生成
  → スキーマ検証・テスト・ビルド（不正ならここで失敗し、PR は作られない）
  → ブランチ content/topic-<slug> を作成して PR を提出
  → Vercel が PR ごとにプレビュー URL を発行
人がレビュー → マージ → Vercel が本番へ自動デプロイ
```

### 初回セットアップ

1. **API キー:** GitHub リポジトリの Settings → Secrets and variables → Actions → *New repository secret* で `ANTHROPIC_API_KEY` を登録する。未登録の間はワークフローが「スキップ」と表示して何もしません。
2. **PR 作成の許可:** Settings → Actions → General → *Workflow permissions* で「Allow GitHub Actions to create and approve pull requests」にチェックを入れる。
3. **動作確認:** Actions タブ → *Generate topic* → *Run workflow* で手動実行し、PR が作られることを確認する。

### 日々の運用（レビュー）

生成された PR ごとに以下を確認し、問題なければマージ、不要なら PR をクローズするだけです。

- 事実関係が正しいか（意外な内容ほど裏取りする）
- 英文が自然で、レベル（beginner / elementary / intermediate）に合っているか
- 和訳・解説・単語の意味が正しいか
- Vercel のプレビューで表示が崩れていないか

軽微な誤りは PR 上で JSON を直接編集してからマージして構いません（編集後の Vercel プレビュービルドで再度検証されます）。

### 生成ルール

- **カテゴリ:** 記事数が最も少ないカテゴリを自動選択（手動実行時は指定可）
- **難易度:** そのカテゴリで最も少ない難易度を自動選択
- **重複回避:** 既存の全トピックのタイトルをプロンプトに渡して重複を避ける
- **ID・公開日:** スクリプトが `topic-<slug>` / `sent-<slug>-N` と、実行日（JST）の `publishedAt` を付与

### よくある調整

| やりたいこと | 変更箇所 |
| --- | --- |
| 生成頻度・時刻を変える | ワークフローの `cron`（UTC 表記。例: `0 21 * * 1` で毎週月曜 06:00 JST） |
| 一時停止する | Actions タブで *Generate topic* を *Disable workflow* |
| 予約公開する | PR 上で `publishedAt` を未来日付に変えてマージ（その日から表示） |
| 記事を取り下げる | 該当 JSON を削除してコミット（ID は再利用しない） |
| 文体・方針を変える | [`scripts/generate-topic.ts`](scripts/generate-topic.ts) のプロンプト |
| ローカルで試す | `ANTHROPIC_API_KEY=... npm run generate:topic -- --dry-run`（ファイルを書かずに出力のみ） |

### 注意点

- GitHub の定期実行は数分〜数十分遅れることがあります。また、公開リポジトリは 60 日間アクティビティがないと自動で無効化されます（Actions タブから再有効化できます）。
- 未マージの PR が溜まっても、同じ題材が重複する可能性があります。PR はこまめにマージ／クローズしてください。
- API 利用料の目安は 1 回あたり数十円程度です（claude-opus-5-5、入力・出力トークン量に依存）。

## デプロイ（Vercel）

静的サイトとしてそのままデプロイできます。環境変数は不要です。

1. Vercel で GitHub リポジトリをインポート
2. Deploy

ビルド設定・キャッシュ・セキュリティヘッダーは [`vercel.json`](vercel.json) で管理しています（ダッシュボード側の設定より優先されます）。

CLI を使う場合:

```bash
npx vercel --prod
```

## ディレクトリ構成

```
.github/workflows/    記事の定期生成ワークフロー
content/topics/       記事データ（1トピック = 1 JSON）
public/images/        カテゴリ画像
scripts/              記事生成スクリプト
src/
  components/         UI コンポーネント
  content/            記事のスキーマと検証
  data/               カテゴリ定義と記事の読み込み
  types/              型定義
  utils/              おすすめ・保存・読み上げなどのロジック
```
