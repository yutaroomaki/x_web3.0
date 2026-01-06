import Parser from "rss-parser";
import prisma from "./prisma";
import { trackRssFetch, jobExecutionsTotal, jobExecutionDuration, activeJobs } from "./monitoring";

const parser = new Parser({
  customFields: {
    item: ["media:content", "media:thumbnail"],
  },
});

// Crypto news RSS feeds
const RSS_FEEDS = [
  // Major English crypto news
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    type: "RSS" as const,
  },
  {
    name: "CoinTelegraph",
    url: "https://cointelegraph.com/rss",
    type: "RSS" as const,
  },
  {
    name: "Decrypt",
    url: "https://decrypt.co/feed",
    type: "RSS" as const,
  },
  {
    name: "The Block",
    url: "https://www.theblock.co/rss.xml",
    type: "RSS" as const,
  },
  {
    name: "CoinGape",
    url: "https://coingape.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "NewsBTC",
    url: "https://www.newsbtc.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "BeInCrypto",
    url: "https://beincrypto.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "Bitcoinist",
    url: "https://bitcoinist.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "U.Today",
    url: "https://u.today/rss",
    type: "RSS" as const,
  },
  {
    name: "AMBCrypto",
    url: "https://ambcrypto.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "CryptoPotato",
    url: "https://cryptopotato.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "DailyHodl",
    url: "https://dailyhodl.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "CryptoNews",
    url: "https://cryptonews.com/news/feed/",
    type: "RSS" as const,
  },
  {
    name: "Blockworks",
    url: "https://blockworks.co/feed",
    type: "RSS" as const,
  },
  {
    name: "DeFi Prime",
    url: "https://defiprime.com/feed.xml",
    type: "RSS" as const,
  },
  {
    name: "The Defiant",
    url: "https://thedefiant.io/feed",
    type: "RSS" as const,
  },
  {
    name: "Crypto Briefing",
    url: "https://cryptobriefing.com/feed/",
    type: "RSS" as const,
  },
  // Japanese crypto news
  {
    name: "CoinPost",
    url: "https://coinpost.jp/?feed=rss2",
    type: "RSS" as const,
  },
  {
    name: "CoinTelegraph Japan",
    url: "https://jp.cointelegraph.com/rss",
    type: "RSS" as const,
  },
  {
    name: "CoinDesk Japan",
    url: "https://www.coindeskjapan.com/feed/",
    type: "RSS" as const,
  },
  {
    name: "CRYPTO TIMES",
    url: "https://crypto-times.jp/feed/",
    type: "RSS" as const,
  },
  {
    name: "あたらしい経済",
    url: "https://www.neweconomy.jp/feed",
    type: "RSS" as const,
  },
];

export type FetchResult = {
  source: string;
  fetched: number;
  new: number;
  errors: string[];
};

export async function fetchRSSFeeds(): Promise<FetchResult[]> {
  const jobStartTime = Date.now();
  activeJobs.inc({ job_type: "fetch_rss" });

  const results: FetchResult[] = [];

  try {
    // Ensure RSS source exists
    let rssSource = await prisma.source.findFirst({
      where: { type: "RSS" },
    });

    if (!rssSource) {
      rssSource = await prisma.source.create({
        data: {
          type: "RSS",
          name: "Crypto News RSS",
          config: { feeds: RSS_FEEDS.map((f) => f.url) },
          enabled: true,
        },
      });
    }

    for (const feed of RSS_FEEDS) {
      const feedStartTime = Date.now();
      const result: FetchResult = {
        source: feed.name,
        fetched: 0,
        new: 0,
        errors: [],
      };

      try {
        const feedData = await parser.parseURL(feed.url);
        result.fetched = feedData.items?.length || 0;

        for (const item of feedData.items || []) {
          if (!item.link || !item.title) continue;

          // Check if already exists
          const existing = await prisma.ingestItem.findUnique({
            where: { externalId: `rss:${item.link}` },
          });

          if (existing) continue;

          // Create new ingest item
          await prisma.ingestItem.create({
            data: {
              sourceId: rssSource.id,
              externalId: `rss:${item.link}`,
              url: item.link,
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
              language: detectLanguage(item.title + " " + (item.contentSnippet || "")),
              text: item.title,
              metrics: {
                source: feed.name,
                categories: item.categories || [],
              },
              raw: {
                title: item.title,
                content: item.contentSnippet || item.content || "",
                creator: item.creator || (item as unknown as { author?: string }).author || "",
                categories: item.categories || [],
              },
            },
          });

          result.new++;
        }

        // Track successful RSS fetch
        trackRssFetch(
          feed.name,
          "success",
          Date.now() - feedStartTime,
          result.fetched,
          result.new
        );
      } catch (error) {
        result.errors.push(error instanceof Error ? error.message : "Unknown error");

        // Track failed RSS fetch
        trackRssFetch(
          feed.name,
          "error",
          Date.now() - feedStartTime,
          0,
          0
        );
      }

      results.push(result);
    }

    // Track successful job completion
    const jobDuration = Date.now() - jobStartTime;
    jobExecutionsTotal.inc({ job_type: "fetch_rss", status: "success" });
    jobExecutionDuration.observe({ job_type: "fetch_rss" }, jobDuration / 1000);

    return results;
  } catch (error) {
    // Track job failure
    const jobDuration = Date.now() - jobStartTime;
    jobExecutionsTotal.inc({ job_type: "fetch_rss", status: "failed" });
    jobExecutionDuration.observe({ job_type: "fetch_rss" }, jobDuration / 1000);

    throw error;
  } finally {
    activeJobs.dec({ job_type: "fetch_rss" });
  }
}

function detectLanguage(text: string): string {
  // Simple Japanese detection
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
  return hasJapanese ? "ja" : "en";
}

// Keywords for filtering crypto-related content
const CRYPTO_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "crypto",
  "blockchain",
  "defi",
  "nft",
  "web3",
  "token",
  "altcoin",
  "solana",
  "sol",
  "binance",
  "coinbase",
  "exchange",
  "wallet",
  "mining",
  "staking",
  "airdrop",
  "仮想通貨",
  "暗号資産",
  "ビットコイン",
  "イーサリアム",
];

export function isCryptoRelated(text: string): boolean {
  const lowerText = text.toLowerCase();
  return CRYPTO_KEYWORDS.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}
