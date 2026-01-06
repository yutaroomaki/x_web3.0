import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Updating titles to Japanese...");

  const drafts = await prisma.draftPost.findMany({
    include: { ingestItem: { select: { text: true } } },
  });

  let updated = 0;
  for (const draft of drafts) {
    const sourceText = draft.ingestItem.text || "";

    // Extract Japanese title from postText first line
    const firstLine = draft.postText.split("\n")[0];
    let newTitle = firstLine
      .replace(/^【.*?】\s*/, "")
      .replace(/^「.*?」\s*/, "")
      .trim();

    // If first line is too short or has too many English chars, use source text
    if (newTitle.length < 5) {
      newTitle = sourceText.slice(0, 50);
    }

    // Check if current title needs update (has English text)
    const currentTitle = draft.title || "";
    const hasEnglishTitle = /^[A-Za-z0-9\s:,\-\$']+$/.test(currentTitle.slice(0, 30));

    if (hasEnglishTitle || !currentTitle) {
      // Use postText first line if it looks Japanese
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(newTitle);
      if (hasJapanese && newTitle.length >= 5) {
        await prisma.draftPost.update({
          where: { id: draft.id },
          data: { title: newTitle.slice(0, 60) },
        });
        updated++;
        console.log(`  ✅ ${newTitle.slice(0, 40)}...`);
      }
    }
  }

  console.log(`\n🎉 Updated ${updated} titles to Japanese`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
