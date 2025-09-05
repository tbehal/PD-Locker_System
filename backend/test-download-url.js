#!/usr/bin/env node

// Test script for OneDrive download URL approach
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');

async function testDownloadUrl() {
    console.log('🔍 Testing OneDrive Download URL...\n');
    
    try {
        console.log('🔐 Getting access token...');
        const tokenUrl = `https://login.microsoftonline.com/${process.env.GRAPH_TENANT_ID}/oauth2/v2.0/token`;
        const body = qs.stringify({
            client_id: process.env.GRAPH_CLIENT_ID,
            client_secret: process.env.GRAPH_CLIENT_SECRET,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials'
        });

        const tokenRes = await axios.post(tokenUrl, body, { 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' } 
        });
        const token = tokenRes.data.access_token;
        console.log('✅ Token obtained successfully!\n');
        
        // Try to get a fresh download URL
        console.log('📁 Getting fresh download URL...');
        const driveId = process.env.GRAPH_DRIVE_ID;
        const itemId = process.env.GRAPH_ITEM_ID;
        
        try {
            const fileInfoResponse = await axios.get(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const downloadUrl = fileInfoResponse.data['@microsoft.graph.downloadUrl'];
            if (downloadUrl) {
                console.log('✅ Fresh download URL obtained!\n');
                console.log('🧪 Testing file download...');
                
                const fileResponse = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer'
                });
                
                console.log(`✅ File downloaded successfully! Size: ${fileResponse.data.length} bytes`);
                
                // Check if it's an Excel file
                const buffer = Buffer.from(fileResponse.data);
                if (buffer.length > 100 && buffer.toString('hex', 0, 4) === '504b0304') {
                    console.log('✅ Valid Excel file detected (ZIP format)');
                    console.log('\n🎉 OneDrive integration is working!');
                    console.log('Your application will now read Excel data from OneDrive.');
                } else {
                    console.log('⚠️  File may not be a valid Excel file');
                    console.log('First 16 bytes (hex):', buffer.toString('hex', 0, 16));
                }
                
            } else {
                console.log('❌ No download URL found in file info');
            }
            
        } catch (fileInfoError) {
            console.log('❌ Could not get file info:', fileInfoError.response?.status, fileInfoError.response?.data?.error?.message || fileInfoError.message);
            
            if (fileInfoError.response?.status === 401) {
                console.log('\n🔧 The issue is permissions. Your app needs:');
                console.log('1. Files.Read.All ✅ (you have this)');
                console.log('2. Sites.Read.All ❌ (you need this)');
                console.log('3. Sites.ReadWrite.All ❌ (you need this)');
                console.log('\n💡 Quick fix: Go to Azure Portal and add the missing permissions!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

testDownloadUrl();


