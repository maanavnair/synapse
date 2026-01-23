"use client";

import useProject from "@/hooks/use-project";
import React, { useState, useRef, useEffect, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Role = "user" | "assistant";

interface ChatMessage {
    id: string;
    role: Role;
    content: string;
}

const ChatMainContent: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { setProjectId, project, projectId } = useProject();
    const selectedProject = project;
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const searchParams = useSearchParams();

    // Handle incoming question from URL parameter
    useEffect(() => {
        const questionParam = searchParams.get("q");
        if (questionParam) {
            setInput(questionParam);
        }
    }, [searchParams]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:8000/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: userMessage.content,
                    projectId: project?.id,
                }),
            });

            interface QueryResponse {
                answer?: string;
                [key: string]: unknown;
            }
            const data = (await res.json()) as unknown as QueryResponse;
            console.log(data);

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.answer ?? "No response from model.",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            console.log(err);

            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    "⚠️ Something went wrong while talking to the AI. Please try again.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    if (!projectId) alert("No project selected");

    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            {/* Main chat area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
                {messages.length === 0 && !isLoading && (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-3">
                            <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                RAG Chatbot
                            </p>
                            <p className="mt-1 text-sm text-foreground">
                                Ask me anything about your indexed docs / repo.
                            </p>
                        </div>

                        <div className="mt-4 grid w-full max-w-xl gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setInput("Summarise this repository and its modules.")
                                }
                                className="rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-accent transition-colors"
                            >
                                🔍 Overview of the codebase
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setInput(
                                        "Where is the database connection configured in this project?",
                                    )
                                }
                                className="rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-accent transition-colors"
                            >
                                🗂 Find specific logic
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setInput(
                                        "Explain how authentication works in this repository.",
                                    )
                                }
                                className="rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-accent transition-colors"
                            >
                                🔐 Explain a feature
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setInput(
                                        "Suggest refactors or improvements for this project’s architecture.",
                                    )
                                }
                                className="rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-accent transition-colors"
                            >
                                🛠 Refactor / improvements
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm md:max-w-[70%] md:px-4 md:py-3 ${msg.role === "user"
                                    ? "rounded-br-sm bg-primary text-primary-foreground"
                                    : "rounded-bl-sm border border-border bg-card text-foreground"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-sm md:px-4 md:py-3">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 delay-150" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 delay-300" />
                                <span className="ml-2 text-xs text-muted-foreground">
                                    Thinking with your docs…
                                </span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input area */}
            <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
                <form onSubmit={handleSubmit} className="flex items-center justify-center gap-2 md:gap-3">
                    <div className="flex-1 items-center justify-center">
                        <div className="rounded-2xl border border-input bg-card px-3 py-2 md:px-4 md:py-2.5">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask something about your repo / documents…"
                                className="max-h-32 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="inline-flex h-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground px-3 text-xs font-medium shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? "Sending..." : "Send"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ChatMain: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="flex h-full items-center justify-center bg-background">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        }>
            <ChatMainContent />
        </Suspense>
    );
};

export default ChatMain;