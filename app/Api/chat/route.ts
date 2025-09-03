// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Check if the question is related to worker's compensation or employment law
    const relevantTopics = [
      "worker compensation",
      "workers compensation",
      "work comp",
      "workplace injury",
      "employment law",
      "labor law",
      "workplace safety",
      "osha",
      "wage",
      "discrimination",
      "harassment",
      "wrongful termination",
      "benefits",
      "disability",
      "rehabilitation",
      "claim",
      "insurance",
      "employer liability",
    ];

    const lowerMessage = message.toLowerCase();
    const isRelevant = relevantTopics.some((topic) =>
      lowerMessage.includes(topic)
    );

    if (!isRelevant) {
      return NextResponse.json({
        response:
          "I'm sorry, but I'm specifically designed to answer questions about worker's compensation and employment law only. Please ask a question related to these topics.",
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": req.headers.get("origin") || "",
          "X-Title": "WCAB Assistant",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant specializing in worker's compensation and employment law. Provide detailed, step-by-step information about these topics. If asked about other subjects, politely decline to answer and explain that you only handle worker's compensation and employment law questions.",
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
