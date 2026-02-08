
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/services/api";

export default function Chatbot() {
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([
        { role: "assistant", content: "Hello! I am your trading assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        api.getMe().then(setUserProfile).catch(console.error);
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", content: input }];
        setMessages(newMessages);
        setInput("");

        // Simulate AI response with context
        setTimeout(() => {
            let contextInfo = "";
            if (userProfile) {
                contextInfo = `(Context: Experience=${userProfile.trading_experience}, Risk=${userProfile.risk_score}/10) `;
            }

            const response = {
                role: "assistant",
                content: `${contextInfo}I received your message: "${input}". This is a placeholder for the AI response.`
            };
            setMessages([...newMessages, response]);
        }, 1000);
    };

    return (
        <div className="p-8 h-full flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>

            <Card className="flex-1 flex flex-col h-[600px]">
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                    <ScrollArea className="flex-1 pr-4">
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about stocks, portfolio, or market trends..."
                        />
                        <Button onClick={handleSend}>Send</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
