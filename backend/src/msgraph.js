const axios = require('axios');
const qs = require('qs');
const config = require('./config');

async function getAppToken() {
    if (!config.graph.clientId || !config.graph.clientSecret || !config.graph.tenantId) {
        throw new Error('Missing Graph OAuth client credentials in config');
    }

    const tokenUrl = `https://login.microsoftonline.com/${config.graph.tenantId}/oauth2/v2.0/token`;
    const body = qs.stringify({
        client_id: config.graph.clientId,
        client_secret: config.graph.clientSecret,
        scope: config.graph.scopes || 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
    });

    const res = await axios.post(tokenUrl, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return res.data.access_token;
}

async function downloadFile(driveId, itemId, downloadUrl) {
    const token = await getAppToken();
    if (downloadUrl) {
        const r = await axios.get(downloadUrl, { responseType: 'arraybuffer', headers: { Authorization: `Bearer ${token}` } });
        return Buffer.from(r.data);
    }

    if (driveId && itemId) {
        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`;
        const r = await axios.get(url, { responseType: 'arraybuffer', headers: { Authorization: `Bearer ${token}` } });
        return Buffer.from(r.data);
    }

    throw new Error('No Graph download URL or drive/item configured');
}

// Function to upload/update a file in OneDrive
async function uploadFile(driveId, itemId, buffer) {
    const token = await getAppToken();
    
    try {
        console.log('Uploading file to OneDrive...', { driveId, itemId, bufferSize: buffer.length });
        
        // Use the Microsoft Graph API to upload file content
        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`;
        
        const response = await axios.put(url, buffer, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });
        
        console.log('✅ File uploaded successfully to OneDrive!');
        return response.data;
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

module.exports = { getAppToken, downloadFile, uploadFile };