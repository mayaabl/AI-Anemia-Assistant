import { ChatInput } from "@/components/custom/chatinput";
import {
  PreviewMessage,
  ThinkingMessage,
} from "../../components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { useState } from "react";
import { message } from "../../interfaces/interfaces";
import { Header } from "@/components/custom/header";
import { v4 as uuidv4 } from "uuid";

export function Chat() {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([
    {
      content:
        "Hello! I am the Anemia AI Assistant. Enter your lab results for AI-based analysis.",
      role: "assistant",
      id: uuidv4(),
    },
  ]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit(text?: string) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // Access API key from environment variable
    if (!apiKey || isLoading) return;

    const messageText = text || question;
    setIsLoading(true);

    const traceId = uuidv4();
    setMessages((prev) => [
      ...prev,
      { content: messageText, role: "user", id: traceId },
    ]);
    setQuestion("");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              { role: "system", content: "You are an anemia AI assistant." },
              { role: "user", content: messageText },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const botReply =
        data.choices[0]?.message?.content ||
        "I'm sorry, I didn't understand that.";

      setMessages((prev) => [
        ...prev,
        { content: botReply, role: "assistant", id: uuidv4() },
      ]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          content: "An error occurred. Please try again.",
          role: "assistant",
          id: uuidv4(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <Header />
      <div
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
        ref={messagesContainerRef}
      >
        {/* Custom Welcome Section with Title & Logo */}
        {messages.length === 1 && messages[0].role === "assistant" && (
          <div className="flex flex-col items-center text-gray-500 dark:text-gray-400 p-4">
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Welcome to Anemia AI Assistant
            </h1>
            <img
              src="/anemia-logo.png"
              alt="Anemia AI Assistant Logo"
              className="w-16 h-16 mt-2"
            />
          </div>
        )}

        {messages.map((message, index) => (
          <PreviewMessage key={index} message={message} />
        ))}
        {isLoading && <ThinkingMessage />}
        <div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
        />
      </div>
      <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        <ChatInput
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
