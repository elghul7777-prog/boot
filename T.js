import axios from 'axios';

// دالة لخلط النتائج
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// هنا بنصدّر الأمر
export function setupTiktokCommand(bot) {
  bot.command(['tiktoksearch','tts','استوري'], async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const text = args.join(' ');

    if (!text) return ctx.reply('[❗️] ارسل النص اللي عايز تبحث عنه على تيك توك 🧞');

    try {
      const { data: response } = await axios.get(
        `https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(text)}`
      );

      let searchResults = response.data;

      if (!searchResults || !searchResults.length) 
        return ctx.reply('🚫 لم يتم العثور على نتائج.');

      let selectedResults = shuffleArray(searchResults).slice(0, 7);

      for (let result of selectedResults) {
        let caption = `🎬 *${result.title}*\n🔗 رابط الفيديو: [اضغط هنا](${result.nowm})`;
        await ctx.replyWithVideo(result.nowm, { caption, parse_mode: 'Markdown' });
      }

    } catch (error) {
      console.error(error);
      ctx.reply('❌ حصل خطأ أثناء البحث في تيك توك.');
    }
  });
}