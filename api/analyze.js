export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resume, jobDesc } = req.body;

  if (!resume || !jobDesc) {
    return res.status(400).json({ error: 'Resume and job description are required' });
  }

  const prompt = `You are an expert resume coach and recruiter. Analyze the resume against the job description below.

Respond ONLY with a valid JSON object, no extra text, no markdown, no code blocks. Use this exact structure:
{
  "score": <number 1-10>,
  "scoreTitle": "<one short phrase like Strong Match or Needs Work>",
  "scoreSummary": "<one sentence overall verdict>",
  "strengths": ["<point 1>", "<point 2>", "<point 3>"],
  "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "improvements": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "overallSummary": "<2-3 sentence detailed summary of fit and recommendation>"
}

RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}`;

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}