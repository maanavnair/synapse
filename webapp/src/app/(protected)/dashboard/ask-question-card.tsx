"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Sparkles, ArrowRight } from "lucide-react";

const AskQuestionCard = () => {
    const [question, setQuestion] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        // Navigate to QA page with the question as a URL parameter
        router.push(`/qa?q=${encodeURIComponent(question.trim())}`);
    };

    return (
        <Card className="group relative w-full overflow-hidden border-border bg-linear-to-br from-primary/5 via-background to-background shadow-lg transition-all duration-300 hover:shadow-xl">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <CardContent className="relative p-6">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                        <MessageCircle className="size-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                            Ask a Question
                            <Sparkles className="size-4 text-primary animate-pulse" />
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Get instant answers about your codebase
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="relative">
                        <input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="What would you like to know?"
                            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={!question.trim()}
                        className="cursor-pointer group/btn w-full transition-all duration-200"
                        size="lg"
                    >
                        <span>Ask Question</span>
                        <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default AskQuestionCard;