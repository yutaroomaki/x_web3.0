import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const samplePosts = [
  {
    text: "Solanaが過去最高のTPS達成！ネットワーク性能が大幅向上 #SOL #Solana",
    postText: `【速報】Solanaが過去最高のTPS達成！

65,000 TPS を記録。

イーサリアムの約1000倍の処理速度。

ガス代も$0.00025と激安。

これでもまだSOL持ってないの？

フォローで最新情報をゲット🔔`,
    score: 92,
    emotions: ["FOMO", "驚き", "緊急性"],
    risk: { hype_level: "medium", info_certainty: "high", notes: "公式データに基づく" },
    status: "pending" as const,
  },
  {
    text: "Breaking: BlackRock Bitcoin ETF sees $500M inflow in single day",
    postText: `ブラックロックBTC ETFに1日で$500M流入

機関投資家が本気で買い始めた。

・過去最大の1日流入額
・累計$10B突破
・BTCの2%を保有

個人投資家より先に動いている。

この流れ、見逃すな。

RT・保存推奨📌`,
    score: 88,
    emotions: ["FOMO", "信頼", "緊急性"],
    risk: { hype_level: "low", info_certainty: "high", notes: "Bloomberg報道に基づく" },
    status: "pending" as const,
  },
  {
    text: "新しいミームコインPEPE 2.0が24時間で1000%上昇",
    postText: `PEPE 2.0が24時間で1000%上昇🚀

初期投資$100 → $10,000

まだ時価総額$5Mと小さい。

注意点：
・流動性が低い
・ラグプルリスクあり
・少額で遊ぶ程度に

DYOR必須。NFA。

気になる人はいいね👍`,
    score: 78,
    emotions: ["FOMO", "興奮", "リスク"],
    risk: { hype_level: "high", info_certainty: "low", notes: "ミームコイン。投資は自己責任" },
    status: "pending" as const,
  },
  {
    text: "Ethereum Dencun upgrade successfully deployed on mainnet",
    postText: `イーサリアムDencunアップグレード完了✅

何が変わった？

1️⃣ L2のガス代が90%削減
2️⃣ Blob導入でスケーラビリティ向上
3️⃣ バリデータの効率改善

これでArbitrumやOptimismが
さらに使いやすくなる。

保存して後で読み返そう📚`,
    score: 75,
    emotions: ["教育", "期待", "技術"],
    risk: { hype_level: "low", info_certainty: "high", notes: "技術アップデートの事実報告" },
    status: "approved" as const,
  },
  {
    text: "仮想通貨取引所FTXの債権者への返済が開始",
    postText: `FTX債権者への返済開始

ついにこの日が来た。

・返済率: 約118%
・対象: $50,000以下の債権者優先
・方法: 暗号資産または現金

被害者の皆さん、お疲れ様でした。

同じ過ちを繰り返さないために
「Not your keys, not your coins」

拡散お願いします🙏`,
    score: 82,
    emotions: ["共感", "安心", "教訓"],
    risk: { hype_level: "low", info_certainty: "high", notes: "裁判所発表に基づく" },
    status: "posted" as const,
  },
  {
    text: "DeFi TVLが$100Bを突破、2022年以来の高水準",
    postText: `DeFi TVLが$100B突破📈

2022年以来の高水準。

内訳：
・Lido: $28B
・Aave: $12B
・MakerDAO: $8B

DeFiは死んでなかった。

むしろ着実に成長している。

次のDeFiサマーに備えよう。

ブックマーク必須🔖`,
    score: 70,
    emotions: ["データ", "期待", "分析"],
    risk: { hype_level: "medium", info_certainty: "high", notes: "DefiLlamaデータに基づく" },
    status: "pending" as const,
  },
  {
    text: "日本でWeb3特区が始動、規制緩和で投資が加速か",
    postText: `日本でWeb3特区が始動🇯🇵

これ、かなり大きなニュース。

・暗号資産の税制優遇
・DAO法人化が可能に
・海外プロジェクトの誘致

日本がWeb3ハブになるかも。

世界が注目している。

日本人として嬉しいニュース。

RT・いいねで応援📣`,
    score: 68,
    emotions: ["期待", "愛国", "ポジティブ"],
    risk: { hype_level: "low", info_certainty: "medium", notes: "政府発表。詳細は今後" },
    status: "approved" as const,
  },
  {
    text: "NFT市場が回復の兆し、Blurの取引量が急増",
    postText: `NFT市場に回復の兆し👀

Blurの取引量が先週比200%増。

・フロア価格が上昇傾向
・新規コレクションも好調
・クリエイター収益も改善

「NFTは終わった」と言われて1年。

本当に終わったのはバブルだけ。

技術は進化を続けている。

反論ある人はコメントで💬`,
    score: 65,
    emotions: ["議論", "分析", "回復"],
    risk: { hype_level: "medium", info_certainty: "medium", notes: "市場データに基づく分析" },
    status: "pending" as const,
  },
  {
    text: "Lightning Network capacity reaches new ATH of 5,000 BTC",
    postText: `Lightning Networkが過去最高を更新⚡

容量: 5,000 BTC（約$200M相当）

これが意味すること：
・BTCの実用性が向上
・少額決済が高速・低コストに
・採用が着実に進んでいる

BTCは価値保存だけじゃない。

決済手段としても進化中。

知っておいて損はない情報💡`,
    score: 62,
    emotions: ["教育", "技術", "成長"],
    risk: { hype_level: "low", info_certainty: "high", notes: "オンチェーンデータ" },
    status: "pending" as const,
  },
  {
    text: "Binance Japan、国内でのサービス拡大を発表",
    postText: `Binance Japanがサービス拡大📢

新たに30銘柄が取引可能に。

注目ポイント：
・BNBが日本で買える
・手数料が業界最安水準
・UIも日本語対応完璧

海外取引所から移行する人も多そう。

日本の仮想通貨市場が
活性化することを期待。

質問あればリプで🙋`,
    score: 58,
    emotions: ["ニュース", "期待", "実用"],
    risk: { hype_level: "low", info_certainty: "high", notes: "公式発表に基づく" },
    status: "rejected" as const,
  },
];

async function main() {
  console.log("📊 Adding more demo data...");

  const source = await prisma.source.findFirst();
  const template = await prisma.template.findFirst();

  if (!source || !template) {
    console.log("❌ Run db:seed first");
    return;
  }

  for (let i = 0; i < samplePosts.length; i++) {
    const post = samplePosts[i];
    const hoursAgo = (i + 1) * 3;

    const ingestItem = await prisma.ingestItem.create({
      data: {
        sourceId: source.id,
        externalId: `more:${Date.now()}-${i}`,
        url: `https://example.com/post/${i}`,
        publishedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        language: "ja",
        text: post.text,
        metrics: { likes: Math.floor(Math.random() * 5000), retweets: Math.floor(Math.random() * 1000) },
        raw: { id: i },
      },
    });

    await prisma.draftPost.create({
      data: {
        ingestItemId: ingestItem.id,
        templateId: template.id,
        postText: post.postText,
        emotionTriggers: post.emotions,
        trendScore: post.score,
        riskFlags: post.risk,
        status: post.status,
      },
    });
  }

  console.log(`✅ Added ${samplePosts.length} more drafts`);

  // Add more job runs
  const statuses = ["success", "success", "success", "failed", "success"] as const;
  for (let i = 0; i < 5; i++) {
    await prisma.jobRun.create({
      data: {
        jobType: "pipeline",
        status: statuses[i],
        stats: {
          ingested: Math.floor(Math.random() * 50) + 10,
          candidates: Math.floor(Math.random() * 20) + 5,
          analyzed: Math.floor(Math.random() * 15) + 3,
          outlined: Math.floor(Math.random() * 10) + 2,
          generated: Math.floor(Math.random() * 8) + 1,
          skipped: Math.floor(Math.random() * 5),
        },
        error: statuses[i] === "failed" ? { message: "API rate limit exceeded" } : undefined,
        startedAt: new Date(Date.now() - (i + 1) * 2 * 60 * 60 * 1000),
        finishedAt: new Date(Date.now() - (i + 1) * 2 * 60 * 60 * 1000 + 120000),
      },
    });
  }

  console.log("✅ Added 5 more job runs");
  console.log("🎉 Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
