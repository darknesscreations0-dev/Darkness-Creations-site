/* ============================================================
   /api/get-upload-url
   Called by the admin panel before uploading a large product file.
   1. Verifies the caller is logged in AND has role = 'admin' in Supabase
   2. Authorizes with Backblaze B2 using the secret keys (kept safely
      on the server, never sent to the browser)
   3. Returns a short-lived, one-time upload URL + token
   The browser then uploads the actual file straight to Backblaze —
   the file itself never passes through this function or Vercel,
   which avoids Vercel's own request size limits.
   ============================================================ */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { accessToken, fileName } = req.body || {};
    if (!accessToken) return res.status(401).json({ error: 'Missing access token — please log in again.' });
    if (!fileName) return res.status(400).json({ error: 'Missing fileName.' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://sqayzhsybgfgyrnpwxyn.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_t-_OryiioljtSOGH985nAw_z8MJ2wk4';

    // 1. Confirm this is a real, logged-in Supabase user
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Your session has expired — please log in again.' });
    const user = await userRes.json();

    // 2. Confirm that user's role is admin (uses the same RLS rule as the rest of the site)
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      { headers: { Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey } }
    );
    const profileData = await profileRes.json();
    const role = profileData && profileData[0] && profileData[0].role;
    if (role !== 'admin') return res.status(403).json({ error: 'Not authorized as admin.' });

    // 3. Authorize with Backblaze using the secret keys (never exposed to the browser)
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APP_KEY;
    const bucketName = process.env.B2_BUCKET_NAME;
    if (!keyId || !appKey || !bucketName) {
      return res.status(500).json({ error: 'Server storage is not configured yet (missing B2 environment variables).' });
    }

    const authString = Buffer.from(`${keyId}:${appKey}`).toString('base64');
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { Authorization: `Basic ${authString}` },
    });
    if (!authRes.ok) {
      const errText = await authRes.text();
      return res.status(500).json({ error: 'Backblaze authorization failed: ' + errText });
    }
    const authData = await authRes.json();

    // 4. Look up the bucket's ID from its name
    const listRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: { Authorization: authData.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: authData.accountId, bucketName }),
    });
    const listData = await listRes.json();
    const bucket = listData.buckets && listData.buckets[0];
    if (!bucket) return res.status(500).json({ error: `Bucket "${bucketName}" not found on this Backblaze account.` });

    // 5. Get a one-time upload URL + token for that bucket
    const uploadUrlRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: { Authorization: authData.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketId: bucket.bucketId }),
    });
    const uploadUrlData = await uploadUrlRes.json();

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `files/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

    res.status(200).json({
      uploadUrl: uploadUrlData.uploadUrl,
      uploadAuthToken: uploadUrlData.authorizationToken,
      fileName: path,
      bucketName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
};
