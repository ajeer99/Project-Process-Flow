import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30; // 30 seconds max

export async function POST(req: Request) {
    try {
        const { text, type } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "Text is required" }), { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Configuration Error", details: "API Key missing." }), { status: 500 });
        }

        let systemPrompt = "You are a helpful AI assistant integrated into a development team's chat application. Your job is to improve the user's message.";
        
        if (type === 'polish') {
            systemPrompt += " The user wants you to 'polish' their text. Make it sound more professional, clear, and grammatically correct. Do not change the core meaning. Only return the final polished text.";
        } else if (type === 'suggest') {
            systemPrompt += " The user wants you to expand their short thought into a polite, complete sentence or short paragraph suitable for a work chat. Only return the final suggested text.";
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const body = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [{
                parts: [{ text: "Original Text: " + text }]
            }],
            generationConfig: {
                temperature: 0.7,
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Gemini API Error:", errorText);
            const status = res.status === 404 || res.status === 400 ? 400 : 500;
            return new Response(JSON.stringify({
                error: "Google AI API Error",
                details: errorText
            }), { status });
        }

        const data = await res.json();
        const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error("No text content returned from Google API");
        }

        return new Response(JSON.stringify({ result: textContent.trim() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("AI Generation Error Stack:", error.stack || error);
        return new Response(JSON.stringify({ error: "Failed to process text.", details: error?.message || String(error) }), { status: 500 });
    }
}
