const { head } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  const blobPath = 'scripts/' + todayKey + '.txt';
  try {
    const blobMeta = await head(blobPath, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const scriptRes = await fetch(blobMeta.url);
    if (!scriptRes.ok) return res.status(404).json({ error: 'Script not readable', date: todayKey });
    const script = await scriptRes.text();
    return res.status(200).json({ available: true, date: todayKey, script, generatedAt: blobMeta.uploadedAt });
  } catch (err) {
    return res.status(200).json({ available: false, date: todayKey, message: 'No script yet for today. Visit /api/generate-script to trigger generation.' });
  }
};
