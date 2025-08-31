/* eslint-disable react/no-unescaped-entities */
// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "../styles/Chat.module.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem("wcabChats");
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);

        // Set the most recent chat as current if available
        if (parsedChats.length > 0) {
          setCurrentChat(parsedChats[parsedChats.length - 1]);
        }
      } catch (e) {
        console.error("Failed to parse saved chats:", e);
      }
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("wcabChats", JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setChats((prev) => [...prev, newChat]);
    setCurrentChat(newChat);
    setInput("");
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the selectChat function

    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    setChats(updatedChats);

    // If we're deleting the current chat, clear it
    if (currentChat && currentChat.id === chatId) {
      setCurrentChat(
        updatedChats.length > 0 ? updatedChats[updatedChats.length - 1] : null
      );
    }

    // Update localStorage
    if (updatedChats.length === 0) {
      localStorage.removeItem("wcabChats");
    }
  };

  const updateChatTitle = (chatId: string, messages: Message[]) => {
    // Generate a title based on the first user message
    if (messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === "user");
      if (firstUserMessage) {
        const title =
          firstUserMessage.content.slice(0, 30) +
          (firstUserMessage.content.length > 30 ? "..." : "");

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? { ...chat, title, updatedAt: Date.now() }
              : chat
          )
        );

        return title;
      }
    }

    return "New Chat";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    const userMessage: Message = { role: "user", content: input };

    let updatedChat: Chat;

    if (currentChat) {
      // Add to existing chat
      updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage],
        updatedAt: Date.now(),
      };

      setCurrentChat(updatedChat);
      setChats((prev) =>
        prev.map((chat) => (chat.id === currentChat.id ? updatedChat : chat))
      );
    } else {
      // Create new chat
      updatedChat = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setCurrentChat(updatedChat);
      setChats((prev) => [...prev, updatedChat]);
    }

    setInput("");

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer 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",
            "HTTP-Referer": window.location.origin,
            "X-Title": "WCAB Assistant",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-r1-0528:free",
            messages: [
              {
                role: "system",
                content:
                  "You are a legal assistant specializing in California Workers' Compensation Appeals Board (WCAB) matters and employment law. Provide detailed, step-by-step guidance. Focus on California-specific regulations and procedures. Be precise and cite relevant laws when possible.",
              },
              ...updatedChat.messages,
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      // Update chat with assistant's response
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: Date.now(),
      };

      // Update title based on the first message if this is a new chat
      if (updatedChat.title === "New Chat") {
        finalChat.title = updateChatTitle(updatedChat.id, finalChat.messages);
      }

      setCurrentChat(finalChat);
      setChats((prev) =>
        prev.map((chat) => (chat.id === finalChat.id ? finalChat : chat))
      );
    } catch (err) {
      console.error("Error fetching response:", err);
      setError("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.container}>
      {/* Sidebar with chat history */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Chat History</h2>
          <button
            className={styles.newChatButton}
            onClick={createNewChat}
            title="Start new chat"
          >
            +
          </button>
        </div>

        <ul className={styles.chatList}>
          {chats.length === 0 ? (
            <li>No chats yet</li>
          ) : (
            [...chats].reverse().map((chat) => (
              <li
                key={chat.id}
                className={`${styles.chatItem} ${
                  currentChat?.id === chat.id ? styles.chatItemActive : ""
                }`}
                onClick={() => selectChat(chat.id)}
              >
                <div>
                  <div className={styles.chatPreview}>{chat.title}</div>
                  <div className={styles.chatDate}>
                    {formatDate(chat.updatedAt)}
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <button
                    className={`${styles.chatActionButton} ${styles.deleteButton}`}
                    onClick={(e) => deleteChat(chat.id, e)}
                    title="Delete chat"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Main chat area */}
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            California WCAB & Employment Law Assistant
          </h1>
          <p>
            Get detailed information about Workers' Compensation and Employment
            Law in California
          </p>
        </header>

        <div className={styles.chatContainer}>
          <div className={styles.messages}>
            {(!currentChat || currentChat.messages.length === 0) && (
              <div className={styles.emptyState}>
                <h2 className={styles.emptyStateTitle}>
                  Ask a question about California Workers' Compensation or
                  Employment Law
                </h2>
                <p>Examples:</p>
                <ul className={styles.emptyStateList}>
                  <li className={styles.emptyStateListItem}>
                    What steps should I take if I'm injured at work in
                    California?
                  </li>
                  <li className={styles.emptyStateListItem}>
                    How do I file a claim with the WCAB?
                  </li>
                  <li className={styles.emptyStateListItem}>
                    What are my rights as an employee in California?
                  </li>
                </ul>
              </div>
            )}

            {currentChat?.messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
              >
                <div
                  className={`${styles.messageContent} ${
                    message.role === "user"
                      ? styles.userMessageContent
                      : styles.assistantMessageContent
                  }`}
                >
                  {message.content
                    .split("\n")
                    .map((paragraph, i) =>
                      paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                    )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={`${styles.messageContent} ${styles.loading}`}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <div className={styles.inputContainer}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about California workers' comp or employment law..."
                disabled={isLoading}
                className={styles.input}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={styles.button}
              >
                {isLoading ? "Sending..." : "Ask"}
              </button>
            </div>
            <p className={styles.disclaimer}>
              This tool provides general information only, not legal advice. For
              specific legal concerns, consult with a qualified attorney.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
