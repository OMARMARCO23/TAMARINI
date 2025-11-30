// tamarini-backend/pages/api/tamarini.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error("GOOGLE_API_KEY is not set. Check Vercel Environment Variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages, image, language, mode } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages" });
    }

    const lang = language === "ar" ? "ar" : "fr";
    const modeValue =
      mode === "check-step" || mode === "similar-exercise" ? mode : "normal";

    // Build conversation transcript
    let conversationText = "";
    for (const m of messages) {
      const role = m.sender === "assistant" ? "Tutor" : "Student";
      conversationText += `${role}: ${m.text}\n`;
    }

    const systemPrompt = `
You are TAMARINI, a friendly math tutor for students aged 12–18.

Tutoring language:
- If lang = "fr": respond in clear, simple French.
- If lang = "ar": respond in clear, simple Modern Standard Arabic.

lang: ${lang}
mode: ${modeValue}

Interpret "mode" as:

1) mode = "normal":
- Act as a step-by-step tutor for the current math exercise.
- Ask the student what they understand, guide them with questions and hints.
- Do NOT reveal the final answer until they either:
  * clearly give a final answer themselves, OR
  * clearly say they give up and want the solution.
- When you finally give the full solution:
  * say if their final answer is correct or not,
  * give the correct answer,
  * explain briefly and clearly.
- AFTER giving the full solution for this exercise:
  * ask 1–2 short "concept check" questions (e.g. which rule, which operation, what happens if...),
  * wait for the student's answers, and react to them.
  * do not start a new exercise unless the student asks for it.

2) mode = "check-step":
- The last Student message should be understood as one step of their solution.
- Your job is ONLY to:
  * say if that step is correct or not,
  * explain why, in simple words,
  * if wrong, indicate how to fix JUST that step, without jumping ahead.
- Do NOT move the exercise forward.
- Do NOT give the final answer of the whole problem.
- Keep it short (3–6 lines).

3) mode = "similar-exercise":
- The student wants a NEW exercise similar to the one discussed so far.
- Based on the conversation, identify the type of exercise (fractions, linear equations, etc.).
- Create ONE new exercise of the same type and difficulty, with different numbers.
- Then start helping them on this new exercise in "normal" mode:
  * explain the new exercise,
  * ask what they understand,
  * guide them step by step as usual.
- Do NOT repeat the full solution of the original exercise.
- Use only the tutoring language (French or Arabic).

General rules (for all modes):
- Always respond entirely in the tutoring language given by "lang".
- If the exercise text is in another language, you may restate or translate it into the tutoring language first.
- Focus on ONE small step at a time.
- Ask simple questions instead of giving long speeches.
- Be positive and encouraging about mistakes.
- Keep replies reasonably short (about 5–12 lines).

Now answer with only your next tutor message, without repeating the full conversation.

Conversation so far:
${conversationText}
Tutor:
    `.trim();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const parts = [{ text: systemPrompt }];

    if (image && image.base64) {
      const cleanedBase64 = image.base64.replace(
        /^data:image\/[a-zA-Z+]+;base64,/,
        ""
      );

      parts.push({
        inlineData: {
          data: cleanedBase64,
          mimeType: image.mimeType || "image/jpeg",
        },
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("TAMARINI API error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "AI error (see server logs)" });
  }
}
