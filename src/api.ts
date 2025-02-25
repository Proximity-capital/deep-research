import express, {Request, Response} from "express";
import cors from "cors";
import { deepResearch, writeFinalReport } from "./deep-research";
import { generateFeedback } from "./feedback";

const app = express();
app.use(cors());
app.use(express.json());

interface ChatState {
    query: string;
    followUps: string[];
    answers: string[];
}

// Store chat states per user session (Simple implementation - should use a database in production)
const chatSessions = new Map<string, ChatState>();

app.post("/chat/", async (req: Request, res:Response) => {
    try {
        const { query, userAnswer, sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: "sessionId is required." });
        }

        let session = chatSessions.get(sessionId);

        if (!session) {
            // **Step 1: Start a new session and get the follow-up questions**
            const followUps = await generateFeedback(query);
            chatSessions.set(sessionId, { query, followUps, answers: [] });

            return res.json({ followUp: followUps[0], questionIndex: 0 });
        }

        // **Step 2: Process user answers one by one**
        session.answers.push(userAnswer);
        const nextQuestionIndex = session.answers.length;

        if (nextQuestionIndex < session.followUps.length) {
            return res.json({ followUp: session.followUps[nextQuestionIndex], questionIndex: nextQuestionIndex });
        }

        // **Step 3: Once all follow-ups are answered, run deep research**
        const combinedQuery = `Initial query: ${session.query}\nFollow-up questions and answers:\n${session.followUps.map((q, i) => `Q: ${q}\nA: ${session.answers[i]}`).join("\n")}`;

        const { learnings, visitedUrls } = await deepResearch({
            query: combinedQuery,
            breadth: 4,
            depth: 2,
            onProgress: (progress) => console.log(progress),
        });

        const finalReport = await writeFinalReport({
            prompt: session.query,
            learnings,
            visitedUrls,
        });
        
        chatSessions.delete(sessionId); // **Clear session after completion**
        return res.json({ response: finalReport, visitedUrls });
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(8000, () => {
    console.log("Server running on http://localhost:8000");
});
