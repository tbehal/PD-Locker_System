# OneDrive Integration Setup Guide

This guide will help you connect your NDECC Lab Station Availability Manager to OneDrive for accessing the Excel file remotely.

## 🚀 **Step 1: Azure App Registration**

### 1.1 Go to Azure Portal
- Visit: https://portal.azure.com
- Sign in with your Microsoft account

### 1.2 Create New App Registration
- Search for "App registrations" in the search bar
- Click "New registration"
- **Name**: `NDECC Lab Manager`
- **Supported account types**: Choose based on your needs
- **Redirect URI**: Leave blank for now
- Click "Register"

### 1.3 Get Application Credentials
- **Application (client) ID**: Copy this value 43676368-e473-4ce3-a6bb-3953776a1d68
- **Directory (tenant) ID**: Copy this value c5e6d5ad-576d-4fe9-968f-f64397cb996e

### 1.4 Create Client Secret
- Go to "Certificates & secrets"
- Click "New client secret"
- **Description**: `Lab Manager Secret`
- **Expires**: Choose appropriate expiration
- **Copy the secret value** (you won't see it again!) Mia8Q~fBJWIDRu96uNf-bi0nYXl4LnUtrJnSyc1Y

## 🔑 **Step 2: Configure API Permissions**

### 2.1 Add Microsoft Graph Permissions
- Go to "API permissions"
- Click "Add a permission"
- Select "Microsoft Graph"
- Choose "Application permissions"
- Add these permissions:
  - `Files.Read.All` (to read OneDrive files)
  - `Sites.Read.All` (to access SharePoint sites)

### 2.2 Grant Admin Consent
- Click "Grant admin consent for [Your Organization]"
- Confirm the permissions

## 📁 **Step 3: Get OneDrive File Information**

### 3.1 Upload Excel File to OneDrive
- Upload your `Test.xlsx` file to OneDrive
- Note the file location

### 3.2 Get Drive ID and Item ID
- **Option A**: Use Microsoft Graph Explorer
  - Go to: https://developer.microsoft.com/en-us/graph/graph-explorer
  - Sign in and run: `GET https://graph.microsoft.com/v1.0/me/drive`
  - Copy the `id` value (this is your drive ID)

- **Option B**: Use PowerShell
  ```powershell
  Connect-MgGraph
  Get-MgUserDrive -UserId "your-email@domain.com"
  ```

### 3.3 Get File Item ID
- In Graph Explorer, run:
  ```
  GET https://graph.microsoft.com/v1.0/me/drive/root:/Test.xlsx
  ```
- Copy the `id` value (this is your item ID)

## ⚙️ **Step 4: Configure Environment Variables**

### 4.1 Create .env File
Create a `.env` file in your `backend` folder:

```bash
# OneDrive/Microsoft Graph Configuration
USE_GRAPH=true
GRAPH_CLIENT_ID=your_azure_app_client_id_here
GRAPH_CLIENT_SECRET=your_azure_app_client_secret_here
GRAPH_TENANT_ID=your_azure_tenant_id_here

# OneDrive File Information
GRAPH_DRIVE_ID=your_onedrive_drive_id_here
GRAPH_ITEM_ID=your_excel_file_item_id_here

# Server Configuration
PORT=5001
CACHE_DRIVER=node
CACHE_TTL_SECONDS=3600

# Local Fallback
LOCAL_EXCEL_PATH=./data/Test.xlsx
```

### 4.2 Replace Placeholder Values
- Replace `your_azure_app_client_id_here` with your actual client ID
- Replace `your_azure_app_client_secret_here` with your actual client secret
- Replace `your_azure_tenant_id_here` with your actual tenant ID
- Replace `your_onedrive_drive_id_here` with your actual drive ID
- Replace `your_excel_file_item_id_here` with your actual file item ID

## 🧪 **Step 5: Test Locally**

### 5.1 Restart Backend
```bash
cd backend
npm run dev
```

### 5.2 Test OneDrive Connection
- Make a request to your backend
- Check the console logs for OneDrive connection status
- Verify the Excel file is being read from OneDrive

## 🔍 **Step 6: Troubleshooting**

### Common Issues:
1. **"Invalid client" error**: Check your client ID and secret
2. **"Insufficient privileges"**: Ensure admin consent was granted
3. **"File not found"**: Verify drive ID and item ID are correct
4. **"Token expired"**: Check your client secret expiration

### Debug Steps:
1. Check backend console logs
2. Verify environment variables are loaded
3. Test Microsoft Graph API directly
4. Ensure file permissions are correct

## 📱 **Step 7: Frontend Integration**

Your frontend will automatically use the OneDrive data when:
- `USE_GRAPH=true` in your environment
- Backend successfully connects to OneDrive
- Excel file is accessible via Microsoft Graph API

## 🎯 **Next Steps After Setup:**

1. **Test with real data** from OneDrive
2. **Deploy backend to Vercel** with environment variables
3. **Deploy frontend to GitHub Pages**
4. **Monitor OneDrive integration** in production

## 🔒 **Security Notes:**

- Keep your `.env` file secure and never commit it to Git
- Use environment variables in production deployments
- Regularly rotate your client secrets
- Monitor API usage and permissions

---

**Need Help?** Check the Microsoft Graph documentation or Azure portal for detailed API references.


