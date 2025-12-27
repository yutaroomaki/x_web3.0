// 30 types of X post templates based on viral patterns
export type TemplateCategory =
  | "urgency"
  | "fomo"
  | "education"
  | "story"
  | "controversy"
  | "data";

export type Template = {
  code: string;
  name: string;
  category: TemplateCategory;
  hook_type: "question" | "shock" | "empathy";
  description: string;
  structure: {
    hook: string;
    body: string;
    cta: string;
  };
  example: string;
};

export const TEMPLATES: Template[] = [
  // Urgency Templates (1-5)
  {
    code: "URG_BREAKING",
    name: "緊急速報型",
    category: "urgency",
    hook_type: "shock",
    description: "速報ニュースを伝える緊急性の高い投稿",
    structure: {
      hook: "【速報】{topic}が{event}",
      body: "{detail1}\n\n{detail2}\n\n{impact}",
      cta: "最新情報が入り次第お伝えします。\nフォローして続報をお待ちください",
    },
    example:
      "【速報】ビットコインが10万ドル突破\n\n機関投資家の大量買いが確認\n\n2024年最高値を更新\n\n続報をフォローで",
  },
  {
    code: "URG_COUNTDOWN",
    name: "カウントダウン型",
    category: "urgency",
    hook_type: "shock",
    description: "期限を設けて緊急性を演出",
    structure: {
      hook: "あと{time}で{event}",
      body: "{reason}\n\n{action_needed}",
      cta: "今すぐチェック",
    },
    example:
      "あと24時間でエアドロップ終了\n\n対象者は早めに確認を\n\n条件：ウォレット接続のみ\n\n今すぐチェック",
  },
  {
    code: "URG_ALERT",
    name: "警告型",
    category: "urgency",
    hook_type: "shock",
    description: "注意喚起や警告を促す投稿",
    structure: {
      hook: "⚠️ {warning}",
      body: "{detail}\n\n{evidence}",
      cta: "拡散して被害を防ぎましょう",
    },
    example:
      "⚠️ 新手の詐欺に注意\n\n公式を装ったDMが急増中\n\n公式は絶対にDMしません\n\nRT・拡散で被害を防ごう",
  },
  {
    code: "URG_EXCLUSIVE",
    name: "独占情報型",
    category: "urgency",
    hook_type: "shock",
    description: "限定・独占情報を強調",
    structure: {
      hook: "【独占】まだ誰も知らない{topic}",
      body: "{insider_info}\n\n{implication}",
      cta: "続きはリプ欄で",
    },
    example:
      "【独占】まだ誰も知らない新規上場情報\n\n大手取引所が来週発表予定\n\n対象トークンは...\n\n続きはリプ欄で",
  },
  {
    code: "URG_REALTIME",
    name: "リアルタイム実況型",
    category: "urgency",
    hook_type: "shock",
    description: "今起きていることをリアルタイムで共有",
    structure: {
      hook: "今、{event}が起きています",
      body: "{observation}\n\n{data}",
      cta: "状況をウォッチ中。いいねで通知ON",
    },
    example:
      "今、大口が大量に買い増ししています\n\nオンチェーンで確認\n\n過去24時間で$10M流入\n\nいいねで続報通知",
  },

  // FOMO Templates (6-10)
  {
    code: "FOMO_MISSED",
    name: "乗り遅れ警告型",
    category: "fomo",
    hook_type: "question",
    description: "機会損失への恐怖を刺激",
    structure: {
      hook: "まだ{topic}知らないの？",
      body: "{success_story}\n\n{opportunity}",
      cta: "今からでも遅くない。保存して後で読んで",
    },
    example:
      "まだSOLのエアドロ知らないの？\n\n先月参加した人は$500獲得\n\n次のチャンスは今週末まで\n\n保存して後で確認",
  },
  {
    code: "FOMO_EARLY",
    name: "先行者利益型",
    category: "fomo",
    hook_type: "shock",
    description: "早期参入のメリットを強調",
    structure: {
      hook: "1%の人しか知らない{topic}",
      body: "{why_early}\n\n{potential}",
      cta: "この投稿を保存して準備を",
    },
    example:
      "1%の人しか知らないL2プロジェクト\n\nまだトークンなし\n\n今触っておくとエアドロ対象に\n\n保存して準備を",
  },
  {
    code: "FOMO_REGRET",
    name: "後悔型",
    category: "fomo",
    hook_type: "empathy",
    description: "過去の機会損失から学ぶ形式",
    structure: {
      hook: "あの時{action}していれば...",
      body: "{past_opportunity}\n\n{current_similar}",
      cta: "同じ後悔をしないために。RT",
    },
    example:
      "2020年にETH買っていれば...\n\n当時$200→今$3000\n\n似たチャンスが今ここに\n\n同じ後悔をしないために",
  },
  {
    code: "FOMO_WAVE",
    name: "波乗り型",
    category: "fomo",
    hook_type: "shock",
    description: "トレンドの波に乗ることを促す",
    structure: {
      hook: "{trend}の波が来ている",
      body: "{evidence}\n\n{how_to_ride}",
      cta: "今がチャンス。ブックマーク必須",
    },
    example:
      "AIミームコインの波が来ている\n\nこの1週間で平均300%上昇\n\n注目すべき3銘柄は...\n\nブクマ必須",
  },
  {
    code: "FOMO_INSIDER",
    name: "インサイダー風型",
    category: "fomo",
    hook_type: "shock",
    description: "内部情報を匂わせる",
    structure: {
      hook: "これ言っていいのかわからないけど...",
      body: "{hint}\n\n{implication}",
      cta: "DYOR。でも知っておいて損はない",
    },
    example:
      "これ言っていいのかわからないけど...\n\n大手CEXが来月ある発表をする\n\n関連トークンは...\n\nDYOR",
  },

  // Education Templates (11-15)
  {
    code: "EDU_THREAD",
    name: "解説スレッド型",
    category: "education",
    hook_type: "question",
    description: "知識を体系的に解説",
    structure: {
      hook: "{topic}を5分で完全理解🧵",
      body: "1. {point1}\n2. {point2}\n3. {point3}",
      cta: "保存して後で読み返そう。いいねで応援",
    },
    example:
      "DeFiを5分で完全理解🧵\n\n1. 銀行なしで金融\n2. スマコンで自動化\n3. 利回りの仕組み\n\n保存必須",
  },
  {
    code: "EDU_MISTAKE",
    name: "失敗から学ぶ型",
    category: "education",
    hook_type: "empathy",
    description: "失敗談から教訓を伝える",
    structure: {
      hook: "この失敗で{amount}失いました",
      body: "{what_happened}\n\n{lesson}",
      cta: "同じ失敗をしないで。RT拡散希望",
    },
    example:
      "この失敗で100万円失いました\n\nレバ100倍でロスカット\n\n教訓：リスク管理が全て\n\nRT拡散希望",
  },
  {
    code: "EDU_COMPARE",
    name: "比較解説型",
    category: "education",
    hook_type: "question",
    description: "2つの選択肢を比較",
    structure: {
      hook: "{option1} vs {option2}どっちがいい？",
      body: "{comparison}\n\n{conclusion}",
      cta: "あなたはどっち派？コメントで教えて",
    },
    example:
      "BTC vs ETH どっちがいい？\n\n・BTC：デジタルゴールド\n・ETH：ユーティリティ\n\n結論：両方持つべき\n\nコメントで教えて",
  },
  {
    code: "EDU_BEGINNER",
    name: "初心者向け型",
    category: "education",
    hook_type: "empathy",
    description: "初心者に優しく解説",
    structure: {
      hook: "仮想通貨始めたい人、これだけ覚えて",
      body: "{essential1}\n{essential2}\n{essential3}",
      cta: "わからないことはリプで質問を",
    },
    example:
      "仮想通貨始めたい人、これだけ覚えて\n\n✅ 余剰資金で\n✅ 分散投資\n✅ 長期目線\n\nリプで質問受付中",
  },
  {
    code: "EDU_MYTH",
    name: "誤解解消型",
    category: "education",
    hook_type: "shock",
    description: "よくある誤解を正す",
    structure: {
      hook: "{myth}は完全な嘘です",
      body: "{truth}\n\n{evidence}",
      cta: "正しい情報を広めよう。RT",
    },
    example:
      "「BTCは詐欺」は完全な嘘です\n\n・15年間稼働\n・時価総額1兆ドル超\n・機関投資家も参入\n\n正しい情報をRT",
  },

  // Story Templates (16-20)
  {
    code: "STORY_JOURNEY",
    name: "成功ストーリー型",
    category: "story",
    hook_type: "empathy",
    description: "成功までの道のりを語る",
    structure: {
      hook: "{start}から{goal}までの話",
      body: "{journey}\n\n{turning_point}",
      cta: "あなたも諦めないで。いいねで応援",
    },
    example:
      "借金500万から資産1億までの話\n\n2020年、人生最悪の時期\n\nBTCに出会って人生変わった\n\n諦めないで",
  },
  {
    code: "STORY_BEHIND",
    name: "裏話型",
    category: "story",
    hook_type: "shock",
    description: "知られざる裏話を公開",
    structure: {
      hook: "{topic}の知られざる真実",
      body: "{reveal}\n\n{implication}",
      cta: "この話、もっと広まるべき。RT",
    },
    example:
      "イーサリアムの知られざる真実\n\nVitalikは当初BTCのコア開発を希望\n\n拒否されてETH誕生\n\nRT",
  },
  {
    code: "STORY_DAILY",
    name: "日常切り取り型",
    category: "story",
    hook_type: "empathy",
    description: "日常の一コマから気づきを得る",
    structure: {
      hook: "今日こんなことがあった",
      body: "{episode}\n\n{insight}",
      cta: "共感したらいいね",
    },
    example:
      "今日こんなことがあった\n\n友人「仮想通貨なんて詐欺でしょ」\n\n3年前の自分もそうだった\n\n共感したらいいね",
  },
  {
    code: "STORY_TRANSFORMATION",
    name: "変化型",
    category: "story",
    hook_type: "empathy",
    description: "ビフォーアフターを見せる",
    structure: {
      hook: "{before} → {after}",
      body: "{how}\n\n{key_factor}",
      cta: "あなたも変われる。保存",
    },
    example:
      "月収20万 → 月収200万\n\n変わったのは「情報源」だけ\n\n正しい情報は財産\n\n保存推奨",
  },
  {
    code: "STORY_CONFESSION",
    name: "告白型",
    category: "story",
    hook_type: "empathy",
    description: "正直な告白で共感を得る",
    structure: {
      hook: "正直に言います",
      body: "{confession}\n\n{lesson}",
      cta: "同じ経験ある人いいね",
    },
    example:
      "正直に言います\n\n含み損で眠れない夜があった\n\n今は笑い話だけど当時は辛かった\n\n同じ経験ある人いいね",
  },

  // Controversy Templates (21-25)
  {
    code: "CONT_UNPOPULAR",
    name: "逆張り型",
    category: "controversy",
    hook_type: "shock",
    description: "一般論と反対の意見を述べる",
    structure: {
      hook: "批判覚悟で言うけど",
      body: "{unpopular_opinion}\n\n{reasoning}",
      cta: "反論あればコメントで",
    },
    example:
      "批判覚悟で言うけど\n\nアルトシーズンはもう来ない\n\n理由：市場構造が変わった\n\n反論あればコメントで",
  },
  {
    code: "CONT_PREDICTION",
    name: "予言型",
    category: "controversy",
    hook_type: "shock",
    description: "大胆な予測を述べる",
    structure: {
      hook: "{timeframe}後、{prediction}",
      body: "{basis}\n\n{scenario}",
      cta: "スクショ保存推奨",
    },
    example:
      "1年後、BTC20万ドル\n\n半減期後のサイクルは毎回5-10倍\n\n今回も例外じゃない\n\nスクショ保存",
  },
  {
    code: "CONT_TRUTH",
    name: "真実暴露型",
    category: "controversy",
    hook_type: "shock",
    description: "隠された真実を暴く",
    structure: {
      hook: "{topic}の不都合な真実",
      body: "{revelation}\n\n{evidence}",
      cta: "広めるべき事実。RT",
    },
    example:
      "取引所の不都合な真実\n\nあなたのコインは実際には存在しない\n\nNot your keys, not your coins\n\nRT",
  },
  {
    code: "CONT_CHALLENGE",
    name: "挑戦状型",
    category: "controversy",
    hook_type: "question",
    description: "読者に挑戦を投げかける",
    structure: {
      hook: "これに反論できる人いる？",
      body: "{claim}\n\n{support}",
      cta: "反論待ってます",
    },
    example:
      "これに反論できる人いる？\n\nBTCはこの10年で最も成功した投資先\n\nS&P500の10倍のリターン\n\n反論待ってます",
  },
  {
    code: "CONT_DEBATE",
    name: "議論喚起型",
    category: "controversy",
    hook_type: "question",
    description: "賛否が分かれるテーマで議論を促す",
    structure: {
      hook: "{topic}について議論しよう",
      body: "{side1}\n{side2}",
      cta: "あなたの意見をコメントで",
    },
    example:
      "規制について議論しよう\n\n賛成派：投資家保護になる\n反対派：イノベーション阻害\n\nあなたの意見は？",
  },

  // Data Templates (26-30)
  {
    code: "DATA_STATS",
    name: "統計データ型",
    category: "data",
    hook_type: "shock",
    description: "驚きの統計データを提示",
    structure: {
      hook: "衝撃のデータ：{stat}",
      body: "{context}\n\n{implication}",
      cta: "データは嘘をつかない。保存",
    },
    example:
      "衝撃のデータ：BTCホルダーの90%が利益\n\n長期保有が正解だった\n\n平均保有期間：3.2年\n\n保存推奨",
  },
  {
    code: "DATA_CHART",
    name: "チャート解説型",
    category: "data",
    hook_type: "shock",
    description: "チャートパターンを解説",
    structure: {
      hook: "このチャート、見逃さないで",
      body: "{pattern}\n\n{what_it_means}",
      cta: "テクニカル派はRT",
    },
    example:
      "このチャート、見逃さないで\n\n週足で強気ダイバージェンス\n\n過去3回とも大きく上昇\n\nテクニカル派はRT",
  },
  {
    code: "DATA_ONCHAIN",
    name: "オンチェーン分析型",
    category: "data",
    hook_type: "shock",
    description: "オンチェーンデータから洞察",
    structure: {
      hook: "オンチェーンが示す{insight}",
      body: "{data}\n\n{interpretation}",
      cta: "データで判断。いいね",
    },
    example:
      "オンチェーンが示すクジラの動き\n\n過去7日で$500M流入\n\n大口は買い増し中\n\nデータで判断",
  },
  {
    code: "DATA_RANKING",
    name: "ランキング型",
    category: "data",
    hook_type: "question",
    description: "ランキング形式で情報を整理",
    structure: {
      hook: "{topic}ランキングTOP{n}",
      body: "1位：{first}\n2位：{second}\n3位：{third}",
      cta: "異論あればコメント",
    },
    example:
      "今週の上昇率TOP3\n\n1位：PEPE +120%\n2位：WIF +80%\n3位：BONK +65%\n\n異論あればコメント",
  },
  {
    code: "DATA_TIMELINE",
    name: "タイムライン型",
    category: "data",
    hook_type: "shock",
    description: "時系列で出来事を整理",
    structure: {
      hook: "{topic}の歴史を振り返る",
      body: "{year1}: {event1}\n{year2}: {event2}\n{year3}: {event3}",
      cta: "歴史は繰り返す。保存",
    },
    example:
      "BTCの歴史を振り返る\n\n2013: 初の1000ドル\n2017: 20000ドル\n2021: 69000ドル\n\n歴史は繰り返す",
  },
];

/**
 * Get template by code
 */
export function getTemplateByCode(code: string): Template | undefined {
  return TEMPLATES.find((t) => t.code === code);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get templates by hook type
 */
export function getTemplatesByHookType(
  hookType: Template["hook_type"]
): Template[] {
  return TEMPLATES.filter((t) => t.hook_type === hookType);
}

/**
 * Select best template based on analysis
 */
export function selectTemplate(
  hookType: "question" | "shock" | "empathy",
  emotionProfile: Record<string, number>
): Template {
  // Get templates matching the hook type
  const candidates = getTemplatesByHookType(hookType);

  // Score templates based on emotion profile
  const scored = candidates.map((template) => {
    let score = 0;

    // Match urgency emotions to urgency templates
    if (emotionProfile.urgency > 0.5 && template.category === "urgency") {
      score += 30;
    }
    if (emotionProfile.fomo > 0.5 && template.category === "fomo") {
      score += 30;
    }
    if (emotionProfile.curiosity > 0.5 && template.category === "education") {
      score += 20;
    }
    if (emotionProfile.trust > 0.5 && template.category === "data") {
      score += 25;
    }

    // Add some randomness for variety
    score += Math.random() * 10;

    return { template, score };
  });

  // Sort by score and return best match
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.template ?? TEMPLATES[0];
}
