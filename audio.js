import { unlinkSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { exec } from "child_process";

// random file name
const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

export default function setupAudio(bot) {
  bot.command(
    [
      "deep",
      "crushed",
      "fat",
      "loud",
      "fast",
      "fatter",
      "thin",
      "reverse",
      "robot",
      "slow",
      "soft",
      "chipmunk",
    ],
    async (ctx) => {
      try {
        // 📌 لازم يكون فيه صوت (voice أو audio)
        if (
          (!ctx.message.reply_to_message ||
            (!ctx.message.reply_to_message.voice &&
             !ctx.message.reply_to_message.audio)) &&
          !ctx.message.voice &&
          !ctx.message.audio
        ) {
          return ctx.reply("❗🕷️ اعمل ريبلاي على الصوت أو ابعته مع الكوماند 🩸");
        }

        let command = ctx.message.text.split(" ")[0].replace("/", "");
        let set;

        if (/deep/.test(command))
          set = "-af equalizer=f=94:width_type=o:width=2:g=30";
        if (/crushed/.test(command)) set = "-af acrusher=.1:1:64:0:log";
        if (/fat/.test(command)) set = "-af atempo=4/4,asetrate=44500*2/3";
        if (/loud/.test(command)) set = "-af volume=12";
        if (/fast/.test(command)) set = '-filter:a "atempo=1.63,asetrate=44100"';
        if (/fatter/.test(command)) set = '-filter:a "atempo=1.6,asetrate=22100"';
        if (/thin/.test(command)) set = '-filter:a "atempo=1.06,asetrate=44100*1.25"';
        if (/reverse/.test(command)) set = '-filter_complex "areverse"';
        if (/robot/.test(command))
          set =
            '-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"';
        if (/slow/.test(command)) set = '-filter:a "atempo=0.7,asetrate=44100"';
        if (/soft/.test(command)) set = '-filter:a "atempo=1.1,asetrate=44100"';
        if (/chipmunk/.test(command))
          set = '-filter:a "atempo=0.5,asetrate=65100"';

        if (!set) return ctx.reply("❌ 🕷️ Unknown effect 🩸");

        let tmpPath = join(process.cwd(), "tmp");
        if (!existsSync(tmpPath)) mkdirSync(tmpPath);

        let ran = getRandom(".mp3");
        let filename = join(tmpPath, ran);

        // 📌 هات الملف سواء voice أو audio
        const voiceFile = ctx.message.reply_to_message
          ? (ctx.message.reply_to_message.voice
              ? ctx.message.reply_to_message.voice.file_id
              : ctx.message.reply_to_message.audio.file_id)
          : (ctx.message.voice
              ? ctx.message.voice.file_id
              : ctx.message.audio.file_id);

        const fileLink = await ctx.telegram.getFileLink(voiceFile);

        // تحميل الملف
        const { default: fetch } = await import("node-fetch");
        const res = await fetch(fileLink.href);
        const arrayBuffer = await res.arrayBuffer();
        const inputFile = join(tmpPath, getRandom(".ogg"));
        writeFileSync(inputFile, Buffer.from(arrayBuffer));

        // تشغيل ffmpeg
        exec(`ffmpeg -i "${inputFile}" ${set} "${filename}"`, async (err) => {
          unlinkSync(inputFile);
          if (err) {
            console.error("FFmpeg Error:", err);
            return ctx.reply("❌ 🕷️ Error while processing audio 🩸");
          }

          let buff = readFileSync(filename);
          if (buff.length < 1000) {
            return ctx.reply("❌ 🕷️ Output file too small or invalid 🩸");
          }

          await ctx.replyWithAudio(
            { source: buff },
            { title: `🕷️ Effect ${command} 🩸` }
          );

          setTimeout(() => {
            if (existsSync(filename)) unlinkSync(filename);
          }, 3000);
        });
      } catch (e) {
        console.error(e);
        ctx.reply("⚠️ 🕷️ Unexpected error 🩸");
      }
    }
  );
}