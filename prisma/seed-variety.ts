import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const varietyPosts = [
  // FOMO_EARLY - 先行者利益型
  {
    templateCode: "FOMO_EARLY",
    text: "New L2 protocol launching next month with airdrop for early users",
    postText: `まだ誰も気づいてない。

新しいL2プロトコルが来月ローンチ。

早期ユーザーにエアドロ確定。

今テストネット触ってる人→将来の勝ち組
まだ知らない人→また後悔するかも

リンクはプロフから。
触るだけでOK。

5分で終わる。やるかやらないか。`,
    score: 85,
    emotions: ["FOMO", "先行者利益", "緊急性"],
    risk: { hype_level: "medium", info_certainty: "medium", notes: "エアドロ確定ではない可能性" },
    status: "pending" as const,
  },
  // EDU_THREAD - 解説スレッド型
  {
    templateCode: "EDU_THREAD",
    text: "Understanding tokenomics: supply, demand, and price impact",
    postText: `【保存版】トークノミクス完全解説

なぜあのコインは上がって、このコインは下がるのか？

答えは「トークノミクス」にある。

1/10 スレッドで解説していきます👇

いいね・RTで応援お願いします。`,
    score: 72,
    emotions: ["教育", "好奇心", "価値提供"],
    risk: { hype_level: "low", info_certainty: "high", notes: "教育コンテンツ" },
    status: "approved" as const,
  },
  // STORY_JOURNEY - 成功ストーリー型
  {
    templateCode: "STORY_JOURNEY",
    text: "From $500 to $50,000: My DeFi journey in 2024",
    postText: `2024年、僕は$500から始めた。

今、ポートフォリオは$50,000。

100倍？いや、運じゃない。

・毎日2時間のリサーチ
・損切りルールの徹底
・メンタル管理

この1年で学んだこと、
全部シェアしていく。

フォローで見逃すな。`,
    score: 79,
    emotions: ["希望", "共感", "モチベーション"],
    risk: { hype_level: "medium", info_certainty: "low", notes: "個人の体験談。投資成果は保証されない" },
    status: "pending" as const,
  },
  // CONT_UNPOPULAR - 逆張り型
  {
    templateCode: "CONT_UNPOPULAR",
    text: "Unpopular opinion: Most altcoins will go to zero",
    postText: `不人気な意見を言う。

アルトコインの95%はゼロになる。

「え、でも〇〇は...」
→ならない可能性もある
→でも統計的には厳しい

生き残るのは：
・実需があるもの
・開発が続いてるもの
・コミュニティが強いもの

反論あればリプで。`,
    score: 68,
    emotions: ["議論", "警告", "現実"],
    risk: { hype_level: "low", info_certainty: "medium", notes: "意見記事" },
    status: "pending" as const,
  },
  // DATA_STATS - 統計データ型
  {
    templateCode: "DATA_STATS",
    text: "On-chain data shows whale accumulation hitting 6-month high",
    postText: `【データで見る】クジラが動いてる

過去6ヶ月で最大の蓄積フェーズ。

📊 数字で見ると：
・1000BTC以上保有アドレス: +3.2%
・取引所からの流出: 過去最高
・ステーブルコイン準備: $50B超

彼らが何を見てるのか。

データは嘘をつかない。`,
    score: 81,
    emotions: ["データ", "分析", "説得力"],
    risk: { hype_level: "low", info_certainty: "high", notes: "オンチェーンデータに基づく" },
    status: "approved" as const,
  },
  // FOMO_WAVE - 波乗り型
  {
    templateCode: "FOMO_WAVE",
    text: "AI tokens pumping hard, which ones to watch",
    postText: `AIトークンが爆上げ中🔥

この波、乗るか乗らないか。

注目の3銘柄：
1️⃣ $RNDR - GPU需要で急騰
2️⃣ $FET - AI Agent注目
3️⃣ $OCEAN - データ経済

どれを持ってる？

コメントで教えて👇`,
    score: 76,
    emotions: ["FOMO", "興奮", "参加"],
    risk: { hype_level: "high", info_certainty: "medium", notes: "特定銘柄の言及。NFA" },
    status: "pending" as const,
  },
  // EDU_MISTAKE - 失敗から学ぶ型
  {
    templateCode: "EDU_MISTAKE",
    text: "5 mistakes I made that cost me $10,000",
    postText: `$10,000溶かして学んだこと。

❌ やってはいけない5つ：

1. レバレッジかけすぎ
2. 損切りできない
3. FOMO買い
4. リサーチ不足
5. 全額一点集中

同じ失敗、しないで。

保存して何度も読み返して📌`,
    score: 74,
    emotions: ["共感", "教訓", "警告"],
    risk: { hype_level: "low", info_certainty: "high", notes: "教育コンテンツ" },
    status: "approved" as const,
  },
  // URG_EXCLUSIVE - 独占情報型
  {
    templateCode: "URG_EXCLUSIVE",
    text: "Leaked: Major partnership announcement coming for top L1",
    postText: `【独占】関係者から入手。

某トップL1が大型提携を発表予定。

・相手は誰もが知る大企業
・発表は今週中の可能性
・価格への影響は大きい

どのL1だと思う？

ヒント：最近TVLが急増中。

答え合わせはまた後で。`,
    score: 83,
    emotions: ["独占", "期待", "好奇心"],
    risk: { hype_level: "high", info_certainty: "low", notes: "未確認情報。慎重に" },
    status: "pending" as const,
  },
  // STORY_CONFESSION - 告白型
  {
    templateCode: "STORY_CONFESSION",
    text: "I almost gave up on crypto last year. Here's what changed.",
    postText: `正直に言う。

去年、仮想通貨やめようと思った。

・含み損が膨らむ毎日
・周りからの冷たい目
・「やっぱり詐欺だった」の声

でも続けた。

今、あの時の自分に感謝してる。

同じ気持ちの人、いる？`,
    score: 71,
    emotions: ["共感", "希望", "正直"],
    risk: { hype_level: "low", info_certainty: "high", notes: "個人の体験談" },
    status: "pending" as const,
  },
  // DATA_CHART - チャート解説型
  {
    templateCode: "DATA_CHART",
    text: "BTC weekly chart showing classic accumulation pattern",
    postText: `BTCの週足チャート見た？

教科書通りの蓄積パターン。

✅ 出来高減少
✅ ボラティリティ低下
✅ サポートラインで反発

次は何が起きるか。

歴史は繰り返す...とは限らない。
でも知っておいて損はない。

RT・保存推奨📊`,
    score: 69,
    emotions: ["分析", "データ", "教育"],
    risk: { hype_level: "low", info_certainty: "medium", notes: "テクニカル分析。予測は保証されない" },
    status: "approved" as const,
  },
  // CONT_PREDICTION - 予言型
  {
    templateCode: "CONT_PREDICTION",
    text: "My bold prediction: ETH will flip BTC in market cap by 2026",
    postText: `大胆予言する。

2026年までにETHがBTCの時価総額を超える。

根拠：
・DeFi/NFTの基盤
・レイヤー2エコシステム
・機関投資家の関心

「ありえない」って？

スクショ撮っておいて。
2年後に答え合わせしよう。`,
    score: 77,
    emotions: ["議論", "予言", "挑戦"],
    risk: { hype_level: "medium", info_certainty: "low", notes: "個人の予測" },
    status: "pending" as const,
  },
  // EDU_BEGINNER - 初心者向け型
  {
    templateCode: "EDU_BEGINNER",
    text: "Crypto basics: What is a blockchain?",
    postText: `【超初心者向け】ブロックチェーンって何？

難しく考えなくていい。

📖 一言で言うと：
「みんなで管理する改ざんできない帳簿」

なぜすごいのか？
→銀行なしで送金できる
→誰も不正できない
→24時間365日動く

これがわかれば第一歩クリア✅`,
    score: 58,
    emotions: ["教育", "親切", "入門"],
    risk: { hype_level: "low", info_certainty: "high", notes: "教育コンテンツ" },
    status: "approved" as const,
  },
  // DATA_RANKING - ランキング型
  {
    templateCode: "DATA_RANKING",
    text: "Top 5 performing tokens this week",
    postText: `今週のパフォーマンスTOP5🏆

1位: $XXX +180%
2位: $YYY +95%
3位: $ZZZ +72%
4位: $AAA +58%
5位: $BBB +45%

共通点わかる？

全部〇〇セクター。

来週もこの流れ続くか注目👀`,
    score: 67,
    emotions: ["データ", "ランキング", "情報"],
    risk: { hype_level: "medium", info_certainty: "high", notes: "過去のパフォーマンス。将来を保証しない" },
    status: "pending" as const,
  },
  // FOMO_REGRET - 後悔型
  {
    templateCode: "FOMO_REGRET",
    text: "Remember when SOL was $8? Those who bought are up 20x",
    postText: `覚えてる？

SOLが$8だった頃。

「危ない」「終わった」って言われてた。

あの時買った人→今20倍。

次の「$8のSOL」はどれか。

僕は〇〇だと思ってる。

同じ後悔、したくないよね？`,
    score: 80,
    emotions: ["FOMO", "後悔", "機会"],
    risk: { hype_level: "high", info_certainty: "low", notes: "過去の結果は将来を保証しない" },
    status: "pending" as const,
  },
  // STORY_BEHIND - 裏話型
  {
    templateCode: "STORY_BEHIND",
    text: "The real reason why that token pumped 500%",
    postText: `500%上がったあのトークン。

表向きの理由：「大型提携発表」

本当の理由：
→3週間前からクジラが仕込んでた
→インフルエンサーに事前告知
→発表直後に大量売り

気づいた時には遅い。

これが仮想通貨の現実。
知っておいて損はない。`,
    score: 73,
    emotions: ["暴露", "教訓", "現実"],
    risk: { hype_level: "low", info_certainty: "medium", notes: "一般的な市場構造の解説" },
    status: "approved" as const,
  },
];

async function main() {
  console.log("🎨 Adding variety template posts...");

  const source = await prisma.source.findFirst();
  if (!source) {
    console.log("❌ No source found. Run db:seed first.");
    return;
  }

  // Get all templates as a map
  const templates = await prisma.template.findMany();
  const templateMap = new Map(templates.map((t) => [t.code, t]));

  let created = 0;
  for (let i = 0; i < varietyPosts.length; i++) {
    const post = varietyPosts[i];
    const template = templateMap.get(post.templateCode);

    if (!template) {
      console.log(`⚠️ Template not found: ${post.templateCode}`);
      continue;
    }

    const hoursAgo = (i + 1) * 2 + Math.random() * 5;

    const ingestItem = await prisma.ingestItem.create({
      data: {
        sourceId: source.id,
        externalId: `variety:${Date.now()}-${i}`,
        url: `https://example.com/variety/${i}`,
        publishedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        language: post.text.match(/[a-zA-Z]/) ? "en" : "ja",
        text: post.text,
        metrics: {
          likes: Math.floor(Math.random() * 8000) + 500,
          retweets: Math.floor(Math.random() * 2000) + 100,
        },
        raw: { id: i, type: "variety" },
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

    created++;
    console.log(`  ✅ ${template.name}`);
  }

  console.log(`\n🎉 Added ${created} posts with various templates!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
