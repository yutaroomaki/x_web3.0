# GXVIS 仕様書（UI / API / DB）

## 1. 技術前提（変更不可）

| カテゴリ | 技術 |
|--------|------|
| Frontend/Backend | Next.js 15 (App Router, Route Handlers, Server Actions可) |
| UI | Tailwind CSS |
| ORM | Prisma |
| DB | PostgreSQL (Cloud SQL) |
| Infra（本番） | Google Cloud |

### Google Cloud構成
- Cloud Run（Webアプリ）
- Cloud Run Jobs（バッチ/ワーカー）
- Cloud Scheduler → Pub/Sub（推奨）
- Cloud Storage（サムネ・最小アーティファクト）
- Secret Manager（APIキー）
- Cloud Logging / Monitoring

---

## 2. 全体アーキテクチャ図

```
[Cloud Scheduler] -> [Pub/Sub] -> [Cloud Run Jobs: pipeline]
                                          |
                                          v
                                  (Prisma + Cloud SQL)
                                          |
                                          v
                            [Cloud Run: Next.js Web App]
                            - /drafts 一覧
                            - /review/[id] レビュー
                            - /sources 管理
                            - /jobs 履歴
                            - /templates 参照

External:
- X API (official)
- YouTube Data API (official)
- RSS/News API/サイト提供フィード（規約準拠）
- LLM Provider（抽象化）

Storage:
- Cloud Storage（サムネ/最小ログ/任意）

Secrets:
- Secret Manager

Logs:
- Cloud Logging/Monitoring + DB(JobRun/ReviewDecision)
```

---

## 3. 論理パイプライン（固定要件）

```
(1) Ingestion: 世界中から収集
    - X / News(RSS) / YouTube
         ↓
(2) Detect: バズ投稿候補を特定
    - candidate_score(0-100) + reasons
         ↓
(3) Analyze: 投稿を分析・解析（構造・感情・CTA）
         ↓
(4) Outline: バズる構成案（テンプレ×感情）
         ↓
(5) Generate: X投稿文生成（日本語 / ルール固定 / テンプレ30種）
         ↓
(6) Review: 半自動レビューUIで人が最終判断
```

---

## 4. 画面構成（10画面前後）

### 4.1 画面一覧

| 画面ID | ルート | 名称 | 必須 | 概要 |
|--------|--------|------|------|------|
| UI-001 | `/login` | ログイン | 推奨 | 社内利用の認証 |
| UI-002 | `/drafts` | ドラフト一覧 | **必須** | DraftPost一覧・フィルタ |
| UI-003 | `/review/[id]` | レビュー詳細 | **必須** | 編集＋却下/投稿済み登録 |
| UI-004 | `/sources` | ソース管理 | **必須** | X/RSS/YouTube設定 |
| UI-005 | `/jobs` | ジョブ履歴 | **必須** | JobRun一覧、失敗確認 |
| UI-006 | `/items` | 収集アイテム | 任意 | IngestItem検索・リンク確認 |
| UI-007 | `/templates` | テンプレ参照 | 任意 | 30種テンプレの閲覧 |
| UI-008 | `/settings` | 設定 | 任意 | 期間・閾値・LLM設定 |
| UI-009 | `/audit` | 監査ログ | 任意 | ReviewDecision等 |
| UI-010 | `/dashboard` | ダッシュボード | 任意 | サマリー表示 |

### 4.2 画面遷移図

```
/login -> /drafts -> /review/[id] -> (save/edit) -> /review/[id]
                                  |-> (reject) -> /drafts
                                  |-> (posted) -> /drafts

/drafts -> /sources
/drafts -> /jobs

(optional) /items /templates /settings /audit /dashboard
```

### 4.3 主要画面UI仕様

#### UI-002 `/drafts`（必須）

**表示フィールド（読み取り専用）**
- `status` (pending/approved/rejected/posted)
- `trendScore`
- `templateType`
- `emotionTriggers`
- `riskFlags.hype_level`
- `riskFlags.info_certainty`
- `createdAt`

**操作**
- 行クリック：`/review/[id]` へ遷移
- フィルタ：status、スコア閾値、期間、媒体

**編集不可**（一覧では更新操作をしない）

#### UI-003 `/review/[id]`（必須・1画面完結）

**表示（読み取り専用）**
- `templateType`
- `emotionTriggers`
- `trendScore`
- `riskFlags.notes`
- `sources`（X/News/YouTubeのURLリスト、count）

**編集可能（唯一の編集対象）**
- `postText`（DraftPost.postText）

**操作ボタン（必須）**
- 保存：`PATCH /api/drafts/:id`
- 却下：`POST /api/drafts/:id/decision { action:"reject" }`
- 投稿済み登録：`POST /api/drafts/:id/decision { action:"posted" }`

**操作ボタン（任意）**
- 承認：`POST /api/drafts/:id/decision { action:"approve" }`
- コピーボタン：`postText` をクリップボードへコピー

#### UI-004 `/sources`（必須）

**Source一覧**
- type/name/enabled/createdAt

**追加・編集**
- X：検索クエリ＋時間条件（configに格納）
- News：RSS/フィードURL
- YouTube：keyword or channelId
- enabled切替

#### UI-005 `/jobs`（必須）

**JobRun一覧**
- jobType/status/startedAt/finishedAt/stats

**失敗時**
- error JSONを閲覧可能

---

## 5. API仕様（Next.js Route Handlers）

### 5.1 共通ルール

- すべてJSON
- バリデーション：Zod（必須）
- 認可：Admin限定/ログイン限定などはルート単位で固定

### 5.2 エラー形式（固定）

```json
{
  "ok": false,
  "error": {
    "code": "STRING_CODE",
    "message": "human readable",
    "details": {}
  }
}
```

### 5.3 Sources API

#### GET `/api/sources`

**Query**
- `enabled?: boolean`
- `type?: "X_SEARCH" | "RSS" | "YOUTUBE_SEARCH" | "YOUTUBE_CHANNEL" | "MANUAL"`

**Response (200)**
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "type": "RSS",
      "name": "...",
      "config": {},
      "enabled": true,
      "createdAt": "..."
    }
  ]
}
```

#### POST `/api/sources`

**Body**
```json
{
  "type": "RSS",
  "name": "...",
  "config": {},
  "enabled": true
}
```

**Response (201)**
```json
{ "ok": true, "data": { "id": "..." } }
```

### 5.4 Drafts API

#### GET `/api/drafts`

**Query**
- `status?: "pending"|"approved"|"rejected"|"posted"`
- `minScore?: number`

**Response (200)**
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "status": "pending",
      "trendScore": 82,
      "templateType": "緊急速報型",
      "emotionTriggers": ["FOMO", "驚き"],
      "riskFlags": {
        "hype_level": "high",
        "info_certainty": "medium",
        "notes": "..."
      },
      "createdAt": "..."
    }
  ]
}
```

#### GET `/api/drafts/:id`

**Response (200)**
```json
{
  "ok": true,
  "data": {
    "draft": { "...": "..." },
    "ingestItem": {
      "url": "...",
      "publishedAt": "...",
      "platform": "x",
      "language": "...",
      "text": "..."
    },
    "analysis": {
      "hookType": "question",
      "ctaType": "rt",
      "emotionProfile": {},
      "templateGuess": "...",
      "summary": "...",
      "risks": {}
    },
    "outline": {
      "templateType": "...",
      "hookDraft": "...",
      "keyPoints": ["..."],
      "ctaDraft": "...",
      "emotionPlan": {}
    }
  }
}
```

#### PATCH `/api/drafts/:id`

**Body**
```json
{ "postText": "..." }
```

**Response (200)**
```json
{ "ok": true }
```

#### POST `/api/drafts/:id/decision`

**Body**
```json
{
  "action": "reject",
  "editedText": "...",
  "note": "..."
}
```

**Response (200)**
```json
{ "ok": true }
```

### 5.5 Jobs API

#### POST `/api/jobs/run`

**Body（任意）**
```json
{
  "dryRun": false,
  "maxItems": 200,
  "fromHours": 72,
  "onlyPlatforms": ["x", "news", "youtube"]
}
```

**Response (200)**
```json
{
  "ok": true,
  "data": {
    "jobRunId": "...",
    "stats": {
      "ingested": 0,
      "candidates": 0,
      "analyzed": 0,
      "outlined": 0,
      "generated": 0,
      "skipped": 0
    }
  }
}
```

**責務**
- 直列パイプライン（ingest→detect→analyze→outline→generate）を実行し、DBに保存する
- 失敗時はJobRunにerrorを保存し、APIは固定エラー形式で返す

---

## 6. DB仕様（Prisma / PostgreSQL）

### 6.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SourceType {
  X_SEARCH
  RSS
  YOUTUBE_SEARCH
  YOUTUBE_CHANNEL
  MANUAL
}

enum DraftStatus {
  pending
  approved
  rejected
  posted
}

enum DecisionAction {
  approve
  reject
  posted
}

enum JobStatus {
  running
  success
  failed
}

model Source {
  id          String       @id @default(cuid())
  type        SourceType
  name        String
  config      Json
  enabled     Boolean      @default(true)
  createdAt   DateTime     @default(now())
  ingestItems IngestItem[]

  @@index([type])
  @@index([enabled])
}

model IngestItem {
  id           String          @id @default(cuid())
  sourceId     String
  source       Source          @relation(fields: [sourceId], references: [id], onDelete: Restrict)
  externalId   String          @unique
  url          String
  publishedAt  DateTime
  ingestedAt   DateTime        @default(now())
  language     String?
  text         String?
  metrics      Json
  raw          Json
  createdAt    DateTime        @default(now())

  buzzCandidate BuzzCandidate?
  viralAnalysis ViralAnalysis?
  outline       Outline?
  draftPosts    DraftPost[]

  @@index([publishedAt])
  @@index([ingestedAt])
  @@index([sourceId])
}

model BuzzCandidate {
  id           String     @id @default(cuid())
  ingestItemId String     @unique
  ingestItem   IngestItem @relation(fields: [ingestItemId], references: [id], onDelete: Cascade)
  score        Int
  reasons      Json
  createdAt    DateTime   @default(now())

  @@index([score])
  @@index([createdAt])
}

model ViralAnalysis {
  id             String     @id @default(cuid())
  ingestItemId   String     @unique
  ingestItem     IngestItem @relation(fields: [ingestItemId], references: [id], onDelete: Cascade)
  hookType       String
  ctaType        String
  emotionProfile Json
  templateGuess  String
  summary        String
  risks          Json
  createdAt      DateTime   @default(now())
}

model Outline {
  id           String     @id @default(cuid())
  ingestItemId String     @unique
  ingestItem   IngestItem @relation(fields: [ingestItemId], references: [id], onDelete: Cascade)
  templateType String
  hookDraft    String
  keyPoints    Json
  ctaDraft     String
  emotionPlan  Json
  createdAt    DateTime   @default(now())
}

model Template {
  id         String      @id @default(cuid())
  code       String      @unique
  name       String
  body       Json
  createdAt  DateTime    @default(now())
  draftPosts DraftPost[]
}

model DraftPost {
  id              String           @id @default(cuid())
  ingestItemId    String
  ingestItem      IngestItem       @relation(fields: [ingestItemId], references: [id], onDelete: Restrict)
  templateId      String
  template        Template         @relation(fields: [templateId], references: [id], onDelete: Restrict)
  postText        String
  emotionTriggers Json
  trendScore      Int
  riskFlags       Json
  status          DraftStatus      @default(pending)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  reviewDecisions ReviewDecision[]

  @@index([status])
  @@index([trendScore])
  @@index([createdAt])
}

model ReviewDecision {
  id          String         @id @default(cuid())
  draftPostId String
  draftPost   DraftPost      @relation(fields: [draftPostId], references: [id], onDelete: Cascade)
  action      DecisionAction
  editedText  String?
  note        String?
  createdAt   DateTime       @default(now())

  @@index([action])
  @@index([createdAt])
}

model JobRun {
  id         String    @id @default(cuid())
  jobType    String
  status     JobStatus
  stats      Json
  error      Json?
  startedAt  DateTime  @default(now())
  finishedAt DateTime?

  @@index([status])
  @@index([startedAt])
}
```

---

## 7. データ契約（内部プロトコル）

### 7.1 Normalized Item（IngestItem）

```typescript
type NormalizedItem = {
  externalId: string;          // `${platform}:${id}` (unique)
  platform: "x" | "news" | "youtube" | "manual";
  url: string;
  publishedAt: string;         // ISO
  ingestedAt: string;          // ISO
  language: string | null;
  text: string | null;
  title?: string | null;
  author?: { id?: string; name?: string; handle?: string; followers?: number };
  metrics?: Record<string, number>;
  raw: unknown;
};
```

### 7.2 Candidate Score（BuzzCandidate）

```typescript
type BuzzCandidateResult = {
  score: number;               // 0-100
  reasons: Array<{ code: string; label: string; weight: number; detail?: string }>;
  features: Record<string, number | string>;
};
```

### 7.3 Viral Analysis（ViralAnalysis）

```typescript
type ViralAnalysisResult = {
  detected_template_type: string;
  hook_type: "question" | "shock" | "empathy";
  cta_type: "rt" | "like" | "bookmark" | "follow" | "tease_next" | "mixed" | "none";
  emotion_profile: Record<string, number>;
  short_summary: string;
  risks: {
    hype_risk: "low" | "medium" | "high";
    certainty: "low" | "medium" | "high";
    scam_suspect: boolean;
    notes: string[];
  };
};
```

### 7.4 Outline（Outline）

```typescript
type OutlinePlan = {
  template_choice: { code: string; reason: string };
  hook_draft: string;
  key_points: string[];
  cta_draft: string;
  emotion_plan: Record<string, number>;
};
```

### 7.5 Generated Draft（DraftPost）

```typescript
type DraftPayload = {
  post_text: string;
  template_type: string;
  emotion_triggers: string[];
  trend_score: number;
  risk_flags: {
    hype_level: "low" | "medium" | "high";
    info_certainty: "low" | "medium" | "high";
    notes: string;
  };
};
```

---

## 8. シーケンス図

### 8.1 定期実行（Scheduler→Jobs→Draft生成→レビュー）

```
Scheduler -> API(/api/jobs/run): call
API -> DB(JobRun): create(running)
API/Worker -> External: ingest
API/Worker -> DB(IngestItem): upsert
API/Worker -> DB(BuzzCandidate): create
API/Worker -> LLM: analyze
API/Worker -> DB(ViralAnalysis): create
API/Worker -> DB(Outline): create
API/Worker -> LLM: generate (固定JSON)
API/Worker -> DB(DraftPost): create(pending)
API -> DB(JobRun): update(success)
Operator -> UI(/drafts): list
Operator -> UI(/review/[id]): edit + decision
UI -> API(decision): log
API -> DB(ReviewDecision + DraftPost.status): save
```

### 8.2 手動インポート（URL貼付→単発生成→レビュー）

```
Operator -> API(/api/items/manual): create ingest item
API -> DB(IngestItem): create
Operator -> API(/api/jobs/run {maxItems:1, onlyPlatforms:["manual"]}): run
API/Worker -> analyze/outline/generate
API/Worker -> DB(DraftPost): create
Operator -> UI(/review/[id]): edit + decision
```

---

## 9. 実行計画（フェーズ別ロードマップ）

| Phase | 内容 |
|-------|------|
| Phase 1 基盤 | Next.js/Prisma/Postgres/CI、GCP基盤 |
| Phase 2 データ/API | 主要モデル、seed、draft API、jobs/run骨格 |
| Phase 3 コア | RSS→YouTube→X取得、候補化、解析、構成、生成（JSON保存） |
| Phase 4 UI | /drafts、/review、/sources、/jobs |
| Phase 5 QA | E2E、失敗系、ログ検証 |
| Phase 6 本番 | Cloud Run/SQL/Secrets/Scheduler、監視 |

---

## 10. モジュール分割（実装上の責務）

| モジュール | 責務 |
|----------|------|
| `connectors/*` | xConnector, rssConnector, youtubeConnector, manualImporter |
| `normalizer/*` | 外部レスポンス → IngestItem 共通形式へ |
| `scoring/*` | candidateScore()（媒体別→統合） |
| `analysis/*` | ルール＋LLMで ViralAnalysis 生成 |
| `planner/*` | テンプレ選択 + Outline設計 |
| `generator/*` | System Prompt固定 + JSON出力 + DraftPost 保存 |
| `risk/*` | 誇大表現/断定/詐欺臭/根拠薄の検知、risk_flags 生成 |
| `jobs/*` | runPipeline()（MVPは直列）、将来：ingestJob / detectJob …へ分割 |
| `ui/*` | /drafts, /review/[id] を核に、管理画面を拡張 |

---

## 11. Xバズ投稿生成Agent Prompt（実装用）

```
あなたは「X（旧Twitter）で投稿をバズらせる専門エージェント」です。
暗号通貨・ミームコインの最新情報を、Xで拡散されやすい投稿構造に再設計してください。

【絶対ルール】
- 感情70% / 情報30%
- 1行目は必ずフック（問いかけ型/衝撃事実型/共感体験型）
- 「あなた」視点で書く
- 数字（%/時間/日付）を可能な限り入れる
- 改行を多用し、短文中心で読みやすく
- 最後に必ずCTA（RT/いいね/ブクマ/フォロー/続報予告）
- 出力は日本語
- 誇張しすぎや断定しすぎは避け、リスクがある場合はrisk_noteに記載する

【出力フォーマット：JSON】
{
  "post_text": "...",
  "template_type": "...",
  "emotion_triggers": ["..."],
  "trend_score": 0-100,
  "risk_flags": {
    "hype_level": "low|medium|high",
    "info_certainty": "low|medium|high",
    "notes": "..."
  }
}
```
