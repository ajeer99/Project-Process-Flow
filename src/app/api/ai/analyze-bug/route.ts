import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30; // 30 seconds max

export async function POST(req: Request) {
    try {
        const { prompt, context } = await req.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Configuration Error", details: "API Key missing." }), { status: 500 });
        }

        // We give the AI some context about the available project/modules if possible
        const systemPrompt = `You are a professional Senior QA Engineer.
Your task is to take a short, informal bug description from a user and translate it into a formal, highly detailed bug report ticket.

Extract or infer the following to the best of your ability based on the provided text:
- title: A concise, professional title.
- expectedResult: What should have happened normally.
- actualResult: What went wrong according to the user.
- severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" (guess based on the described impact).
- stepsToRepro: A numbered list of steps to reproduce the issue (infer reasonable steps if they are missing).
- moduleId: (Optional) The ID of the module that best matches the description, chosen ONLY from the Known Available Entities.
- subModuleId: (Optional) The ID of the sub-module that best matches the description, chosen ONLY from the Known Available Entities.

User Prompt:
"${prompt}"

Known Available Entities Context (if any):
${context || 'None Provided'}
`;

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const body = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [{
                parts: [{ text: "Generate the formal bug report based on this prompt: " + prompt }]
            }],
            generationConfig: {
                temperature: 0.2,
                response_mime_type: "application/json",
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

        const object = JSON.parse(textContent);

        return new Response(JSON.stringify(object), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("AI Generation Error Stack:", error.stack || error);
        return new Response(JSON.stringify({ error: "Failed to generate bug report.", details: error?.message || String(error) }), { status: 500 });
    }
}
