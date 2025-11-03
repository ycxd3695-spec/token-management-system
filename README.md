# Token Management System

A modern, production-ready web application for managing tokens through GitHub API integration. This system allows you to add, view, and delete tokens that are automatically synchronized with a GitHub repository file.

## 🌟 Features

- **Real-time GitHub Sync**: All token operations are instantly reflected in your GitHub repository
- **Clean UI**: Modern, responsive design using Tailwind CSS
- **Secure Backend**: Node.js/Express server handling all GitHub API interactions
- **Token Operations**:
  - ✅ Add new tokens
  - 📋 View all stored tokens
  - 🗑️ Delete tokens
  - 📋 Copy tokens to clipboard
  - 🔄 Refresh token list
- **Production Ready**: Error handling, validation, and security best practices

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GitHub account
- GitHub Personal Access Token with repo permissions

## 🚀 Installation

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

4. **Configure environment variables**
   
   Edit `.env` file with your details:
   ```env
   # GitHub Personal Access Token (required)
   GITHUB_TOKEN=ghp_your_personal_access_token_here
   
   # Your GitHub username (required)
   GITHUB_OWNER=your_github_username
   
   # Repository name where tokens will be stored (required)
   GITHUB_REPO=your_repository_name
   
   # File path in the repo to store tokens (default: tokens.json)
   GITHUB_FILE_PATH=tokens.json
   
   # Server port (default: 3000)
   PORT=3000
   ```

## 🔑 Getting GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Token Management System")
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)
7. Paste it in your `.env` file as `GITHUB_TOKEN`

## 📁 Project Structure

```
lock system/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── style.css          # Custom CSS styles
│   └── script.js          # Frontend JavaScript logic
├── server.js              # Backend Node.js/Express server
├── package.json           # Project dependencies
├── .env.example           # Environment variables template
├── .env                   # Your environment variables (create this)
├── .gitignore            # Git ignore file
└── README.md             # This file
```

## 🎯 Usage

### Starting the Server

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Using the Application

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Add a Token**:
   - Enter your token in the input field
   - Click "Add Token"
   - Token is saved to GitHub and displayed instantly

3. **View Tokens**:
   - All tokens are loaded automatically on page load
   - Each token shows:
     - Token value
     - Creation date
     - Unique ID

4. **Copy Token**:
   - Click the "Copy" button next to any token
   - Token is copied to clipboard

5. **Delete Token**:
   - Click the "Delete" button
   - Confirm the deletion
   - Token is removed from both UI and GitHub

6. **Refresh**:
   - Click the "Refresh" button to reload tokens from GitHub

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use environment variables** - Never hardcode tokens in source code
3. **GitHub Token Permissions** - Only grant necessary permissions
4. **HTTPS in Production** - Always use HTTPS in production environments
5. **Input Validation** - The app validates all inputs to prevent injection attacks

## 🌐 API Endpoints

### GET `/api/health`
Check server status
```json
{
  "status": "OK",
  "message": "Token Management System is running",
  "github": {
    "owner": "username",
    "repo": "repository",
    "file": "tokens.json"
  }
}
```

### GET `/api/tokens`
Get all tokens
```json
{
  "success": true,
  "tokens": [
    {
      "id": "1698765432000",
      "value": "my-token-value",
      "createdAt": "2025-11-02T10:30:00.000Z"
    }
  ]
}
```

### POST `/api/tokens`
Add a new token
```json
// Request
{
  "token": "new-token-value"
}

// Response
{
  "success": true,
  "message": "Token added successfully",
  "token": {
    "id": "1698765432001",
    "value": "new-token-value",
    "createdAt": "2025-11-02T10:35:00.000Z"
  }
}
```

### DELETE `/api/tokens/:id`
Delete a token
```json
{
  "success": true,
  "message": "Token deleted successfully",
  "token": {
    "id": "1698765432001",
    "value": "deleted-token",
    "createdAt": "2025-11-02T10:35:00.000Z"
  }
}
```

## 🐛 Troubleshooting

### Server won't start
- Check if `.env` file exists with all required variables
- Verify Node.js is installed: `node --version`
- Check if port 3000 is available

### GitHub API errors
- Verify your Personal Access Token is valid
- Check token has `repo` permissions
- Ensure GITHUB_OWNER and GITHUB_REPO are correct
- Check if the repository exists and you have access

### Tokens not loading
- Open browser console (F12) to see error messages
- Check network tab for API request failures
- Verify backend server is running

## 🚀 Deployment

### Deploy to Production

1. **Set production environment variables**
2. **Use process manager** (e.g., PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name token-system
   ```
3. **Set up reverse proxy** (e.g., Nginx)
4. **Enable HTTPS** with SSL certificate
5. **Configure firewall** rules

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Built with ❤️ for secure token management

## 📞 Support

If you encounter any issues or have questions, please check the troubleshooting section or create an issue in the repository.

---

**Happy Token Managing! 🎉**
