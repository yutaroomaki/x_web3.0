import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎭 Adding demo data...");

  // Get first source
  const source = await prisma.source.findFirst();
  if (!source) {
    console.log("❌ No source found. Run db:seed first.");
    return;
  }

  // Get first template
  const template = await prisma.template.findFirst();
  if (!template) {
    console.log("❌ No template found. Run db:seed first.");
    return;
  }

  // Create demo IngestItems
  const ingestItems = await Promise.all([
    prisma.ingestItem.create({
      data: {
        sourceId: source.id,
        externalId: `demo:${Date.now()}-1`,
        url: "https://twitter.com/example/status/123",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        language: "ja",
        text: "ビットコインが史上最高値を更新！機関投資家の買いが加速中 #BTC #仮想通貨",
        metrics: { likes: 1500, retweets: 320, replies: 89 },
        raw: { platform: "x", id: "123" },
      },
    }),
    prisma.ingestItem.create({
      data: {
        sourceId: source.id,
        externalId: `demo:${Date.now()}-2`,
        url: "https://twitter.com/example/status/456",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        language: "en",
        text: "BREAKING: Major exchange announces new listing next week. This could be huge! 🚀",
        metrics: { likes: 2300, retweets: 890, replies: 234 },
        raw: { platform: "x", id: "456" },
      },
    }),
    prisma.ingestItem.create({
      data: {
        sourceId: source.id,
        externalId: `demo:${Date.now()}-3`,
        url: "https://www.coindesk.com/article/example",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        language: "en",
        text: "Ethereum Layer 2 solutions see record transaction volumes as gas fees remain low",
        metrics: { views: 15000 },
        raw: { platform: "news", source: "coindesk" },
      },
    }),
  ]);

  console.log(`✅ Created ${ingestItems.length} demo IngestItems`);

  // Create demo DraftPosts
  const drafts = await Promise.all([
    prisma.draftPost.create({
      data: {
        ingestItemId: ingestItems[0].id,
        templateId: template.id,
        postText: `【速報】ビットコインが史上最高値を更新！

機関投資家の買いが止まらない。

過去24時間で$500M以上が流入。

あなたはこの波に乗れていますか？

続報が入り次第お伝えします。
フォローして最新情報をお見逃しなく🔔`,
        emotionTriggers: ["FOMO", "興奮", "緊急性"],
        trendScore: 87,
        riskFlags: {
          hype_level: "medium",
          info_certainty: "high",
          notes: "公式発表に基づく情報",
        },
        status: "pending",
      },
    }),
    prisma.draftPost.create({
      data: {
        ingestItemId: ingestItems[1].id,
        templateId: template.id,
        postText: `まだ知らない？

来週、大手取引所が重大発表を予定。

関係者によると「市場を変える」レベルとのこと。

今のうちにチェックしておいて損はない。

保存して後で確認📌`,
        emotionTriggers: ["FOMO", "好奇心", "独占感"],
        trendScore: 72,
        riskFlags: {
          hype_level: "high",
          info_certainty: "low",
          notes: "未確認情報。断定的な表現を避けること",
        },
        status: "pending",
      },
    }),
    prisma.draftPost.create({
      data: {
        ingestItemId: ingestItems[2].id,
        templateId: template.id,
        postText: `イーサリアムL2が過去最高の取引量を記録📈

なぜ今L2が注目されているのか？

1. ガス代が激安（$0.01以下）
2. 処理速度が爆速
3. メインネットと同等のセキュリティ

2025年はL2の年になる。

今から触っておくべき理由をスレッドで解説👇`,
        emotionTriggers: ["教育", "好奇心", "将来性"],
        trendScore: 65,
        riskFlags: {
          hype_level: "low",
          info_certainty: "high",
          notes: "データに基づく分析",
        },
        status: "approved",
      },
    }),
  ]);

  console.log(`✅ Created ${drafts.length} demo DraftPosts`);

  // Create a demo JobRun
  await prisma.jobRun.create({
    data: {
      jobType: "pipeline",
      status: "success",
      stats: {
        ingested: 15,
        candidates: 8,
        analyzed: 8,
        outlined: 5,
        generated: 3,
        skipped: 2,
      },
      startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      finishedAt: new Date(Date.now() - 28 * 60 * 1000), // 28 minutes ago
    },
  });

  console.log("✅ Created demo JobRun");
  console.log("🎉 Demo data added successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
