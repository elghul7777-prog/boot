import fetch from "node-fetch";
import cheerio from "cheerio";

/**
 * ephoto360 effect generator
 * @param {string} url رابط التأثير
 * @param {string} text النص اللي هيتكتب
 * @returns {Promise<string>} رابط الصورة الناتجة
 */
export async function ephoto(url, text) {
  try {
    // فتح صفحة التأثير
    const getHtml = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0"
      }
    });
    const html = await getHtml.text();
    const $ = cheerio.load(html);

    // استخراج form
    const form = $("form").first();
    const action = form.attr("action");
    if (!action) throw new Error("لم يتم العثور على الفورم");

    // تجهيز البيانات (input hidden + النص)
    const formData = new URLSearchParams();
    form.find("input").each((i, el) => {
      const name = $(el).attr("name");
      const value = $(el).attr("value") || "";
      if (name) formData.append(name, value);
    });
    formData.append("text[]", text);

    // إرسال البيانات
    const submit = await fetch(action, {
      method: "POST",
      body: formData,
      headers: {
        "user-agent": "Mozilla/5.0",
        "content-type": "application/x-www-form-urlencoded"
      }
    });

    const resultHtml = await submit.text();
    const $$ = cheerio.load(resultHtml);

    // استخراج رابط الصورة
    const img = $$(".thumbnail img").attr("src");
    if (!img) throw new Error("فشل في استخراج الصورة");

    // بعض الصور بتيجي بدون دومين
    return img.startsWith("http") ? img : `https://en.ephoto360.com${img}`;
  } catch (e) {
    console.error("ephoto error:", e.message);
    throw new Error("❌ فشل إنشاء الصورة من ephoto360");
  }
}