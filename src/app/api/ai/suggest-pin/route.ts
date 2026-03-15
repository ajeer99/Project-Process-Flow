import prisma from '@/app/lib/prisma';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { bugId } = await req.json();

        if (!bugId) {
            return new Response(JSON.stringify({ error: "Bug ID is required" }), { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "API Key missing." }), { status: 500 });
        }

        const bug = await prisma.bug.findUnique({
            where: { id: bugId },
            include: {
                module: { select: { name: true, project: { select: { name: true } } } },
                developer: { select: { name: true } },
                tester: { select: { name: true } },
                developerGroup: { select: { name: true } },
                testerGroup: { select: { name: true } },
                comments: { select: { text: true, user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } }
            }
        });

        if (!bug) {
            return new Response(JSON.stringify({ error: "Bug not found" }), { status: 404 });
        }

        const bugContext = `
Title: ${bug.title}
Status: ${bug.status}
Severity: ${bug.severity}
Project/Module: ${bug.module.project.name} / ${bug.module.name}
Reported by: ${bug.tester?.name || bug.testerGroup?.name || 'Unknown'}
Assigned to: ${bug.developer?.name || bug.developerGroup?.name || 'Unassigned'}

Description:
${bug.description}

Recent Comments:
${bug.comments.map(c => `[${c.user.role}] ${c.user.name}: ${c.text}`).join('\n')}
        `;

        const systemPrompt = `You are a Senior QA Engineer analyzing a bug ticket.
Read the bug description and comments. Write a VERY CONCISE 1-to-2 sentence summary of the current root cause, status, or next steps to be pinned at the top of the chat.
Return ONLY valid JSON like this: {"suggestion": "The suggested text here."}
Do NOT use Markdown formatting in the response block outside the JSON.`;

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const body = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [{
                parts: [{ text: "Generate the pinned summary note for this bug details: \n" + bugContext }]
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
            return new Response(JSON.stringify({ error: "Google AI API Error", details: errorText }), { status: 500 });
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
        console.error("AI Pin Generation Error Stack:", error.stack || error);
        return new Response(JSON.stringify({ error: "Failed to generate pin.", details: error?.message || String(error) }), { status: 500 });
    }
}
