import prisma from "./prisma";
import {
  trackDraftGeneration,
  jobExecutionsTotal,
  jobExecutionDuration,
  activeJobs,
  draftsGeneratedByTemplate,
  draftGenerationQueueLength,
} from "./monitoring";

// Crypto term translations
const TERM_TRANSLATIONS: Record<string, string> = {
  "bitcoin": "ビットコイン",
  "btc": "BTC",
  "ethereum": "イーサリアム",
  "eth": "ETH",
  "solana": "ソラナ",
  "ripple": "リップル",
  "xrp": "XRP",
  "cardano": "カルダノ",
  "polygon": "ポリゴン",
  "avalanche": "アバランチ",
  "chainlink": "チェーンリンク",
  "uniswap": "ユニスワップ",
  "aave": "Aave",
  "defi": "DeFi",
  "nft": "NFT",
  "dao": "DAO",
  "etf": "ETF",
  "sec": "SEC",
  "cftc": "CFTC",
  "crypto": "仮想通貨",
  "cryptocurrency": "暗号通貨",
  "blockchain": "ブロックチェーン",
  "stablecoin": "ステーブルコイン",
  "token": "トークン",
  "wallet": "ウォレット",
  "exchange": "取引所",
  "mining": "マイニング",
  "staking": "ステーキング",
  "airdrop": "エアドロップ",
  "whale": "クジラ",
  "bullish": "強気",
  "bearish": "弱気",
  "surge": "急騰",
  "rally": "上昇",
  "crash": "暴落",
  "plunge": "急落",
  "tvl": "TVL",
  "layer 2": "レイヤー2",
  "l2": "L2",
  "mainnet": "メインネット",
  "testnet": "テストネット",
  "hard fork": "ハードフォーク",
  "upgrade": "アップグレード",
  "coinbase": "Coinbase",
  "binance": "Binance",
  "kraken": "Kraken",
  "jpmorgan": "JPモルガン",
  "blackrock": "ブラックロック",
  "microstrategy": "マイクロストラテジー",
  "bnb": "BNB",
  "bnb chain": "BNBチェーン",
  "doge": "DOGE",
  "dogecoin": "ドージコイン",
  "ada": "ADA",
  "bch": "BCH",
  "link": "LINK",
  "sol": "SOL",
  "hype": "HYPE",
  "zcash": "Zcash",
  "usdc": "USDC",
  "usdt": "USDT",
  "usx": "USX",
  "iren": "IREN",
  "bitdeer": "Bitdeer",
  "emerge": "Emerge",
  "ai": "AI",
  "ai-era": "AI時代",
  "santa rally": "サンタラリー",
  "depeg": "ディペッグ",
  "governance": "ガバナンス",
  "liquidity": "流動性",
  "dex": "DEX",
  "privacy": "プライバシー",
  "shielded": "シールド",
  "proof of stake": "PoS",
  "pos": "PoS",
  "burn": "バーン",
  "eyes": "を目指す",
  "target": "目標",
  "trust wallet": "Trust Wallet",
  "tether": "テザー",
  "rwa": "RWA",
  "tokenization": "トークン化",
  "proposal": "提案",
  "vote": "投票",
  "hack": "ハッキング",
  "hacked": "ハッキング",
  "chrome": "Chrome",
  "extension": "拡張機能",
  "bubble": "バブル",
  "sentiment": "センチメント",
  "fear": "恐怖",
  "greed": "貪欲",
  "memecoin": "ミームコイン",
  "memecoins": "ミームコイン",
  "nuclear": "原子力",
  "plant": "発電所",
  "christmas": "クリスマス",
  "trump": "トランプ",
  "musk": "マスク",
};

// Translate English text with crypto terms
function translateText(text: string): string {
  let result = text;

  // Sort by length (longest first) to avoid partial replacements
  const sortedTerms = Object.entries(TERM_TRANSLATIONS)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [eng, ja] of sortedTerms) {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    result = result.replace(regex, ja);
  }

  return result;
}

// Extract key numbers and facts from content
function extractKeyInfo(title: string, content: string): { numbers: string[], facts: string[] } {
  const numbers: string[] = [];
  const facts: string[] = [];

  // Extract dollar amounts
  const dollarMatches = (title + " " + content).match(/\$[\d,.]+[BMK]?/g);
  if (dollarMatches) {
    numbers.push(...dollarMatches.slice(0, 3));
  }

  // Extract percentages
  const percentMatches = (title + " " + content).match(/[\d.]+%/g);
  if (percentMatches) {
    numbers.push(...percentMatches.slice(0, 2));
  }

  // Extract price levels
  const priceMatches = (title + " " + content).match(/\$[\d,]+(?:\.\d+)?/g);
  if (priceMatches) {
    numbers.push(...priceMatches.slice(0, 2));
  }

  return { numbers: [...new Set(numbers)], facts };
}

// Extract company/entity name from title
function extractEntity(title: string): string | null {
  // Match company names (capitalized words, often with specific patterns)
  const entityPatterns = [
    /\b(Coinbase|Binance|Kraken|Bitfinex|OKX|Bybit|Gemini|Robinhood)\b/i,
    /\b(BlackRock|Fidelity|JPMorgan|Goldman Sachs|Morgan Stanley|Grayscale)\b/i,
    /\b(MicroStrategy|Tesla|Square|PayPal|Visa|Mastercard)\b/i,
    /\b(Ripple|Circle|Tether|Bitmine|CleanSpark|Marathon|Riot)\b/i,
    /\b(SEC|CFTC|DOJ|Fed|Treasury)\b/i,
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s(?:CEO|CTO|CFO|founder|President)/,
  ];

  for (const pattern of entityPatterns) {
    const match = title.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract action verb from title
function extractAction(title: string): string {
  const text = title.toLowerCase();

  // Negative/downward actions first (more specific)
  if (/sink|drop|fall|crash|plunge|tumble|slide|dip|slump|decline/i.test(text)) return "下落";
  if (/freez|frozen/i.test(text)) return "凍結";
  if (/block|ban|halt|restrict/i.test(text)) return "制限";
  if (/reject|deny/i.test(text)) return "却下";
  if (/sell|dump|liquidat/i.test(text)) return "売却";

  // Positive/upward actions
  if (/surge|soar|jump|spike|rally|climb|rise|gain/i.test(text)) return "急騰";
  if (/hit|reach|break|top/i.test(text)) return "到達";
  if (/buy|purchas|acquir|accumul/i.test(text)) return "購入";

  // Neutral actions
  if (/launch|start|begin|open|roll.?out/i.test(text)) return "開始";
  if (/stake|staking|deposit/i.test(text)) return "ステーキング";
  if (/warn|alert|caut/i.test(text)) return "警告";
  if (/approv|green.?light|pass/i.test(text)) return "承認";
  if (/reveal|announc|report|disclose/i.test(text)) return "発表";
  if (/sue|lawsuit|legal|charge/i.test(text)) return "提訴";
  if (/partner|collaborat|team.?up/i.test(text)) return "提携";
  if (/invest|fund|back/i.test(text)) return "投資";
  if (/upgrade|fork|update/i.test(text)) return "アップグレード";
  if (/predict|forecast|expect/i.test(text)) return "予想";
  if (/schedule|plan/i.test(text)) return "予定";
  if (/name|pick|select|choose/i.test(text)) return "選出";

  return "";
}

// Generate specific Japanese title from news
function generateJapaneseTitle(title: string, content: string): string {
  const text = title.toLowerCase();

  // Extract key info
  const numbers = (title + " " + content).match(/\$[\d,.]+[BMK]?|[\d.]+%/g) || [];
  const mainNumber = numbers[0] || "";
  const entity = extractEntity(title);
  const action = extractAction(title);

  // Translate entity name if known
  const entityJa = entity ? (TERM_TRANSLATIONS[entity.toLowerCase()] || entity) : null;

  // Specific pattern matching with actual content

  // Bitcoin eyes $90K pattern
  const eyesMatch = title.match(/(bitcoin|btc|ethereum|eth|xrp|solana)\s+eyes?\s+\$?([\d,.]+[KMB]?)/i);
  if (eyesMatch) {
    const coin = /bitcoin|btc/i.test(eyesMatch[1]) ? "ビットコイン" :
                 /ethereum|eth/i.test(eyesMatch[1]) ? "イーサリアム" :
                 /xrp/i.test(eyesMatch[1]) ? "XRP" : "ソラナ";
    return `${coin}、$${eyesMatch[2]}を目指す`;
  }

  // Price target patterns: "$90K Bitcoin", "Bitcoin to $100K"
  const priceTargetMatch = title.match(/\$?([\d,.]+[KMB]?)\s*(bitcoin|btc|ethereum|eth|xrp|solana)/i) ||
                          title.match(/(bitcoin|btc|ethereum|eth|xrp|solana)\s*(?:to|at|hit|reach)?\s*\$?([\d,.]+[KMB]?)/i);
  if (priceTargetMatch) {
    const coin = /bitcoin|btc/i.test(title) ? "ビットコイン" :
                 /ethereum|eth/i.test(title) ? "イーサリアム" :
                 /xrp/i.test(title) ? "XRP" :
                 /solana/i.test(title) ? "ソラナ" : "仮想通貨";
    const price = priceTargetMatch[1]?.includes("$") ? priceTargetMatch[1] :
                  priceTargetMatch[2]?.includes("$") ? priceTargetMatch[2] :
                  mainNumber || "";

    if (/no |not |won't|fail|unlikely/i.test(text)) {
      return `${coin}、${price}到達せず`;
    }
    if (/low|bottom|support/i.test(text)) {
      return `${coin}、${price}のサポートライン`;
    }
    return `${coin}${action ? action : ""}${price ? `、${price}` : ""}`;
  }

  // Company + action + amount patterns
  if (entityJa && mainNumber) {
    if (/stake|staking|deposit/i.test(text)) {
      return `${entityJa}、${mainNumber}をステーキング`;
    }
    if (/buy|purchas|acquir/i.test(text)) {
      return `${entityJa}、${mainNumber}を購入`;
    }
    if (/sell|dump/i.test(text)) {
      return `${entityJa}、${mainNumber}を売却`;
    }
    if (/invest|fund/i.test(text)) {
      return `${entityJa}、${mainNumber}を投資`;
    }
    if (/inflow/i.test(text)) {
      return `${entityJa}に${mainNumber}流入`;
    }
    if (/outflow/i.test(text)) {
      return `${entityJa}から${mainNumber}流出`;
    }
    return `${entityJa}、${mainNumber}規模の動き`;
  }

  // Company + action patterns (no amount)
  if (entityJa && action) {
    if (/freeze|frozen|block/i.test(text) && /account|wallet/i.test(text)) {
      return `${entityJa}、口座を${action}`;
    }
    if (/ceo|chief|head|president/i.test(text)) {
      const ceoMatch = title.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*(?:,\s*)?(CEO|CTO|CFO|chief|head|president)/i);
      const personName = ceoMatch ? ceoMatch[1] : "";
      if (/warn|red.?line|concern/i.test(text)) {
        return `${entityJa}CEO${personName ? `（${personName}）` : ""}が${action}`;
      }
      return `${entityJa}CEO${personName ? `（${personName}）` : ""}が発言`;
    }
    if (/launch|start|begin|announce/i.test(text)) {
      return `${entityJa}、新サービスを${action}`;
    }
    if (/partner|collaborat/i.test(text)) {
      return `${entityJa}、新たな${action}を発表`;
    }
    return `${entityJa}${action ? `、${action}` : "に動き"}`;
  }

  // Token burn / governance patterns
  if (/token burn|burn.*token/i.test(text)) {
    if (/uniswap/i.test(text)) {
      return `ユニスワップ、トークンバーン${action || "提案"}`;
    }
    return `トークンバーン${action || "提案"}`;
  }

  if (/governance.*(vote|proposal|pass|reject)/i.test(text) || /(vote|proposal).*(pass|reject|fail)/i.test(text)) {
    // Check rejection/failure FIRST (more specific)
    const isRejected = /reject|rejection|fail|failed|ends? in/i.test(text);
    const isPassed = /pass|passed|approve|approved|backed/i.test(text) && !isRejected;

    if (/uniswap/i.test(text)) {
      if (isPassed) return "ユニスワップ、ガバナンス提案可決";
      if (isRejected) return "ユニスワップ、ガバナンス提案否決";
      return "ユニスワップ、ガバナンス投票";
    }
    if (/aave/i.test(text)) {
      if (isPassed) return "Aave、ガバナンス提案可決";
      if (isRejected) return "Aave、ガバナンス提案否決";
      return "Aave、ガバナンス投票";
    }
    if (isPassed) return "DeFiガバナンス提案可決";
    if (isRejected) return "DeFiガバナンス提案否決";
  }

  // ETF specific patterns
  if (/etf/i.test(text)) {
    if (/inflow|outflow/i.test(text)) {
      const flow = /inflow/i.test(text) ? "流入" : "流出";
      return `仮想通貨ETFに${mainNumber ? mainNumber + "の" : ""}${flow}`;
    }
    if (/bitcoin|btc/i.test(text)) {
      return `ビットコインETF${action ? action : "に動き"}${mainNumber ? `（${mainNumber}）` : ""}`;
    }
    if (/ethereum|eth/i.test(text)) {
      return `イーサリアムETF${action ? action : "に動き"}`;
    }
    return `仮想通貨ETF${action ? action : "最新動向"}${mainNumber ? `（${mainNumber}）` : ""}`;
  }

  // Regulation patterns with specifics
  if (/sec|cftc|regulation|regulatory|government|law/i.test(text)) {
    if (entityJa) {
      return `${entityJa}に規制当局が動き`;
    }
    if (/stablecoin/i.test(text)) {
      return `ステーブルコイン規制${action ? action : "に進展"}`;
    }
    if (/bitcoin|btc/i.test(text)) {
      return `ビットコインに規制当局が${action || "注目"}`;
    }
    if (/xrp|ripple/i.test(text)) {
      return `XRP/Ripple訴訟${action ? action : "に進展"}`;
    }
    return `仮想通貨規制${action ? action : "に動き"}`;
  }

  // Mining patterns
  if (/min(ing|er)/i.test(text)) {
    if (/bitcoin|btc/i.test(text)) {
      return `ビットコインマイニング${action ? action : ""}${mainNumber ? `（${mainNumber}）` : "に注目"}`;
    }
    if (entityJa) {
      return `${entityJa}のマイニング事業${action || ""}`;
    }
    return `仮想通貨マイニング${action || "に動き"}`;
  }

  // Open interest / futures patterns
  if (/open interest|futures|options/i.test(text)) {
    const period = title.match(/(\d+)[\s-]?(month|week|day|year)/i);
    if (period) {
      return `${/bitcoin|btc/i.test(text) ? "BTC" : "仮想通貨"}先物、${period[1]}${period[2] === "month" ? "ヶ月" : period[2] === "week" ? "週間" : period[2] === "year" ? "年" : "日"}ぶりの水準`;
    }
    if (/low/i.test(text)) {
      return `${/bitcoin|btc/i.test(text) ? "BTC" : "仮想通貨"}先物建玉が低水準`;
    }
    if (/high/i.test(text)) {
      return `${/bitcoin|btc/i.test(text) ? "BTC" : "仮想通貨"}先物建玉が高水準`;
    }
  }

  // Security incidents
  if (/hack|exploit|vulnerability|attack|breach/i.test(text)) {
    if (entityJa) {
      return `${entityJa}にセキュリティインシデント${mainNumber ? `（${mainNumber}）` : ""}`;
    }
    return `セキュリティインシデント発生${mainNumber ? `（被害額${mainNumber}）` : ""}`;
  }

  // "Year in X" patterns (annual review)
  if (/year in (xrp|bitcoin|ethereum|solana|crypto)/i.test(text) || /the year.+20(25|26)/i.test(text)) {
    const year = /2026/.test(text) ? "2026年" : /2025/.test(text) ? "2025年" : "";
    const coin = /xrp/i.test(text) ? "XRP" :
                 /bitcoin|btc/i.test(text) ? "ビットコイン" :
                 /ethereum|eth/i.test(text) ? "イーサリアム" :
                 /solana/i.test(text) ? "ソラナ" : "仮想通貨";
    return `${coin}${year}の総まとめ`;
  }

  // Year/outlook patterns
  if (/2025|2026|next year|outlook|forecast|prediction/i.test(text)) {
    const year = /2026/.test(text) ? "2026年" : /2025/.test(text) ? "2025年" : "";

    if (/bitcoin|btc/i.test(text)) {
      return `ビットコイン${year}${mainNumber ? mainNumber : "価格"}予想`;
    }
    if (/xrp|ripple/i.test(text)) {
      return `XRP${year}の動向${action ? `：${action}` : ""}`;
    }
    if (/regulation|crypto regulation/i.test(text)) {
      return `仮想通貨規制${year}の展望`;
    }
    if (/fintech|pick|top/i.test(text) && entityJa) {
      return `${entityJa}、${year}注目銘柄に選出`;
    }
    if (entityJa) {
      return `${entityJa}${year}の見通し`;
    }
  }

  // Hard fork / upgrade patterns
  if (/hard.?fork|upgrade|update/i.test(text)) {
    const projectMatch = title.match(/\b(BNB|Ethereum|Bitcoin|Solana|Cardano|Polygon)\b/i);
    const forkNameMatch = title.match(/\b([A-Z][a-z]+)\s+(?:hard.?fork|upgrade)/i);
    const project = projectMatch ? projectMatch[1] : null;
    const forkName = forkNameMatch ? forkNameMatch[1] : null;

    if (project) {
      const projectJa = TERM_TRANSLATIONS[project.toLowerCase()] || project;
      if (forkName) {
        return `${projectJa}「${forkName}」${action || "アップグレード"}${/schedule|plan/i.test(text) ? "予定" : ""}`;
      }
      return `${projectJa}${action || "アップグレード"}${/schedule|plan/i.test(text) ? "予定" : ""}`;
    }
  }

  // Price predictions pattern (e.g. "Price predictions 12/26: BTC, ETH...")
  if (/price prediction/i.test(text)) {
    const coins = title.match(/\b(BTC|ETH|XRP|SOL|DOGE|ADA|BNB)\b/gi);
    if (coins && coins.length > 0) {
      const topCoins = coins.slice(0, 3).join("・");
      return `${topCoins}など価格予想`;
    }
  }

  // Fallback: translate key terms and keep structure
  const translated = translateText(title);

  // If translated title is short enough and mostly Japanese, use it
  if (translated.length <= 50 && !/[a-zA-Z]{6,}/.test(translated)) {
    return translated;
  }

  // Extract first meaningful segment from title (before colon or comma)
  const firstSegment = title.split(/[:\-–—,]/)[0].trim();
  const translatedSegment = translateText(firstSegment);

  // If the first segment is reasonably translated, use it
  if (translatedSegment.length <= 35 && !/[a-zA-Z]{5,}/.test(translatedSegment)) {
    return translatedSegment + (action ? `：${action}` : "");
  }

  // Final fallbacks with some specificity
  if (/bitcoin|btc/i.test(text)) {
    return `ビットコイン${action || ""}${mainNumber ? `（${mainNumber}）` : "に注目"}`;
  }
  if (/ethereum|eth/i.test(text)) {
    return `イーサリアム${action || ""}${mainNumber ? `（${mainNumber}）` : "に注目"}`;
  }
  if (/xrp|ripple/i.test(text)) {
    return `XRP${action || ""}${mainNumber ? `（${mainNumber}）` : "に動き"}`;
  }
  if (/solana/i.test(text)) {
    return `ソラナ${action || ""}${mainNumber ? `（${mainNumber}）` : "に注目"}`;
  }
  if (/bnb|binance chain/i.test(text)) {
    return `BNBチェーン${action || ""}${mainNumber ? `（${mainNumber}）` : "に動き"}`;
  }
  if (/blockchain/i.test(text)) {
    return `ブロックチェーン${action || ""}${mainNumber ? `（${mainNumber}）` : "に注目"}`;
  }
  if (/ai|artificial intelligence/i.test(text)) {
    return `AI×ブロックチェーン${action || "に新展開"}`;
  }
  if (entityJa) {
    return `${entityJa}${action ? `が${action}` : "に注目"}`;
  }
  if (mainNumber) {
    return `仮想通貨市場${action || "に動き"}（${mainNumber}）`;
  }
  if (action) {
    return `仮想通貨${action}`;
  }

  // Use translated first segment as last resort - but only if it's mostly Japanese
  if (translatedSegment.length > 5) {
    // Count English vs non-English characters
    const englishChars = (translatedSegment.match(/[a-zA-Z]/g) || []).length;
    const totalChars = translatedSegment.length;
    const englishRatio = englishChars / totalChars;

    // Only use if less than 30% English
    if (englishRatio < 0.3) {
      const cleaned = translatedSegment.replace(/[a-zA-Z]{6,}/g, "").trim();
      if (cleaned.length > 5) {
        return cleaned;
      }
    }
  }

  // Ultimate fallback - construct from detected elements
  const elements = [];
  if (/privacy|プライバシー/i.test(text)) elements.push("プライバシー");
  if (/nft/i.test(text)) elements.push("NFT");
  if (/tvl/i.test(text)) elements.push("TVL");
  if (/token|トークン/i.test(text)) elements.push("トークン");
  if (/dex/i.test(text)) elements.push("DEX");
  if (/market|マーケット/i.test(text)) elements.push("市場");
  if (/year|年/i.test(text)) elements.push("年間");

  if (elements.length > 0) {
    return `${elements.join("・")}${action || "動向"}`;
  }

  return "仮想通貨最新ニュース";
}

// Extract specific details from the news
function extractNewsDetails(title: string, content: string): {
  entity: string | null;
  entityJa: string | null;
  action: string;
  numbers: string[];
  mainCoin: string;
  specificDetails: string[];
} {
  const text = title + " " + content;
  const entity = extractEntity(title);
  const entityJa = entity ? (TERM_TRANSLATIONS[entity.toLowerCase()] || entity) : null;
  const action = extractAction(title);
  const { numbers } = extractKeyInfo(title, content);

  // Detect main coin
  const isBitcoin = /bitcoin|btc/i.test(text);
  const isEthereum = /ethereum|eth/i.test(text);
  const isXRP = /xrp|ripple/i.test(text);
  const isSolana = /solana|sol\b/i.test(text);
  const mainCoin = isBitcoin ? "ビットコイン" :
                   isEthereum ? "イーサリアム" :
                   isXRP ? "XRP" :
                   isSolana ? "ソラナ" : "仮想通貨";

  // Extract specific details
  const specificDetails: string[] = [];

  // Extract quoted text or important phrases
  const quotes = text.match(/"([^"]+)"/g);
  if (quotes) {
    specificDetails.push(...quotes.slice(0, 2).map(q => q.replace(/"/g, "")));
  }

  // Extract dates mentioned
  const dateMatch = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i);
  if (dateMatch) {
    specificDetails.push(dateMatch[0]);
  }

  // Extract specific protocol/project names beyond main coins
  const projectMatches = text.match(/\b(Aave|Uniswap|Compound|MakerDAO|Lido|Curve|dYdX|GMX|Arbitrum|Optimism|Base|zkSync|StarkNet|Polygon|Avalanche)\b/gi);
  if (projectMatches) {
    specificDetails.push(...[...new Set(projectMatches)].slice(0, 3));
  }

  return { entity, entityJa, action, numbers, mainCoin, specificDetails };
}

// Generate fully Japanese summary from English content
function generateJapaneseSummary(title: string, content: string, length: "short" | "medium" | "long"): string {
  const text = (title + " " + content).toLowerCase();
  const details = extractNewsDetails(title, content);

  // Detect topic type
  const isETF = /etf/i.test(text);
  const isRegulation = /sec|cftc|regulation|regulatory/i.test(text);
  const isMining = /mining|miner/i.test(text);
  const isHack = /hack|exploit|attack|security/i.test(text);
  const isGovernance = /governance|vote|proposal/i.test(text);
  const isStablecoin = /stablecoin|usdt|usdc|tether/i.test(text);
  const isDeFi = /defi|tvl|yield|protocol|aave|uniswap/i.test(text);
  const isPositive = /surge|soar|rise|gain|bullish|high|rally|break/i.test(text);
  const isNegative = /sink|drop|fall|crash|bearish|low|fear|hack|reject/i.test(text);

  const flags = { isETF, isRegulation, isMining, isHack, isGovernance, isDeFi, isStablecoin, isPositive, isNegative };

  // Build Japanese content based on length with actual news details
  switch (length) {
    case "short": return generateShortJapaneseWithDetails(details, flags, title);
    case "medium": return generateMediumJapaneseWithDetails(details, flags, title);
    case "long": return generateLongJapaneseWithDetails(details, flags, title, content);
  }
}

// Create unique opener based on news type
function getUniqueOpener(index: number): string {
  const openers = [
    "速報です。",
    "注目のニュースが入ってきました。",
    "大きな動きがありました。",
    "市場が反応しています。",
    "要注目の展開です。",
    "重要な発表がありました。",
    "新たな動きが報じられました。",
    "業界を揺るがすニュースです。",
  ];
  return openers[index % openers.length];
}

// Create unique closing based on news type
function getUniqueClosing(index: number): string {
  const closings = [
    "続報に注目👀",
    "今後の展開を見守りましょう",
    "要ウォッチです🔔",
    "引き続き追っていきます",
    "詳細が分かり次第お届けします",
    "市場の反応に注目",
    "今後の動向から目が離せません",
    "フォローで最新情報をキャッチ",
  ];
  return closings[index % closings.length];
}

// Generate SHORT content - news summary style
function generateShortJapaneseWithDetails(
  details: ReturnType<typeof extractNewsDetails>,
  flags: TopicFlags,
  originalTitle: string
): string {
  const { entityJa, action, numbers, mainCoin } = details;
  const num = numbers[0] || "";
  const num2 = numbers[1] || "";

  // Create a hash from title for consistent but varied content
  const titleHash = originalTitle.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const opener = getUniqueOpener(titleHash);
  const closing = getUniqueClosing(titleHash + 1);

  // For ETF news
  if (flags.isETF) {
    const flow = /inflow/i.test(originalTitle) ? "流入" : /outflow/i.test(originalTitle) ? "流出" : "動き";
    const coin = /bitcoin|btc/i.test(originalTitle) ? "BTC" : /ethereum|eth/i.test(originalTitle) ? "ETH" : "";
    return `${coin}ETFに${num ? num + "の" : ""}${flow}。

${opener}機関投資家の資金が${flow === "流入" ? "入ってきています" : flow === "流出" ? "抜けています" : "動いています"}。${num2 ? `累計${num2}規模。` : ""}

ETF市場の資金動向は価格に直結するため、${closing}`;
  }

  // For hack/security news
  if (flags.isHack) {
    const target = entityJa || "プロトコル";
    return `【緊急】${target}でセキュリティ問題発生${num ? `、${num}規模` : ""}

${target}で異常なトランザクションが検出されました。ユーザーは至急ウォレットを確認してください。

${num ? `被害額は${num}と報じられています。` : ""}詳細は調査中。`;
  }

  // For governance news
  if (flags.isGovernance) {
    const protocol = /uniswap/i.test(originalTitle) ? "Uniswap" :
                     /aave/i.test(originalTitle) ? "Aave" :
                     /compound/i.test(originalTitle) ? "Compound" :
                     /maker/i.test(originalTitle) ? "MakerDAO" : entityJa || "DeFi";
    const result = /reject|fail|denied|ends in/i.test(originalTitle) ? "否決" :
                   /pass|approve|backed/i.test(originalTitle) ? "可決" : "投票中";
    return `${protocol}のガバナンス提案が${result}。

コミュニティによる投票の結果、提案は${result}となりました。${num ? `${num}以上の投票権が行使されました。` : ""}

DeFiの分散型意思決定、${closing}`;
  }

  // For price movement news
  if (flags.isPositive) {
    const coin = entityJa || mainCoin;
    const priceAction = action || "上昇";
    return `${coin}が${priceAction}${num ? `、${num}突破` : ""}！

${opener}${num2 ? `24時間で${num2}の上昇。` : "強い買いが入っています。"}

${/bitcoin|btc/i.test(originalTitle) ? "BTCの動きにアルト連動の可能性。" : ""}${closing}`;
  }

  if (flags.isNegative) {
    const coin = entityJa || mainCoin;
    const priceAction = action || "下落";
    return `${coin}が${priceAction}${num ? `、${num}を割り込む` : ""}

${opener}${num2 ? `${num2}の下げ幅。` : "売り圧力が強まっています。"}

パニック売りは禁物。${closing}`;
  }

  // For mining news
  if (flags.isMining) {
    const company = entityJa || "マイニング企業";
    return `${company}がマイニング事業${action || "を展開"}${num ? `、${num}規模` : ""}

${opener}${num ? `${num}の投資/売上が報じられています。` : ""}

マイニング業界の動向は供給に影響。${closing}`;
  }

  // For regulation news
  if (flags.isRegulation) {
    const target = entityJa || "暗号資産";
    const regulator = /sec/i.test(originalTitle) ? "SEC" :
                      /cftc/i.test(originalTitle) ? "CFTC" : "規制当局";
    return `${regulator}が${target}に${action || "注目"}

${opener}${num ? `${num}規模の案件。` : ""}規制の行方は市場に大きく影響します。

${closing}`;
  }

  // For stablecoin news
  if (flags.isStablecoin) {
    const coin = /usdt|tether/i.test(originalTitle) ? "USDT" :
                 /usdc/i.test(originalTitle) ? "USDC" : "ステーブルコイン";
    return `${coin}に${action || "動き"}${num ? `、${num}規模` : ""}

${opener}ステーブルコインの動向は市場全体の流動性に影響します。

${closing}`;
  }

  // Default - use translated elements
  const subject = entityJa || mainCoin;
  return `${subject}${action ? `が${action}` : "に注目"}${num ? `（${num}）` : ""}

${opener}${num ? `${num}規模の動きです。` : ""}

${closing}`;
}

type TopicFlags = {
  isETF: boolean;
  isRegulation: boolean;
  isMining: boolean;
  isHack: boolean;
  isGovernance: boolean;
  isDeFi: boolean;
  isStablecoin: boolean;
  isPositive: boolean;
  isNegative: boolean;
};

// Generate MEDIUM content - detailed news style
function generateMediumJapaneseWithDetails(
  details: ReturnType<typeof extractNewsDetails>,
  flags: TopicFlags,
  originalTitle: string
): string {
  const { entityJa, action, numbers, mainCoin, specificDetails } = details;
  const num = numbers[0] || "";
  const num2 = numbers[1] || "";
  const subject = entityJa || mainCoin;

  const titleHash = originalTitle.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  // ETF news - detailed
  if (flags.isETF) {
    const flow = /inflow/i.test(originalTitle) ? "流入" : /outflow/i.test(originalTitle) ? "流出" : "資金移動";
    const coin = /bitcoin|btc/i.test(originalTitle) ? "ビットコイン" : /ethereum|eth/i.test(originalTitle) ? "イーサリアム" : "仮想通貨";
    const etfProvider = /blackrock/i.test(originalTitle) ? "ブラックロック" :
                        /fidelity/i.test(originalTitle) ? "フィデリティ" :
                        /grayscale/i.test(originalTitle) ? "グレースケール" : "";

    return `${coin}ETF${etfProvider ? `（${etfProvider}）` : ""}に${num ? num : "大規模な"}${flow}

${etfProvider ? `${etfProvider}の${coin}ETFで` : `${coin}ETF市場で`}${num ? `${num}規模の${flow}が確認されました。` : `注目すべき${flow}がありました。`}

機関投資家マネーの動向として、今回の${flow}は市場参加者の間で注目を集めています。${num2 ? `直近1週間では累計${num2}の${flow}となっており、トレンドの形成が見られます。` : ""}

ETFを通じた資金の動きは、機関投資家のセンチメントを反映しています。${flow === "流入" ? "買い意欲の強さを示すシグナルとして、" : flow === "流出" ? "利益確定や様子見姿勢を示すシグナルとして、" : "市場動向を示すシグナルとして、"}今後の価格動向に影響を与える可能性があります。

現物ETFの承認以降、${coin}市場の構造は大きく変化しています。従来の個人投資家中心の市場から、機関投資家も参加する成熟した市場へと進化を続けています。

資金フローの動向から目が離せません📊`;
  }

  // Hack news - detailed
  if (flags.isHack) {
    const target = entityJa || "プロトコル";
    const attackType = /bridge/i.test(originalTitle) ? "ブリッジ攻撃" :
                       /flash.?loan/i.test(originalTitle) ? "フラッシュローン攻撃" :
                       /reentrancy/i.test(originalTitle) ? "リエントランシー攻撃" :
                       /phishing/i.test(originalTitle) ? "フィッシング攻撃" : "ハッキング";

    return `【緊急速報】${target}で${attackType}発生${num ? ` - ${num}流出` : ""}

${target}のスマートコントラクトで${attackType}が発生し、${num ? `${num}相当の資産が流出しました。` : "ユーザー資産に被害が出ています。"}

攻撃の経緯として、攻撃者は${attackType === "ブリッジ攻撃" ? "クロスチェーンブリッジの脆弱性を突いて" : attackType === "フラッシュローン攻撃" ? "無担保融資を利用した価格操作により" : "コントラクトの脆弱性を利用して"}不正に資産を移動させたと見られています。

${target}チームは現在、被害の全容解明と資金追跡を進めています。${num2 ? `現時点で${num2}分の資産は凍結に成功したとの報告もあります。` : ""}

ユーザーへの対応として、${target}を利用している方は：
・承認済みのコントラクト接続を確認・解除
・関連トークンの移動を検討
・公式アナウンスを待って行動

DeFiを利用する際は、常にリスクを認識し、資産の分散管理を心がけてください🔐`;
  }

  // Governance news - detailed
  if (flags.isGovernance) {
    const protocol = /uniswap/i.test(originalTitle) ? "Uniswap" :
                     /aave/i.test(originalTitle) ? "Aave" :
                     /compound/i.test(originalTitle) ? "Compound" :
                     /maker/i.test(originalTitle) ? "MakerDAO" :
                     /curve/i.test(originalTitle) ? "Curve" : entityJa || "DeFiプロトコル";
    const result = /reject|fail|denied|ends in/i.test(originalTitle) ? "否決" :
                   /pass|approve|backed/i.test(originalTitle) ? "可決" : "審議中";
    const proposalType = /fee/i.test(originalTitle) ? "手数料変更" :
                         /treasury/i.test(originalTitle) ? "トレジャリー運用" :
                         /upgrade/i.test(originalTitle) ? "プロトコルアップグレード" :
                         /token/i.test(originalTitle) ? "トークン関連" : "運営方針";

    return `${protocol}のガバナンス：${proposalType}提案が${result}

${protocol}コミュニティで行われた${proposalType}に関する提案が${result}となりました。${num ? `投票には${num}相当のガバナンストークンが参加しました。` : ""}

今回の提案は、${proposalType === "手数料変更" ? "プロトコルの手数料体系を見直すもので、" : proposalType === "トレジャリー運用" ? "プロトコルが保有する資産の運用方針に関するもので、" : proposalType === "プロトコルアップグレード" ? "技術的なアップグレードを実施するもので、" : ""}${protocol}の将来に大きな影響を与える内容でした。

${result === "可決" ? `この可決により、${protocol}は新たなフェーズに入ります。実装は今後数週間以内に行われる見込みです。` : result === "否決" ? `否決の背景には、コミュニティ内で${proposalType}の方向性について意見の相違があったと見られます。修正案の再提出が予想されます。` : "投票期間中、活発な議論が行われています。"}

DeFiの分散型ガバナンスは、プロトコルの進化を支える重要な仕組みです。${protocol}トークン保有者は、今後も積極的に投票に参加することが推奨されます💡`;
  }

  // Price positive - detailed
  if (flags.isPositive) {
    const coin = entityJa || mainCoin;
    const catalyst = /etf/i.test(originalTitle) ? "ETFへの資金流入" :
                     /halving/i.test(originalTitle) ? "半減期期待" :
                     /institutional/i.test(originalTitle) ? "機関投資家の買い" :
                     /adoption/i.test(originalTitle) ? "採用拡大" : "買い圧力の増加";

    return `${coin}が${action || "急伸"}${num ? `、${num}を突破` : ""}

${coin}が力強い上昇を見せています。${num ? `価格は${num}を突破し、` : ""}市場参加者の注目を集めています。

今回の上昇の背景には、${catalyst}があると見られています。${num2 ? `直近24時間では${num2}の上昇幅を記録しました。` : ""}

テクニカル面では、重要なレジスタンスを上抜けたことで、次の価格目標に向けた動きが期待されています。ただし、急騰後は利益確定売りによる調整も想定されるため、エントリーのタイミングには注意が必要です。

オンチェーンデータでは、${/bitcoin|btc/i.test(originalTitle) ? "取引所からのBTC流出が続いており、長期保有者の蓄積が進んでいることを示唆しています。" : "アクティブアドレス数の増加が見られ、ネットワーク活動が活発化しています。"}

強気相場でも冷静な判断を。分散投資とリスク管理を忘れずに📈`;
  }

  // Price negative - detailed
  if (flags.isNegative) {
    const coin = entityJa || mainCoin;
    const cause = /liquidation/i.test(originalTitle) ? "大規模な清算" :
                  /sell.?off/i.test(originalTitle) ? "売り浴びせ" :
                  /whale/i.test(originalTitle) ? "クジラの売却" :
                  /macro/i.test(originalTitle) ? "マクロ経済不安" : "売り圧力";

    return `${coin}が${action || "急落"}${num ? `、${num}を下回る` : ""}

${coin}が下落圧力に晒されています。${num ? `価格は${num}を割り込み、` : ""}市場に警戒感が広がっています。

下落の要因として、${cause}が指摘されています。${num2 ? `この24時間で${num2}の下げ幅となり、` : ""}短期的なサポートラインを試す展開となっています。

このような局面では、パニック売りは最悪の選択です。市場は周期的に調整を繰り返すものであり、長期的な視点を持つことが重要です。

追加投資を検討している場合は、さらなる下落の可能性も考慮し、分割での購入を検討してください。また、ポートフォリオ全体のリスクを再評価する良い機会でもあります。

下落相場は、優良資産を割安で取得するチャンスでもあります。感情に流されず、自身の投資計画に従って行動しましょう📉`;
  }

  // Mining news - detailed
  if (flags.isMining) {
    const company = entityJa || "マイニング企業";
    const miningAction = /buy|purchase|acquire/i.test(originalTitle) ? "ASIC購入" :
                         /sell/i.test(originalTitle) ? "BTC売却" :
                         /expand/i.test(originalTitle) ? "事業拡大" :
                         /hash.?rate/i.test(originalTitle) ? "ハッシュレート" : "事業展開";

    return `${company}が${miningAction}${num ? `、${num}規模` : ""}

${company}がマイニング事業において${miningAction}を発表しました。${num ? `その規模は${num}に達します。` : ""}

マイニング企業の動向は、ビットコインの供給動態に直接影響を与えます。${miningAction === "BTC売却" ? "マイナーによる売却は市場への供給圧力となりますが、" : miningAction === "ASIC購入" ? "設備投資の増加はハッシュレートの上昇につながり、" : ""}${company}の今回の決定は業界全体の指標となります。

${num2 ? `現在のビットコイン価格${num2}を考慮すると、` : "現在の市場環境を考慮すると、"}マイニング事業の採算性は重要な局面にあります。電力コストや機器の効率性が、各社の戦略を左右しています。

次の半減期を見据えた動きとして、今後もマイニング業界からは目が離せません⛏️`;
  }

  // Regulation news - detailed
  if (flags.isRegulation) {
    const target = entityJa || "暗号資産";
    const regulator = /sec/i.test(originalTitle) ? "米証券取引委員会（SEC）" :
                      /cftc/i.test(originalTitle) ? "米商品先物取引委員会（CFTC）" :
                      /doj/i.test(originalTitle) ? "米司法省（DOJ）" :
                      /eu|mica/i.test(originalTitle) ? "EU当局" : "規制当局";
    const regAction = /approve/i.test(originalTitle) ? "承認" :
                      /sue|charge/i.test(originalTitle) ? "提訴" :
                      /investigate/i.test(originalTitle) ? "調査" :
                      /ban/i.test(originalTitle) ? "禁止" : "規制措置";

    return `${regulator}が${target}に対して${regAction}${num ? `、${num}規模` : ""}

${regulator}が${target}に関する${regAction}を行いました。${num ? `この件は${num}規模の市場に影響を与える可能性があります。` : ""}

規制当局の動きは、暗号資産市場に大きな影響を与えます。${regAction === "承認" ? "今回の承認は、市場参加者にとってポジティブなシグナルとなります。" : regAction === "提訴" || regAction === "調査" ? "調査・訴訟の結果次第では、業界全体のルールが見直される可能性があります。" : "規制の方向性は、今後の市場発展に大きく影響します。"}

短期的には不確実性から価格変動が予想されますが、長期的には明確なルールの整備が市場の成熟につながるとの見方もあります。

各国の規制動向は複雑に絡み合っています。投資判断においては、最新の規制情報を継続的にチェックすることが重要です🔄`;
  }

  // Default - more detailed
  const defaultSubject = entityJa || mainCoin;
  return `${defaultSubject}${action ? `が${action}` : "に動き"}${num ? `、${num}規模` : ""}

${defaultSubject}に関する重要なニュースが入ってきました。${num ? `${num}規模の動きとして、` : ""}市場参加者の間で注目を集めています。

${entityJa ? `${entityJa}は暗号資産業界において重要なプレイヤーであり、今回の動きは市場全体に影響を与える可能性があります。` : `${mainCoin}市場は常に変化しており、今回のニュースもその一環です。`}

${num2 ? `関連する数字として${num2}も報じられており、` : ""}詳細な分析が待たれます。

暗号資産市場は情報の速度が命です。最新ニュースをキャッチアップし、冷静な投資判断につなげていきましょう🔔`;
}

// Generate LONG content - comprehensive analysis
function generateLongJapaneseWithDetails(
  details: ReturnType<typeof extractNewsDetails>,
  flags: TopicFlags,
  originalTitle: string,
  originalContent: string
): string {
  const { entityJa, action, numbers, mainCoin, specificDetails } = details;
  const num = numbers[0] || "";
  const num2 = numbers[1] || "";

  // ETF - comprehensive
  if (flags.isETF) {
    const flow = /inflow/i.test(originalTitle) ? "流入" : /outflow/i.test(originalTitle) ? "流出" : "資金移動";
    const coin = /bitcoin|btc/i.test(originalTitle) ? "ビットコイン" : /ethereum|eth/i.test(originalTitle) ? "イーサリアム" : "仮想通貨";
    const etfProvider = /blackrock/i.test(originalTitle) ? "ブラックロック" :
                        /fidelity/i.test(originalTitle) ? "フィデリティ" :
                        /grayscale/i.test(originalTitle) ? "グレースケール" :
                        /ark/i.test(originalTitle) ? "ARK" : "";

    return `${coin}ETF${etfProvider ? `（${etfProvider}）` : ""}：${num ? num + "の" : ""}${flow}を記録

【速報】
${etfProvider ? `${etfProvider}が運用する${coin}ETFで` : `${coin}ETF市場で`}${num ? `${num}規模の${flow}が確認されました。` : `大きな${flow}がありました。`}${num2 ? `週間累計では${num2}に達しています。` : ""}

【背景】
2024年1月のビットコイン現物ETF承認以降、機関投資家マネーの流れが暗号資産市場を大きく動かすようになりました。${etfProvider || "主要運用会社"}のETFは、年金基金、投資信託、ファミリーオフィスなど、これまで暗号資産に直接投資できなかった投資家層への門戸を開きました。

${flow === "流入" ? `【流入の意味】
資金流入は機関投資家の${coin}に対する強気姿勢を反映しています。彼らは長期的な視点で投資を行うことが多く、継続的な流入は価格の下支えになります。

特に${etfProvider ? `${etfProvider}のような大手運用会社` : "大手運用会社"}への資金流入は、${coin}が「オルタナティブ資産」として認知されつつあることの証左です。` : flow === "流出" ? `【流出の意味】
資金流出は必ずしもネガティブではありません。利益確定、ポートフォリオリバランス、あるいは他の投資機会への資金シフトなど、様々な理由が考えられます。

重要なのは流出のトレンドと規模です。一時的な流出は市場の健全な調整プロセスの一部であり、過度に心配する必要はありません。` : `【市場への示唆】
ETFの資金フローは、機関投資家のセンチメントを測る最も信頼性の高い指標の一つです。今回の動きは今後の市場動向を占う上で重要なデータポイントとなります。`}

【今後の展望】
ETF市場の成熟とともに、${coin}と伝統的金融市場との相関も変化しています。機関投資家の参入により、市場の流動性は向上していますが、同時にマクロ経済要因の影響も受けやすくなっています。

ETFの資金フローは毎日公開されます。継続的にウォッチして、市場のトレンドを把握していきましょう📊`;
  }

  // Hack - comprehensive
  if (flags.isHack) {
    const target = entityJa || "プロトコル";
    const attackType = /bridge/i.test(originalTitle) ? "クロスチェーンブリッジ攻撃" :
                       /flash.?loan/i.test(originalTitle) ? "フラッシュローン攻撃" :
                       /oracle/i.test(originalTitle) ? "オラクル操作" :
                       /reentrancy/i.test(originalTitle) ? "リエントランシー攻撃" :
                       /private.?key/i.test(originalTitle) ? "秘密鍵流出" :
                       /phishing/i.test(originalTitle) ? "フィッシング攻撃" : "セキュリティ侵害";

    return `【緊急】${target}で${attackType}発生${num ? ` - 被害額${num}` : ""}

【事件概要】
${target}で${attackType}が発生し、${num ? `${num}相当の資産が流出しました。` : "ユーザー資産に被害が出ています。"}${num2 ? `影響を受けたアドレスは${num2}以上と報告されています。` : ""}

これは2024年に入って${/million|billion/i.test(num) ? "最大級の" : "注目すべき"}セキュリティインシデントの一つです。

【攻撃の手口】
${attackType === "クロスチェーンブリッジ攻撃" ? `クロスチェーンブリッジは異なるブロックチェーン間で資産を移動させる重要なインフラですが、その複雑性ゆえに攻撃対象となりやすい。今回も、ブリッジのコントラクトに存在した脆弱性が悪用されました。` : attackType === "フラッシュローン攻撃" ? `フラッシュローンは1トランザクション内で借入・返済を完結させる無担保ローンです。攻撃者はこれを利用して一時的に大量の資金を調達し、価格操作を行ってプロトコルから資産を抜き取りました。` : attackType === "オラクル操作" ? `DeFiプロトコルは価格データをオラクルから取得しています。攻撃者はオラクルの価格を操作することで、プロトコルに誤った価格情報を与え、不正な利益を得ました。` : `攻撃者は${target}のスマートコントラクトに存在した脆弱性を発見し、これを悪用して資産を流出させました。`}

【${target}の対応状況】
・関連するコントラクトの一時停止
・セキュリティ企業との連携による資金追跡
・${num ? "バグバウンティを通じた攻撃者への返還交渉" : "被害状況の調査継続"}

【ユーザーがすべきこと】
1. ${target}への承認（Approval）を直ちに取り消す
   → Revoke.cashなどのツールを使用
2. 関連トークンを安全なウォレットに移動
3. 公式チャンネル以外の情報に注意（詐欺DM多発）
4. 補償プログラムの発表を待つ

【教訓】
DeFiは革新的ですが、スマートコントラクトリスクは常に存在します。
・1つのプロトコルに資産を集中させない
・新しいプロトコルは少額から始める
・監査済みであっても過信しない
・ハードウェアウォレットの使用を推奨

続報をお伝えします。${target}ユーザーの方は公式発表をお待ちください🔐`;
  }

  // Governance - comprehensive
  if (flags.isGovernance) {
    const protocol = /uniswap/i.test(originalTitle) ? "Uniswap" :
                     /aave/i.test(originalTitle) ? "Aave" :
                     /compound/i.test(originalTitle) ? "Compound" :
                     /maker/i.test(originalTitle) ? "MakerDAO" :
                     /curve/i.test(originalTitle) ? "Curve" :
                     /lido/i.test(originalTitle) ? "Lido" : entityJa || "DeFiプロトコル";
    const result = /reject|fail|denied|ends in/i.test(originalTitle) ? "否決" :
                   /pass|approve|backed/i.test(originalTitle) ? "可決" : "投票中";
    const proposalType = /fee/i.test(originalTitle) ? "手数料" :
                         /treasury/i.test(originalTitle) ? "トレジャリー" :
                         /upgrade/i.test(originalTitle) ? "アップグレード" :
                         /incentive/i.test(originalTitle) ? "インセンティブ" :
                         /burn/i.test(originalTitle) ? "トークンバーン" : "ガバナンス";

    return `${protocol}ガバナンス：${proposalType}提案が${result}

【投票結果】
${protocol}のガバナンス投票で、${proposalType}に関する提案が${result}となりました。${num ? `${num}相当のガバナンストークンが投票に参加しました。` : "コミュニティから活発な議論がありました。"}

【提案の内容】
${proposalType === "手数料" ? `${protocol}のプロトコル手数料体系を見直す提案でした。DeFiプロトコルにとって手数料は重要な収益源であり、同時にユーザーの利用コストにも直結します。今回の提案は${result === "可決" ? "承認され、新しい手数料体系が導入されます" : result === "否決" ? "否決されましたが、修正案の再提出が予想されます" : "審議中です"}。` : proposalType === "トークンバーン" ? `${protocol}のネイティブトークンをバーン（焼却）する提案でした。バーンはトークンの供給量を減らし、希少性を高める効果があります。` : proposalType === "アップグレード" ? `${protocol}のプロトコルをアップグレードする提案でした。新機能の追加、セキュリティの強化、効率性の改善などが含まれています。` : `${protocol}の運営方針に関する重要な提案でした。`}

【賛成派・反対派の意見】
${result === "可決" ? `賛成派：「${protocol}の持続的な成長のために必要な変更」
反対派：「実装リスクや副作用を懸念」

最終的にはコミュニティの多数が賛成し、可決となりました。` : result === "否決" ? `賛成派：「プロトコルの改善に必要」
反対派：「時期尚早」「代替案を検討すべき」

反対意見が多数を占め、提案は否決されました。` : `賛否両論あり、活発な議論が続いています。`}

【${protocol}の今後】
${result === "可決" ? `この可決により、${protocol}は新たなフェーズに入ります。実装は今後数週間以内に行われる見込みで、ユーザーへの影響についても公式から詳細が発表される予定です。` : `今回の結果を受けて、${protocol}コミュニティでは次のステップについて議論が続くでしょう。`}

【なぜガバナンスが重要か】
DeFiの分散型ガバナンスは、プロトコルを「誰のものでもない」公共財として維持する仕組みです。トークン保有者が投票権を持ち、プロトコルの方向性を決定します。

${protocol}のガバナンストークンを保有している方は、今後も積極的に投票に参加することで、プロトコルの発展に貢献できます💡`;
  }

  // Price positive - comprehensive
  if (flags.isPositive) {
    const coin = entityJa || mainCoin;
    const catalyst = /etf/i.test(originalTitle) ? "ETF資金流入" :
                     /halving/i.test(originalTitle) ? "半減期" :
                     /institutional/i.test(originalTitle) ? "機関投資家" :
                     /adoption/i.test(originalTitle) ? "採用拡大" :
                     /whale/i.test(originalTitle) ? "クジラの買い" : "市場センチメント改善";

    return `${coin}が${action || "急騰"}${num ? `、${num}に到達` : ""}

【現在の状況】
${coin}が力強い上昇を見せ、${num ? `${num}を突破しました。` : "市場参加者の注目を集めています。"}${num2 ? `24時間の上昇率は${num2}に達しています。` : ""}

【上昇の背景】
今回の上昇の主な要因は${catalyst}と見られています。

${catalyst === "ETF資金流入" ? `ビットコインETFへの資金流入が継続しており、機関投資家マネーが市場を押し上げています。特に${/blackrock/i.test(originalTitle) ? "ブラックロック" : "大手運用会社"}のETFへの資金流入が顕著です。` : catalyst === "半減期" ? `ビットコインの半減期が近づき、供給量の減少を見越した買いが入っています。過去の半減期サイクルでは、半減期の前後に価格が大きく上昇する傾向がありました。` : catalyst === "機関投資家" ? `機関投資家による大規模な買いが確認されています。ポートフォリオの一部として暗号資産を組み込む動きが加速しています。` : catalyst === "クジラの買い" ? `大口投資家（クジラ）による買い増しが観測されています。オンチェーンデータでは、1000BTC以上を保有するアドレスの増加が確認されています。` : `市場全体のセンチメントが改善し、リスクオン姿勢が強まっています。`}

【テクニカル分析】
・主要な移動平均線を上抜け
・RSIは${num ? "70を超え過熱圏だが" : "上昇トレンドを示唆"}
・出来高も増加傾向
${num2 ? `・次のレジスタンスは${num2}付近` : ""}

【オンチェーン指標】
${/bitcoin|btc/i.test(originalTitle) ? `・取引所のBTC残高：減少傾向（買い圧力優勢）
・長期保有者の売却：限定的
・新規アドレス：増加中` : `・アクティブアドレス：増加中
・TVL（預け入れ総額）：上昇傾向
・トランザクション数：高水準`}

【投資戦略の考え方】
強気相場ではFOMO（取り残される恐怖）に駆られがちですが、冷静な判断が重要です。

・上昇が続いている時こそ、利益確定ラインを設定
・追加投資は分割で（一括投資は避ける）
・ポートフォリオ全体のバランスを確認
・レバレッジは控えめに

${coin}の長期的なファンダメンタルズを信じるなら、短期的な価格変動に一喜一憂せず、自身の投資計画に従って行動しましょう📈`;
  }

  // Price negative - comprehensive
  if (flags.isNegative) {
    const coin = entityJa || mainCoin;
    const cause = /liquidation/i.test(originalTitle) ? "大量清算" :
                  /sell/i.test(originalTitle) ? "売り圧力" :
                  /whale/i.test(originalTitle) ? "クジラの売却" :
                  /macro|fed|rate/i.test(originalTitle) ? "マクロ経済要因" :
                  /hack|security/i.test(originalTitle) ? "セキュリティ懸念" : "市場調整";

    return `${coin}が${action || "下落"}${num ? `、${num}を割り込む` : ""}

【現在の状況】
${coin}が下落圧力に晒されています。${num ? `価格は${num}を下回り、` : ""}市場に警戒感が広がっています。${num2 ? `24時間の下落率は${num2}に達しています。` : ""}

【下落の要因】
今回の下落は${cause}が主因と見られています。

${cause === "大量清算" ? `レバレッジポジションの大量清算（ロスカット）が連鎖的に発生しました。先物市場では${num2 ? num2 : "数億ドル"}規模のロングポジションが清算され、売り圧力が一気に高まりました。これは過度なレバレッジのリスクを改めて示す事例です。` : cause === "クジラの売却" ? `大口投資家（クジラ）による大規模な売却が観測されています。オンチェーンデータでは、取引所への大量の入金が確認されました。利益確定や資金需要など、売却の理由は様々考えられます。` : cause === "マクロ経済要因" ? `マクロ経済の不確実性が暗号資産市場にも波及しています。金利動向、インフレ指標、地政学リスクなどが投資家心理を冷やしています。暗号資産は「リスク資産」として、マクロ環境に敏感に反応する傾向があります。` : `市場は周期的に調整を繰り返します。今回の下落も、上昇トレンドの中での健全な調整である可能性があります。`}

【テクニカル分析】
・主要なサポートラインを試す展開
・RSIは売られすぎ圏に接近
・出来高の増加は売りの勢いを示唆
${num ? `・次のサポートは${num}付近` : ""}

【歴史的な視点】
${/bitcoin|btc/i.test(originalTitle) ? `ビットコインはこれまで何度も大きな調整を経験してきました。2017年、2021年の暴落時にも「終わり」と言われましたが、長期的には回復し新高値を更新しています。` : `${coin}市場は変動が大きいですが、テクノロジーとしての価値は変わっていません。`}

【今、すべきこと】
1. パニック売りはしない
   → 感情的な判断は往々にして最悪のタイミングになる

2. ポートフォリオを見直す
   → リスク許容度に合っているか確認

3. 追加投資は慎重に
   → さらなる下落の可能性も考慮し、分割で

4. 長期視点を忘れない
   → 短期の価格変動に一喜一憂しない

下落相場は、長期投資家にとっては買い増しの機会かもしれません。ただし、「落ちるナイフを掴む」リスクも認識した上で判断しましょう📉`;
  }

  // Default comprehensive
  const defaultSubject = entityJa || mainCoin;
  return `${defaultSubject}${action ? `が${action}` : "に注目"}${num ? ` - ${num}規模` : ""}

【概要】
${defaultSubject}に関する重要なニュースが入ってきました。${num ? `${num}規模の動きとして` : ""}暗号資産市場で注目を集めています。

【詳細】
${entityJa ? `${entityJa}は暗号資産/ブロックチェーン業界で重要なプレイヤーです。今回の動きは、同社/プロジェクトの戦略的な展開として注目されています。` : `${mainCoin}市場は日々進化を続けており、今回のニュースもその一環です。`}

${num2 ? `関連する数字として${num2}も報じられており、市場への影響が注目されています。` : ""}

${specificDetails.length > 0 ? `【関連情報】\n${specificDetails.map(d => `・${d}`).join("\n")}` : ""}

【市場への影響】
このニュースが市場に与える影響は、短期的には限定的かもしれませんが、長期的なトレンドを形成する一因となる可能性があります。

暗号資産市場は情報の速度が命。ニュースの背景と影響を正しく理解し、冷静な投資判断につなげていきましょう。

詳細が分かり次第、続報をお届けします🔔`;
}

// Legacy function - kept for backwards compatibility but not used
function generateShortJapanese(coin: string, numbers: string[], flags: TopicFlags): string {
  const num = numbers[0] || "";

  if (flags.isHack) {
    return `【緊急】セキュリティインシデント発生

${num ? `被害額${num}規模のセキュリティインシデントが報告されました。` : "暗号資産業界でセキュリティインシデントが発生しました。"}

現在、詳細な調査が進められており、影響を受けたユーザーへの対応が検討されています。攻撃手法や被害の全容については、運営チームからの公式発表を待つ必要があります。

暗号資産を保有する方は、ウォレットのセキュリティ設定を今一度確認することをお勧めします。特に、不審なトランザクションがないか確認し、必要に応じてパスワードの変更や二段階認証の設定を行ってください。

このようなインシデントは、業界全体にとって重要な教訓となります。セキュリティ対策の重要性を再認識しましょう。

最新情報が入り次第、続報をお届けします🔔`;
  }

  if (flags.isETF) {
    return `【注目】${coin}ETF動向

${num ? `${coin}ETFで${num}規模の資金移動が確認されました。` : `${coin}ETF市場で注目すべき動きがありました。`}

機関投資家の暗号資産市場への参入が加速する中、ETFの動向は市場全体に大きな影響を与えています。ETFは規制された投資商品として、従来の金融機関が暗号資産へのエクスポージャーを得るための重要な手段となっています。

資金フローの動向は、機関投資家の市場に対する見方を反映しており、今後の価格トレンドを予測する上で重要な指標となります。

引き続き、ETF市場の動向をウォッチしていきましょう。今後の資金フローに要注目です📊`;
  }

  if (flags.isRegulation) {
    return `【規制】暗号資産規制の新展開

${num ? `${num}に関連する重要な規制動向が発表されました。` : "暗号資産に関する規制動向に注目が集まっています。"}

各国の規制当局は、暗号資産市場の健全な発展のため、様々な施策を検討しています。規制の方向性は、市場参加者にとって極めて重要な指標であり、投資判断に大きな影響を与えます。

短期的には不確実性による価格変動が予想されますが、長期的には市場の信頼性向上につながる可能性があります。

今後の展開を注視し、適切なリスク管理を心がけましょう🔄`;
  }

  if (flags.isGovernance) {
    return `【ガバナンス】DeFi投票結果

DeFiプロトコルでコミュニティによるガバナンス投票が行われました。

分散型金融（DeFi）エコシステムでは、トークン保有者による民主的な意思決定が行われています。今回の投票は、プロトコルの将来に関わる重要な決定であり、コミュニティの意思が反映されます。

ガバナンストークンを保有する方は、積極的に投票に参加することで、プロトコルの発展に貢献できます。これが分散型金融の醍醐味です。

分散型ガバナンスの動向に注目です💡`;
  }

  if (flags.isPositive) {
    return `【上昇】${coin}が好調

${num ? `${coin}が${num}に到達しました。` : `${coin}が上昇傾向を示しています。`}

市場センチメントは改善しており、機関投資家の買い増し観測や、テクニカル指標の好転が上昇を後押ししています。

ただし、暗号資産市場は常にボラティリティが高いため、過度な楽観は禁物です。利益確定のタイミングを見極めつつ、分散投資の原則を忘れずに投資判断を行いましょう。

この上昇トレンドを見逃すな📈`;
  }

  if (flags.isNegative) {
    return `【下落】${coin}が調整局面

${num ? `${coin}が${num}を下回る展開となりました。` : `${coin}が下落傾向にあります。`}

市場は調整局面に入っており、利益確定売りやマクロ経済の不確実性が価格を押し下げています。このような局面では、パニック売りを避け、冷静な判断を心がけることが重要です。

長期的な視点を持ち、追加投資は慎重に検討しましょう。下落相場でも、着実に情報収集を続けることが将来の投資成功につながります。

冷静な判断が求められる相場です📉`;
  }

  return `【マーケット】${coin}市場の動き

${num ? `${coin}市場で${num}に関連する動きがありました。` : `${coin}市場で注目すべきニュースが入ってきました。`}

暗号資産市場は24時間365日動いており、常に新しい展開が生まれています。最新情報をキャッチアップし、市場の動向を把握することが重要です。

投資判断は自己責任で行い、分散投資を心がけましょう。感情的な判断を避け、長期的な視点を持つことが成功への鍵です。

フォローして最新情報をチェック🔔`;
}

function generateMediumJapanese(coin: string, numbers: string[], flags: TopicFlags): string {
  const num = numbers[0] || "";
  const num2 = numbers[1] || "";

  if (flags.isHack) {
    return `【セキュリティ速報】暗号資産業界でインシデント発生

暗号資産エコシステムで重大なセキュリティインシデントが発生しました。${num ? `現時点で報告されている被害額は${num}と推定されています。` : "被害の全容については現在調査中です。"}

■ 概要
今回のインシデントでは、ユーザー資産が不正にアクセスされた可能性があります。セキュリティ専門家の初期分析によると、攻撃者は高度な手法を用いてシステムの脆弱性を突いたと見られています。運営チームは現在、被害状況の詳細な調査と対応策の検討を進めています。

■ 影響範囲
${num ? `・推定被害額：${num}` : "・被害額：調査中"}
・影響を受けたユーザーへの補償を検討中
・セキュリティ監査の強化を予定
・同様の攻撃を防ぐための対策を実施

■ 今後の対応
プロジェクトチームは透明性を保ちながら、詳細な調査結果を公表する予定です。また、影響を受けたユーザーに対しては、補償プログラムの実施も検討されています。

■ ユーザーへの注意事項
暗号資産を保有する皆さんは、以下の点に注意してください：
・ハードウェアウォレットの使用を強く推奨
・不審なリンクやDMには絶対にアクセスしない
・二段階認証の設定を確認・強化
・定期的にウォレットの取引履歴を確認

セキュリティインシデントは、業界全体にとって重要な教訓となります。個人でできるセキュリティ対策を今一度見直しましょう。

続報が入り次第、詳細をお伝えします🔐`;
  }

  if (flags.isETF) {
    return `【ETF動向】${coin}ETFに注目の動き

${num ? `本日、${coin}ETFで${num}規模の資金移動が確認されました。` : `${coin}ETF市場で注目すべき動きがありました。`}これは市場参加者にとって重要なシグナルとなります。

■ 市場への影響
ETFは機関投資家が暗号資産市場に参入するための主要な手段となっています。規制された投資商品として、年金基金や投資信託など大型の機関投資家が参入しやすくなっており、市場全体の流動性向上に寄与しています。${num2 ? `市場全体では${num2}の影響が予想されます。` : ""}

■ 専門家の見解
・機関投資家の参入加速が期待される
・長期的な価格上昇要因となる可能性
・市場の成熟化を示す重要な指標
・暗号資産が主流の資産クラスとして認知される証拠

■ ETFの重要性
ETFは、従来の金融機関が暗号資産へのエクスポージャーを得るための最も効率的な方法です。直接暗号資産を保有することなく、規制された枠組みの中で投資できるため、コンプライアンス面でも安心です。

■ 今後の注目ポイント
・他のETF商品の承認動向
・機関投資家のポートフォリオ配分変化
・規制当局のスタンス
・競合商品との比較

ETFの動向は${coin}だけでなく、暗号資産市場全体のトレンドを左右する重要な要素です。資金フローの変化に注目しながら、市場の方向性を見極めていきましょう。

最新の市場動向をお見逃しなく📊`;
  }

  if (flags.isRegulation) {
    return `【規制動向】暗号資産業界に影響を与える新展開

${num ? `${num}規模の市場に影響を与える可能性のある` : "暗号資産市場全体に影響を与える可能性のある"}規制関連のニュースが入ってきました。

■ 背景
各国の規制当局は暗号資産市場の健全な発展のため、様々な施策を検討しています。消費者保護、マネーロンダリング対策、市場の健全性確保など、多岐にわたる観点から議論が進められています。今回の動きもその一環として注目されています。

■ 市場への影響
・短期的には不確実性による価格変動の可能性
・長期的には市場の信頼性向上に寄与
・機関投資家の参入判断に影響
・新規プロジェクトの立ち上げ環境に変化

■ 業界の反応
暗号資産業界は規制当局との対話を重視しており、建設的な議論を通じて適切なルール作りを目指しています。過度に厳しい規制はイノベーションを阻害する一方、適切な規制は市場の健全な成長を促進します。

■ 世界の規制動向
各国・地域で規制アプローチは異なりますが、国際的な協調も進んでいます。グローバルな視点で規制動向を把握することが重要です。

■ 投資家への示唆
規制の動向は市場に大きな影響を与えます。短期的な価格変動に一喜一憂せず、長期的な視点で市場を見つめることが重要です。最新情報をキャッチアップし、冷静な判断を心がけましょう。

引き続き、規制動向をウォッチしていきます🔄`;
  }

  if (flags.isGovernance) {
    return `【ガバナンス】DeFiプロトコルで重要な投票が実施

分散型金融（DeFi）エコシステムで、コミュニティによる重要なガバナンス投票が行われました。

■ 投票の概要
プロトコルの将来に関わる重要な提案について、トークン保有者による投票が実施されました。${num ? `${num}以上のトークンが投票に参加しました。` : "多くのコミュニティメンバーが投票に参加しました。"}分散型ガバナンスでは、トークン保有者がプロトコルの方向性を決定する権利を持っています。

■ 分散型ガバナンスの意義
・コミュニティ主導の意思決定プロセス
・透明性の高い運営体制
・トークン保有者の権利行使
・中央集権的な意思決定からの脱却

■ 投票の種類
DeFiガバナンスでは、様々な提案が投票にかけられます。プロトコルパラメーターの変更、新機能の追加、トレジャリーの使途、開発ロードマップなど、多岐にわたる議題が民主的に決定されます。

■ 今後への影響
今回の投票結果は、プロトコルの発展方向性を決定づける重要な転換点となります。コミュニティの意思が反映された結果として、プロトコルがどのように進化していくか注目です。

DeFiの民主的なガバナンスモデルは、従来の金融システムにはない革新的な仕組みです。トークン保有者として、積極的にガバナンスに参加することで、エコシステムの発展に貢献できます。

今後も重要なガバナンス動向をお伝えします💡`;
  }

  if (flags.isPositive) {
    return `【市場分析】${coin}が上昇トレンドを維持

${num ? `${coin}が${num}に到達しました。` : `${coin}が堅調な上昇傾向を示しています。`}市場センチメントは改善傾向にあり、さらなる上昇への期待が高まっています。

■ 上昇の背景要因
・市場センチメントの大幅な改善
・機関投資家による継続的な買い増し観測
・テクニカル指標の好転
・ネットワークの採用拡大${num2 ? `\n・${num2}の重要なレジスタンスを突破` : ""}

■ テクニカル分析
現在の価格水準は重要なサポートラインを維持しており、多くのアナリストがさらなる上昇余地があるとの見方を示しています。出来高も増加傾向にあり、上昇トレンドの継続を示唆しています。

■ オンチェーン分析
長期保有者（HODLer）のポジションは安定しており、売り圧力は限定的です。大口投資家（クジラ）の動きも、市場にとってポジティブなシグナルを発しています。

■ 投資家への注意点
・過度な楽観は禁物
・分散投資の原則を忘れずに
・利益確定のタイミングを事前に設定
・自己責任での投資判断を

強気相場でも冷静な分析が重要です。FOMOに流されず、リスク管理を徹底しましょう。

市場の動向を引き続きウォッチしていきます📈`;
  }

  if (flags.isNegative) {
    return `【市場分析】${coin}が調整局面に突入

${num ? `${coin}が${num}を下回る展開となりました。` : `${coin}が下落傾向にあります。`}市場は調整局面に入っており、今後の動向が注目されます。

■ 下落の要因分析
・利益確定売りの増加
・マクロ経済環境の不確実性
・市場全体のリスクオフムード
・レバレッジポジションの清算${num2 ? `\n・${num2}のサポートラインを割り込む` : ""}

■ テクニカル分析
現在の価格水準では、さらなる下落リスクと反発の可能性が拮抗しています。重要なサポートラインの攻防が続いており、この水準を維持できるかが今後の方向性を左右します。

■ 市場センチメント
恐怖指数は上昇しており、市場参加者の間に警戒感が広がっています。このような局面では、感情的な判断を避け、長期的な視点を持つことが重要です。

■ 投資家へのアドバイス
・パニック売りは避ける
・長期視点での判断を心がける
・追加投資は慎重に検討
・損切りラインを事前に設定

下落相場こそ、冷静な判断が求められます。市場が恐怖に支配されている時こそ、長期的な機会を見出すことができるかもしれません。

引き続き市場動向をお伝えします📉`;
  }

  return `【マーケット】${coin}市場の最新動向レポート

${num ? `${num}に関連する重要な動きがありました。` : "暗号資産市場で注目すべきニュースが入ってきました。"}市場参加者にとって重要な情報となりますので、詳細をお伝えします。

■ 概要
暗号資産市場は24時間365日動いており、常に新しい展開が生まれています。今回のニュースも市場の方向性を占う上で重要な情報です。

■ 市場への影響
・短期的な価格変動の可能性
・投資家心理への影響
・今後のトレンド形成に寄与
・他の暗号資産への波及効果

■ 業界の反応
市場参加者は今回のニュースを様々な視点から分析しています。強気派と弱気派の意見が分かれる中、実際の市場動向が今後の方向性を示すことになります。

■ 注目ポイント
・価格動向の変化
・取引量の推移
・関連するニュースの続報
・機関投資家の動き

■ 投資家へのアドバイス
暗号資産投資は自己責任で行い、分散投資を心がけましょう。感情的な判断を避け、長期的な視点を持つことが成功への鍵です。

市場の動向を継続的にウォッチし、重要な変化があればいち早くお届けします。

フォローして最新情報をキャッチ🔔`;
}

function generateLongJapanese(coin: string, numbers: string[], flags: TopicFlags): string {
  const num = numbers[0] || "";
  const num2 = numbers[1] || "";

  if (flags.isHack) {
    return `【緊急セキュリティレポート】暗号資産業界でインシデント発生

━━━━━━━━━━━━━━━━━━━━
■ 速報
━━━━━━━━━━━━━━━━━━━━

暗号資産エコシステムで重大なセキュリティインシデントが発生しました。${num ? `現時点で報告されている被害額は${num}と推定されています。` : "被害額については現在調査中です。"}

━━━━━━━━━━━━━━━━━━━━
■ インシデントの詳細
━━━━━━━━━━━━━━━━━━━━

【発生状況】
セキュリティ専門家の分析によると、今回のインシデントは高度な攻撃手法によるものと見られています。攻撃者は脆弱性を突いてシステムに侵入し、ユーザー資産にアクセスした可能性があります。

【影響範囲】
${num ? `・推定被害額：${num}` : "・被害額：調査中"}
${num2 ? `・影響を受けたアドレス数：${num2}` : "・影響を受けたユーザー：確認中"}
・対象となった資産：複数の暗号資産

━━━━━━━━━━━━━━━━━━━━
■ 運営チームの対応
━━━━━━━━━━━━━━━━━━━━

【即時対応】
・該当システムの一時停止
・セキュリティ監査会社との連携
・法執行機関への報告

【今後の予定】
・被害状況の詳細調査
・影響を受けたユーザーへの補償検討
・セキュリティ強化策の実施

━━━━━━━━━━━━━━━━━━━━
■ ユーザーへの推奨事項
━━━━━━━━━━━━━━━━━━━━

【今すぐ確認すべきこと】
1. 自身のウォレットに不審な取引がないか確認
2. 該当サービスで使用したパスワードの変更
3. 二段階認証の設定状況を確認

【セキュリティ強化のポイント】
・ハードウェアウォレットの使用を強く推奨
・大きな資産は複数のウォレットに分散
・不審なDMやリンクには絶対にアクセスしない
・定期的なセキュリティチェックの習慣化

━━━━━━━━━━━━━━━━━━━━
■ 業界への影響と教訓
━━━━━━━━━━━━━━━━━━━━

今回のインシデントは、暗号資産業界全体にとって重要な教訓となります。セキュリティは最優先事項であり、ユーザー・プロジェクト双方が常に警戒を怠らないことが重要です。

続報が入り次第、詳細をお伝えします。
安全な暗号資産ライフを🔐`;
  }

  if (flags.isETF) {
    return `【徹底解説】${coin}ETF最新動向レポート

━━━━━━━━━━━━━━━━━━━━
■ 本日のETF動向
━━━━━━━━━━━━━━━━━━━━

${num ? `${coin}ETFにおいて、${num}規模の資金移動が確認されました。` : `${coin}ETF市場で注目すべき動きがありました。`}これは市場参加者にとって重要なシグナルとなります。

━━━━━━━━━━━━━━━━━━━━
■ ETFが重要な理由
━━━━━━━━━━━━━━━━━━━━

【機関投資家の参入経路】
ETFは、従来の金融機関が暗号資産市場に参入するための最も重要な手段です。規制された枠組みの中で暗号資産へのエクスポージャーを得られるため、年金基金や投資信託など、大型の機関投資家が参入しやすくなっています。

【市場への影響】
・流動性の大幅な向上
・価格のボラティリティ低下（長期的）
・市場の信頼性・正当性の向上
・個人投資家への波及効果

━━━━━━━━━━━━━━━━━━━━
■ 最新の市場データ
━━━━━━━━━━━━━━━━━━━━

【資金フロー】
${num ? `・本日の純流入/流出：${num}` : "・資金フロー：確認中"}
${num2 ? `・週間累計：${num2}` : ""}
・機関投資家の姿勢：積極的/様子見

【市場シェア】
主要ETF商品の中で、資金は分散して流入しており、市場の健全な成長を示しています。

━━━━━━━━━━━━━━━━━━━━
■ 専門家の分析
━━━━━━━━━━━━━━━━━━━━

【強気派の見方】
「ETFへの資金流入は、暗号資産が主流の資産クラスとして認知されつつある証拠。長期的な価格上昇の基盤となる」

【慎重派の見方】
「短期的な資金フローに一喜一憂すべきではない。ファンダメンタルズを重視した投資判断が重要」

━━━━━━━━━━━━━━━━━━━━
■ 今後の注目ポイント
━━━━━━━━━━━━━━━━━━━━

1. 新規ETF商品の承認動向
2. 機関投資家のポートフォリオ配分変化
3. 規制環境の変化
4. 競合商品との比較

━━━━━━━━━━━━━━━━━━━━
■ 投資家へのアドバイス
━━━━━━━━━━━━━━━━━━━━

ETFの動向は重要ですが、投資判断は総合的に行うことが大切です。

・長期的な視点を持つ
・分散投資を心がける
・自身のリスク許容度を把握する
・最新情報を継続的にチェック

市場動向を引き続きお届けします📊`;
  }

  if (flags.isPositive) {
    return `【マーケット分析】${coin}上昇トレンド徹底解説

━━━━━━━━━━━━━━━━━━━━
■ 現在の市場状況
━━━━━━━━━━━━━━━━━━━━

${num ? `${coin}が${num}に到達し、上昇トレンドが継続しています。` : `${coin}が堅調な値動きを見せています。`}市場センチメントは改善傾向にあり、さらなる上昇への期待が高まっています。

━━━━━━━━━━━━━━━━━━━━
■ 上昇の背景要因
━━━━━━━━━━━━━━━━━━━━

【ファンダメンタルズ要因】
・機関投資家の継続的な買い増し
・ネットワークの採用拡大
・開発活動の活発化
・マクロ経済環境の好転

【テクニカル要因】
・重要なレジスタンスラインの突破
・出来高の増加
・RSIなど複数の指標が上昇シグナル
${num2 ? `・次のターゲット：${num2}` : ""}

━━━━━━━━━━━━━━━━━━━━
■ オンチェーン分析
━━━━━━━━━━━━━━━━━━━━

【ホルダー動向】
長期保有者（HODLer）のポジションは安定しており、売り圧力は限定的です。新規アドレスの増加も見られ、市場への新規参入が続いています。

【クジラの動き】
大口投資家（クジラ）は積極的な買い増しを行っており、これは強気シグナルとして解釈されています。

━━━━━━━━━━━━━━━━━━━━
■ 価格予想シナリオ
━━━━━━━━━━━━━━━━━━━━

【強気シナリオ】
現在のモメンタムが継続した場合、さらなる上昇余地があります。${num2 ? `次の重要なレジスタンスは${num2}です。` : ""}

【基本シナリオ】
現在の価格帯でのコンソリデーション（値固め）を経て、段階的な上昇が予想されます。

【弱気シナリオ】
利益確定売りによる一時的な調整の可能性も考慮すべきです。${num ? `${num}がサポートラインとなります。` : ""}

━━━━━━━━━━━━━━━━━━━━
■ 投資戦略のポイント
━━━━━━━━━━━━━━━━━━━━

【推奨アクション】
1. ポートフォリオのリバランスを検討
2. 利益確定のタイミングを事前に設定
3. 追加投資は段階的に実施
4. ストップロスの設定を忘れずに

【注意点】
・過度な楽観は禁物
・FOMOに流されない
・自己責任での投資判断を
・分散投資の原則を守る

━━━━━━━━━━━━━━━━━━━━
■ まとめ
━━━━━━━━━━━━━━━━━━━━

${coin}は堅調な上昇トレンドを維持していますが、暗号資産市場は常に変動が大きいことを忘れてはいけません。

冷静な分析と適切なリスク管理で、賢い投資を心がけましょう。

引き続き市場動向をお届けします📈`;
  }

  // Default long content
  return `【週刊クリプトレポート】${coin}市場の総合分析

━━━━━━━━━━━━━━━━━━━━
■ 市場概況
━━━━━━━━━━━━━━━━━━━━

${num ? `${coin}は現在${num}付近で推移しています。` : `${coin}市場で注目すべき動きがありました。`}暗号資産市場全体が注目を集める中、最新の動向をお伝えします。

━━━━━━━━━━━━━━━━━━━━
■ 主要トピック
━━━━━━━━━━━━━━━━━━━━

【価格動向】
市場は複数の要因により、変動を続けています。短期的なボラティリティは高いものの、長期的なトレンドは注目に値します。

【機関投資家の動向】
機関投資家の暗号資産への関心は継続しており、市場の成熟化に寄与しています。

【技術開発】
各プロジェクトで開発活動が活発に行われており、エコシステムの拡大が続いています。

━━━━━━━━━━━━━━━━━━━━
■ マクロ経済との関連
━━━━━━━━━━━━━━━━━━━━

暗号資産市場は、マクロ経済環境と密接に連動するようになっています。

・金利政策の影響
・インフレ動向
・地政学的リスク
・伝統的金融市場との相関

これらの要因を総合的に判断することが、投資成功の鍵となります。

━━━━━━━━━━━━━━━━━━━━
■ 注目の今後のイベント
━━━━━━━━━━━━━━━━━━━━

暗号資産市場には、価格に影響を与える可能性のある複数のイベントが予定されています。

・主要プロジェクトのアップグレード
・規制関連の発表
・企業の暗号資産採用ニュース
・マクロ経済指標の発表

━━━━━━━━━━━━━━━━━━━━
■ 投資家へのアドバイス
━━━━━━━━━━━━━━━━━━━━

【基本原則】
1. 投資は余裕資金で行う
2. 分散投資を心がける
3. 長期的な視点を持つ
4. 感情的な判断を避ける
5. 継続的な学習を怠らない

【リスク管理】
・損失許容額を事前に設定
・レバレッジは慎重に
・セキュリティ対策を万全に

━━━━━━━━━━━━━━━━━━━━
■ まとめ
━━━━━━━━━━━━━━━━━━━━

暗号資産市場は、革新的な技術と投資機会を提供する一方で、高いリスクも伴います。

最新情報をキャッチアップし、賢明な投資判断を心がけましょう。

フォローして最新情報をチェック🔔`;
}

// Generate post text with actual content
function generatePostText(title: string, content: string, category: string, length: "short" | "medium" | "long" = "short"): string {
  const jaTitle = generateJapaneseTitle(title, content);
  const jaContent = generateJapaneseSummary(title, content, length);

  return `${jaTitle}

${jaContent}`;
}

// Categorize news
function categorizeNews(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();

  if (/breaking|urgent|just in|alert/i.test(text)) return "breaking";
  if (/sec|cftc|regulation|regulatory|government|law|congress|senate/i.test(text)) return "regulation";
  if (/upgrade|fork|launch|mainnet|protocol|layer|development/i.test(text)) return "technology";
  if (/price|surge|drop|rally|market|etf|trading|volume|inflow|outflow/i.test(text)) return "market";
  if (/analysis|report|data|research|forecast|prediction|outlook/i.test(text)) return "analysis";

  return "default";
}

// Emotion triggers by category
const EMOTION_TRIGGERS: Record<string, string[]> = {
  breaking: ["緊急性", "FOMO", "驚き"],
  analysis: ["教育", "データ", "分析"],
  regulation: ["警告", "注意", "影響"],
  technology: ["技術", "期待", "革新"],
  market: ["FOMO", "興奮", "データ"],
  default: ["情報", "ニュース", "共有"],
};

// Calculate score
function calculateScore(title: string, content: string): number {
  let score = 50;
  const text = (title + " " + content).toLowerCase();

  // Boost for important topics
  if (/bitcoin|btc/i.test(text)) score += 10;
  if (/ethereum|eth/i.test(text)) score += 8;
  if (/etf/i.test(text)) score += 10;
  if (/breaking|urgent/i.test(text)) score += 15;
  if (/\$[\d]+[BMK]/i.test(text)) score += 5; // Large amounts
  if (/hack|exploit|attack/i.test(text)) score += 10;
  if (/sec|regulation/i.test(text)) score += 8;

  return Math.min(95, score);
}

export type GenerateResult = {
  processed: number;
  generated: number;
  skipped: number;
  errors: string[];
};

export async function generateDraftsFromRSS(limit: number = 20): Promise<GenerateResult> {
  const jobStartTime = Date.now();
  activeJobs.inc({ job_type: "generate_drafts" });

  const result: GenerateResult = {
    processed: 0,
    generated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get recent RSS items that don't have drafts yet
    const recentItems = await prisma.ingestItem.findMany({
      where: {
        externalId: { startsWith: "rss:" },
        draftPosts: { none: {} },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    result.processed = recentItems.length;
    draftGenerationQueueLength.set(recentItems.length);

    const templates = await prisma.template.findMany();
    if (templates.length === 0) {
      result.errors.push("No templates found");
      return result;
    }

    for (const item of recentItems) {
      const itemStartTime = Date.now();

      try {
        const raw = item.raw as { title?: string; content?: string };
        const title = raw.title || item.text || "";
        const content = raw.content || "";

        // Skip if no meaningful content
        if (!title || title.length < 10) {
          result.skipped++;
          continue;
        }

        // Skip non-crypto/generic news titles
        const skipPatterns = [
          /best games/i,
          /here's what happened/i,
          /deep-sea|ocean|marine/i,
          /^how .+ adapted/i,
        ];
        if (skipPatterns.some(p => p.test(title))) {
          result.skipped++;
          continue;
        }

        const jaTitle = generateJapaneseTitle(title, content);

        // Skip if title is still mostly English (>30% English characters)
        const englishChars = (jaTitle.match(/[a-zA-Z]/g) || []).length;
        const englishRatio = englishChars / jaTitle.length;
        if (englishRatio > 0.3) {
          result.skipped++;
          continue;
        }

        const category = categorizeNews(title, content);
        const score = calculateScore(title, content);

        // Select template based on category
        const templateMap: Record<string, string[]> = {
          breaking: ["URG_BREAKING", "URG_ALERT"],
          market: ["DATA_STATS", "FOMO_WAVE"],
          regulation: ["URG_ALERT", "CONT_TRUTH"],
          technology: ["EDU_THREAD", "EDU_COMPARE"],
          analysis: ["DATA_STATS", "DATA_CHART"],
        };

        const preferredCodes = templateMap[category] || ["URG_BREAKING"];
        let template = templates.find((t) => preferredCodes.includes(t.code));
        if (!template) {
          template = templates[Math.floor(Math.random() * templates.length)];
        }

        // Generate 3 versions with different lengths
        const lengths: Array<"short" | "medium" | "long"> = ["short", "medium", "long"];

        for (const length of lengths) {
          const postText = generatePostText(title, content, category, length);

          // Skip if generated post is too short
          if (postText.length < 150) {
            continue;
          }

          await prisma.draftPost.create({
            data: {
              ingestItemId: item.id,
              templateId: template.id,
              title: `${jaTitle}【${length === "short" ? "200-400字" : length === "medium" ? "500-1000字" : "1000字以上"}】`,
              postText,
              emotionTriggers: EMOTION_TRIGGERS[category] || EMOTION_TRIGGERS.default,
              trendScore: score + (length === "long" ? 5 : length === "medium" ? 3 : 0),
              riskFlags: {
                hype_level: score > 75 ? "medium" : "low",
                info_certainty: "medium",
                notes: `Auto-generated from ${(item.metrics as { source?: string })?.source || "RSS"} - ${length}`,
                length_category: length,
              },
              status: "pending",
            },
          });

          result.generated++;

          // Track by template
          draftsGeneratedByTemplate.inc({ template_code: template.code });
        }

        // Track successful draft generation for this item
        trackDraftGeneration(
          template.code,
          "success",
          Date.now() - itemStartTime
        );
      } catch (error) {
        result.skipped++;
        result.errors.push(error instanceof Error ? error.message : "Unknown error");

        // Track failed draft generation
        trackDraftGeneration(
          "unknown",
          "error",
          Date.now() - itemStartTime
        );
      }
    }

    // Track successful job completion
    const jobDuration = Date.now() - jobStartTime;
    jobExecutionsTotal.inc({ job_type: "generate_drafts", status: "success" });
    jobExecutionDuration.observe({ job_type: "generate_drafts" }, jobDuration / 1000);

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown error");

    // Track job failure
    const jobDuration = Date.now() - jobStartTime;
    jobExecutionsTotal.inc({ job_type: "generate_drafts", status: "failed" });
    jobExecutionDuration.observe({ job_type: "generate_drafts" }, jobDuration / 1000);
  } finally {
    activeJobs.dec({ job_type: "generate_drafts" });
    draftGenerationQueueLength.set(0);
  }

  return result;
}

