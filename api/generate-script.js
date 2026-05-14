module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY env var not set' });
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Toronto', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayKey = now.toISOString().split('T')[0];
  const prompt = 'Today is ' + dateStr + '. Generate a 30-minute morning podcast script for Rob Flagg, Operations Manager at Atlas Engineered Products in Ontario Canada. Interests: Maple Leafs, NFL, AI, IPTV, country music, dog Harvey. Search web for real info. Segments: INTRO 2min, WEATHER 3min Orillia/Barrie Celsius, TOP NEWS 8min, SPORTS 6min Leafs+NFL, TECH-AI 4min, BUILDING INDUSTRY 3min, DAY AHEAD 2min. Spoken text only, no markdown, ~4000 words, start with: Good morning Rob!';
  try {
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ googleSearch: {} }], generationConfig: { temperature: 0.9, maxOutputTokens: 8192 } })
    });
    if (!geminiRes.ok) return res.status(500).json({ error: 'Gemini failed', detail: await geminiRes.text() });
    const data = await geminiRes.json();
    const script = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!script) return res.status(500).json({ error: 'No script', raw: data });
    const blob = await put('scripts/' + todayKey + '.txt', script, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'text/plain; charset=utf-8' });
    return res.status(200).json({ success: true, date: todayKey, wordCount: script.split(' ').length, blobUrl: blob.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
