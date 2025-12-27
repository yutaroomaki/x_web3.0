import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 30 X post templates
const templates = [
  // Urgency Templates (1-5)
  {
    code: "URG_BREAKING",
    name: "緊急速報型",
    body: {
      category: "urgency",
      hook_type: "shock",
      description: "速報ニュースを伝える緊急性の高い投稿",
      structure: {
        hook: "【速報】{topic}が{event}",
        body: "{detail1}\n\n{detail2}\n\n{impact}",
        cta: "最新情報が入り次第お伝えします。\nフォローして続報をお待ちください",
      },
    },
  },
  {
    code: "URG_COUNTDOWN",
    name: "カウントダウン型",
    body: {
      category: "urgency",
      hook_type: "shock",
      description: "期限を設けて緊急性を演出",
      structure: {
        hook: "あと{time}で{event}",
        body: "{reason}\n\n{action_needed}",
        cta: "今すぐチェック",
      },
    },
  },
  {
    code: "URG_ALERT",
    name: "警告型",
    body: {
      category: "urgency",
      hook_type: "shock",
      description: "注意喚起や警告を促す投稿",
      structure: {
        hook: "⚠️ {warning}",
        body: "{detail}\n\n{evidence}",
        cta: "拡散して被害を防ぎましょう",
      },
    },
  },
  {
    code: "URG_EXCLUSIVE",
    name: "独占情報型",
    body: {
      category: "urgency",
      hook_type: "shock",
      description: "限定・独占情報を強調",
      structure: {
        hook: "【独占】まだ誰も知らない{topic}",
        body: "{insider_info}\n\n{implication}",
        cta: "続きはリプ欄で",
      },
    },
  },
  {
    code: "URG_REALTIME",
    name: "リアルタイム実況型",
    body: {
      category: "urgency",
      hook_type: "shock",
      description: "今起きていることをリアルタイムで共有",
      structure: {
        hook: "今、{event}が起きています",
        body: "{observation}\n\n{data}",
        cta: "状況をウォッチ中。いいねで通知ON",
      },
    },
  },

  // FOMO Templates (6-10)
  {
    code: "FOMO_MISSED",
    name: "乗り遅れ警告型",
    body: {
      category: "fomo",
      hook_type: "question",
      description: "機会損失への恐怖を刺激",
      structure: {
        hook: "まだ{topic}知らないの？",
        body: "{success_story}\n\n{opportunity}",
        cta: "今からでも遅くない。保存して後で読んで",
      },
    },
  },
  {
    code: "FOMO_EARLY",
    name: "先行者利益型",
    body: {
      category: "fomo",
      hook_type: "shock",
      description: "早期参入のメリットを強調",
      structure: {
        hook: "1%の人しか知らない{topic}",
        body: "{why_early}\n\n{potential}",
        cta: "この投稿を保存して準備を",
      },
    },
  },
  {
    code: "FOMO_REGRET",
    name: "後悔型",
    body: {
      category: "fomo",
      hook_type: "empathy",
      description: "過去の機会損失から学ぶ形式",
      structure: {
        hook: "あの時{action}していれば...",
        body: "{past_opportunity}\n\n{current_similar}",
        cta: "同じ後悔をしないために。RT",
      },
    },
  },
  {
    code: "FOMO_WAVE",
    name: "波乗り型",
    body: {
      category: "fomo",
      hook_type: "shock",
      description: "トレンドの波に乗ることを促す",
      structure: {
        hook: "{trend}の波が来ている",
        body: "{evidence}\n\n{how_to_ride}",
        cta: "今がチャンス。ブックマーク必須",
      },
    },
  },
  {
    code: "FOMO_INSIDER",
    name: "インサイダー風型",
    body: {
      category: "fomo",
      hook_type: "shock",
      description: "内部情報を匂わせる",
      structure: {
        hook: "これ言っていいのかわからないけど...",
        body: "{hint}\n\n{implication}",
        cta: "DYOR。でも知っておいて損はない",
      },
    },
  },

  // Education Templates (11-15)
  {
    code: "EDU_THREAD",
    name: "解説スレッド型",
    body: {
      category: "education",
      hook_type: "question",
      description: "知識を体系的に解説",
      structure: {
        hook: "{topic}を5分で完全理解🧵",
        body: "1. {point1}\n2. {point2}\n3. {point3}",
        cta: "保存して後で読み返そう。いいねで応援",
      },
    },
  },
  {
    code: "EDU_MISTAKE",
    name: "失敗から学ぶ型",
    body: {
      category: "education",
      hook_type: "empathy",
      description: "失敗談から教訓を伝える",
      structure: {
        hook: "この失敗で{amount}失いました",
        body: "{what_happened}\n\n{lesson}",
        cta: "同じ失敗をしないで。RT拡散希望",
      },
    },
  },
  {
    code: "EDU_COMPARE",
    name: "比較解説型",
    body: {
      category: "education",
      hook_type: "question",
      description: "2つの選択肢を比較",
      structure: {
        hook: "{option1} vs {option2}どっちがいい？",
        body: "{comparison}\n\n{conclusion}",
        cta: "あなたはどっち派？コメントで教えて",
      },
    },
  },
  {
    code: "EDU_BEGINNER",
    name: "初心者向け型",
    body: {
      category: "education",
      hook_type: "empathy",
      description: "初心者に優しく解説",
      structure: {
        hook: "仮想通貨始めたい人、これだけ覚えて",
        body: "{essential1}\n{essential2}\n{essential3}",
        cta: "わからないことはリプで質問を",
      },
    },
  },
  {
    code: "EDU_MYTH",
    name: "誤解解消型",
    body: {
      category: "education",
      hook_type: "shock",
      description: "よくある誤解を正す",
      structure: {
        hook: "{myth}は完全な嘘です",
        body: "{truth}\n\n{evidence}",
        cta: "正しい情報を広めよう。RT",
      },
    },
  },

  // Story Templates (16-20)
  {
    code: "STORY_JOURNEY",
    name: "成功ストーリー型",
    body: {
      category: "story",
      hook_type: "empathy",
      description: "成功までの道のりを語る",
      structure: {
        hook: "{start}から{goal}までの話",
        body: "{journey}\n\n{turning_point}",
        cta: "あなたも諦めないで。いいねで応援",
      },
    },
  },
  {
    code: "STORY_BEHIND",
    name: "裏話型",
    body: {
      category: "story",
      hook_type: "shock",
      description: "知られざる裏話を公開",
      structure: {
        hook: "{topic}の知られざる真実",
        body: "{reveal}\n\n{implication}",
        cta: "この話、もっと広まるべき。RT",
      },
    },
  },
  {
    code: "STORY_DAILY",
    name: "日常切り取り型",
    body: {
      category: "story",
      hook_type: "empathy",
      description: "日常の一コマから気づきを得る",
      structure: {
        hook: "今日こんなことがあった",
        body: "{episode}\n\n{insight}",
        cta: "共感したらいいね",
      },
    },
  },
  {
    code: "STORY_TRANSFORMATION",
    name: "変化型",
    body: {
      category: "story",
      hook_type: "empathy",
      description: "ビフォーアフターを見せる",
      structure: {
        hook: "{before} → {after}",
        body: "{how}\n\n{key_factor}",
        cta: "あなたも変われる。保存",
      },
    },
  },
  {
    code: "STORY_CONFESSION",
    name: "告白型",
    body: {
      category: "story",
      hook_type: "empathy",
      description: "正直な告白で共感を得る",
      structure: {
        hook: "正直に言います",
        body: "{confession}\n\n{lesson}",
        cta: "同じ経験ある人いいね",
      },
    },
  },

  // Controversy Templates (21-25)
  {
    code: "CONT_UNPOPULAR",
    name: "逆張り型",
    body: {
      category: "controversy",
      hook_type: "shock",
      description: "一般論と反対の意見を述べる",
      structure: {
        hook: "批判覚悟で言うけど",
        body: "{unpopular_opinion}\n\n{reasoning}",
        cta: "反論あればコメントで",
      },
    },
  },
  {
    code: "CONT_PREDICTION",
    name: "予言型",
    body: {
      category: "controversy",
      hook_type: "shock",
      description: "大胆な予測を述べる",
      structure: {
        hook: "{timeframe}後、{prediction}",
        body: "{basis}\n\n{scenario}",
        cta: "スクショ保存推奨",
      },
    },
  },
  {
    code: "CONT_TRUTH",
    name: "真実暴露型",
    body: {
      category: "controversy",
      hook_type: "shock",
      description: "隠された真実を暴く",
      structure: {
        hook: "{topic}の不都合な真実",
        body: "{revelation}\n\n{evidence}",
        cta: "広めるべき事実。RT",
      },
    },
  },
  {
    code: "CONT_CHALLENGE",
    name: "挑戦状型",
    body: {
      category: "controversy",
      hook_type: "question",
      description: "読者に挑戦を投げかける",
      structure: {
        hook: "これに反論できる人いる？",
        body: "{claim}\n\n{support}",
        cta: "反論待ってます",
      },
    },
  },
  {
    code: "CONT_DEBATE",
    name: "議論喚起型",
    body: {
      category: "controversy",
      hook_type: "question",
      description: "賛否が分かれるテーマで議論を促す",
      structure: {
        hook: "{topic}について議論しよう",
        body: "{side1}\n{side2}",
        cta: "あなたの意見をコメントで",
      },
    },
  },

  // Data Templates (26-30)
  {
    code: "DATA_STATS",
    name: "統計データ型",
    body: {
      category: "data",
      hook_type: "shock",
      description: "驚きの統計データを提示",
      structure: {
        hook: "衝撃のデータ：{stat}",
        body: "{context}\n\n{implication}",
        cta: "データは嘘をつかない。保存",
      },
    },
  },
  {
    code: "DATA_CHART",
    name: "チャート解説型",
    body: {
      category: "data",
      hook_type: "shock",
      description: "チャートパターンを解説",
      structure: {
        hook: "このチャート、見逃さないで",
        body: "{pattern}\n\n{what_it_means}",
        cta: "テクニカル派はRT",
      },
    },
  },
  {
    code: "DATA_ONCHAIN",
    name: "オンチェーン分析型",
    body: {
      category: "data",
      hook_type: "shock",
      description: "オンチェーンデータから洞察",
      structure: {
        hook: "オンチェーンが示す{insight}",
        body: "{data}\n\n{interpretation}",
        cta: "データで判断。いいね",
      },
    },
  },
  {
    code: "DATA_RANKING",
    name: "ランキング型",
    body: {
      category: "data",
      hook_type: "question",
      description: "ランキング形式で情報を整理",
      structure: {
        hook: "{topic}ランキングTOP{n}",
        body: "1位：{first}\n2位：{second}\n3位：{third}",
        cta: "異論あればコメント",
      },
    },
  },
  {
    code: "DATA_TIMELINE",
    name: "タイムライン型",
    body: {
      category: "data",
      hook_type: "shock",
      description: "時系列で出来事を整理",
      structure: {
        hook: "{topic}の歴史を振り返る",
        body: "{year1}: {event1}\n{year2}: {event2}\n{year3}: {event3}",
        cta: "歴史は繰り返す。保存",
      },
    },
  },
];

// Sample sources
const sources = [
  {
    type: "RSS" as const,
    name: "CoinDesk News",
    config: { url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
    enabled: true,
  },
  {
    type: "RSS" as const,
    name: "Cointelegraph",
    config: { url: "https://cointelegraph.com/rss" },
    enabled: true,
  },
  {
    type: "X_SEARCH" as const,
    name: "BTC Whale Alerts",
    config: { query: "bitcoin whale OR BTC whale min_faves:100" },
    enabled: true,
  },
  {
    type: "YOUTUBE_SEARCH" as const,
    name: "Crypto News YouTube",
    config: { keywords: ["cryptocurrency news", "bitcoin analysis"] },
    enabled: false,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed templates
  console.log("📝 Creating templates...");
  for (const template of templates) {
    await prisma.template.upsert({
      where: { code: template.code },
      update: { name: template.name, body: template.body },
      create: template,
    });
  }
  console.log(`✅ Created ${templates.length} templates`);

  // Seed sources
  console.log("📡 Creating sources...");
  for (const source of sources) {
    await prisma.source.create({
      data: source,
    });
  }
  console.log(`✅ Created ${sources.length} sources`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
