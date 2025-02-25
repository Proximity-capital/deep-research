"use client";

import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Card, CardContent } from "@/app/components/card";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [currentFollowUp, setCurrentFollowUp] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [sessionId] = useState(uuidv4());

  console.log(input)
  console.log(sessionId)

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);

    try {
      const res = await axios.post("http://localhost:8000/chat/", {
        query: input,
        userAnswer: "",
        sessionId,
      });

      if (res.data.followUp) {
        // **Step 1: Show the first follow-up question**
        setCurrentFollowUp(res.data.followUp);
      } else {
        // **Step 5: Show final response**
        setMessages((prev) => [...prev, { role: "bot", text: res.data.response }]);
        setCurrentFollowUp(null);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "Error processing request." }]);
    }

    setInput("");
  };

  const sendFollowUpAnswer = async () => {
    if (!input.trim() || !currentFollowUp) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);

    try {
      const res = await axios.post("http://localhost:8000/chat/", {
        query: messages[0]?.text || "",
        userAnswer: input,
        sessionId,
      });

      if (res.data.followUp) {
        // **Step 3: Show the next follow-up question**
        setCurrentFollowUp(res.data.followUp);
      } else {
        // **Step 5: Show final response**
        setMessages((prev) => [...prev, { role: "bot", text: res.data.response }]);
        setCurrentFollowUp(null);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "Error processing request." }]);
    }

    setInput("");
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      <Card>
        <CardContent className="p-4">
          <div className="h-80 overflow-y-auto border p-4 rounded-lg">
            {messages.map((msg, i) => (
              <div key={i} className={`p-2 my-2 rounded-lg ${msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"}`}>
                {msg.text}
              </div>
            ))}
          </div>

          {currentFollowUp ? (
            <div className="mt-4">
              <h3>Follow-up Question:</h3>
              <p>{currentFollowUp}</p>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Your answer..."
              />
              <Button onClick={sendFollowUpAnswer} className="mt-2">Submit Answer</Button>
            </div>
          ) : (
            <div className="flex items-center mt-4">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something..." />
              <Button onClick={sendMessage} className="ml-2">Send</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}