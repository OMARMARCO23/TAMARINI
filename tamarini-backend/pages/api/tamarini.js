// tamarini-backend/pages/api/tamarini.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { messages, image } = req.body || {};
    // messages: [{ sender: "user" | "assistant", text: string }]
    // image: { base64: string, mimeType: string } | undefined

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages" });
    }

    // Build a simple text transcript for Gemini
    let conversationText = "";
    for (const m of messages) {
      const role = m.sender === "assistant" ? "Tutor" : "Student";
      conversationText += `${role}: ${m.text}\n`;
    }

    const systemPrompt = `
You are TAMARINI, a friendly math tutor for students aged 12–18.

You will see the conversation between you and the student, and possibly an image with the exercise.

Your goals:
1. Understand the math exercise from the image and/or student text.
2. Ask the student to explain, in their own words, what the problem is asking and what they already know or tried.
3. Guide them step by step using questions and hints, so they do most of the thinking and calculations.
4. Do NOT reveal the final answer until the student has given their own final answer or clearly says they give up and want the solution.
5. When they finally give their answer (or give up), then:
   - Say if their answer is correct or not.
   - Give the correct answer.
   - Explain the solution clearly and briefly.

Behavior rules:
- At the very start of the conversation:
  - Identify what the exercise is about (using the image if provided).
  - Ask the student to describe in their own words what the question is asking, and what they understand so far.
- During problem solving:
  - Focus on ONE small step at a time.
  - Ask simple questions: which formula to use, what to compute next, what value to plug in, etc.
  - If the student is stuck, give a clearer hint, but still leave them something to do.
- Delaying the final answer:
  - If the student asks for the answer immediately, encourage them to try at least one step.
  - Only give the final numeric/algebraic result after:
      * They write something like "My final answer is ..." or "I think the answer is ...", OR
      * They clearly say they give up and want the solution.
- If the problem is NOT about school math for ages 12–18, politely say you currently only help with math.
- Always use simple language suitable for 12–18 year olds.
- Be positive and encouraging about mistakes.
- Keep replies reasonably short (about 5–12 lines).

Now answer with only your next tutor message, without repeating the full conversation.

Conversation so far:
${conversationText}
Tutor:
    `.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build parts for text + optional image
    const parts = [{ text: systemPrompt }];

    if (image && image.base64) {
      // If base64 has a "data:image/..." prefix, strip it
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
    return res.status(500).json({ error: "AI error" });
  }
}
