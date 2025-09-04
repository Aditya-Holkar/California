/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();

    // Support both 'message' and 'messages' for backward compatibility
    let messageText = "";

    if (body.message) {
      // If using the single message format
      messageText = body.message;
    } else if (body.messages && Array.isArray(body.messages)) {
      // If using the messages array format, extract the last user message
      const userMessages = body.messages.filter(
        (msg: any) => msg.role === "user"
      );
      messageText =
        userMessages.length > 0
          ? userMessages[userMessages.length - 1].content
          : "";
    }

    // Validate the message
    if (!messageText || messageText.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

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
      "wcab",
      "california",
      "ca ",
      "work injury",
      "job injury",
      "occupational",
      "workers comp",
      "workman comp",
      "workmen comp",
      "industrial injury",
    ];

    const lowerMessage = messageText.toLowerCase();
    const isRelevant = relevantTopics.some((topic) =>
      lowerMessage.includes(topic)
    );

    if (!isRelevant) {
      return NextResponse.json({
        response:
          "I'm sorry, but I'm specifically designed to answer questions about worker's compensation and employment law in California. Please ask a question related to these topics. For example, you could ask about workplace injuries, claims processes, employer responsibilities, or employee rights under California law.",
      });
    }

    // Check if API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OpenRouter API key is missing");
      return NextResponse.json(
        { error: "Server configuration error - API key not found" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": req.headers.get("origin") || "https://yourdomain.com",
          "X-Title": "WCAB Assistant",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant specializing in California worker's compensation and employment law. Provide detailed, step-by-step information about these topics with a focus on California-specific regulations. Always mention that you're providing general information and recommend consulting with a qualified attorney for specific legal advice. If asked about other subjects, politely decline to answer and explain that you only handle California worker's compensation and employment law questions.",
            },
            {
              role: "user",
              content: messageText,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);

      // Provide a user-friendly error message
      return NextResponse.json(
        {
          error:
            "Sorry, I'm experiencing technical difficulties. Please try again shortly.",
          details: `API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Parse the response
    const data = await response.json();

    // Validate the response structure
    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error("Invalid response structure from OpenRouter:", data);
      return NextResponse.json(
        { error: "Received an invalid response from the AI service" },
        { status: 500 }
      );
    }

    const assistantResponse = data.choices[0].message.content;

    return NextResponse.json({
      response: assistantResponse,
      // Include a disclaimer
      disclaimer:
        "This information is provided for general educational purposes only and does not constitute legal advice. For specific legal concerns, please consult with a qualified attorney.",
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    // Handle different types of errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "An internal server error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
