/* ============================================================
   /api/setup-cors  (visit once in a browser, then you're done)
   Backblaze's simple web UI CORS options only cover downloading
   files, not uploading. This calls Backblaze's real API to set a
   proper CORS rule that allows the admin panel to upload files
   directly from the browser. Safe to run more than once.
   ============================================================ */

module.exports = async function handler(req, res) {
  try {
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APP_KEY;
    const bucketName = process.env.B2_BUCKET_NAME;
    if (!keyId || !appKey || !bucketName) {
      return res.status(500).send('Missing B2 environment variables.');
    }

    const authString = Buffer.from(`${keyId}:${appKey}`).toString('base64');
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { Authorization: `Basic ${authString}` },
    });
    if (!authRes.ok) return res.status(500).send('Backblaze auth failed: ' + (await authRes.text()));
    const authData = await authRes.json();

    const listRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: { Authorization: authData.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: authData.accountId, bucketName }),
    });
    const listData = await listRes.json();
    const bucket = listData.buckets && listData.buckets[0];
    if (!bucket) return res.status(500).send(`Bucket "${bucketName}" not found.`);

    const updateRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_update_bucket`, {
      method: 'POST',
      headers: { Authorization: authData.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: authData.accountId,
        bucketId: bucket.bucketId,
        corsRules: [
          {
            corsRuleName: 'allowDarknessAdminUploads',
            allowedOrigins: [
              'https://darknesscreations0-dev.github.io',
              'https://darkness-creations-site.vercel.app',
            ],
            allowedOperations: [
              'b2_upload_file',
              'b2_upload_part',
              'b2_download_file_by_name',
              'b2_download_file_by_id',
              's3_head',
              's3_put',
              's3_get',
            ],
            allowedHeaders: ['authorization', 'x-bz-file-name', 'x-bz-content-sha1', 'content-type'],
            exposeHeaders: ['x-bz-content-sha1', 'x-bz-file-id'],
            maxAgeSeconds: 3600,
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return res.status(500).send('Failed to update CORS rules: ' + errText);
    }

    res.status(200).send('✅ Success — CORS rules updated. Uploads from your admin panel should now work. You can close this tab.');
  } catch (err) {
    res.status(500).send('Unexpected error: ' + (err.message || err));
  }
};
