/**
 * Token Management System - Backend Server
 * Handles all GitHub API interactions for token management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// GitHub API Configuration
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'tokens.json';

// Validate environment variables
if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('❌ Error: Missing required environment variables!');
  console.error('Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env file');
  process.exit(1);
}

// GitHub API Headers
const getHeaders = () => ({
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
});

/**
 * Get file content and SHA from GitHub
 * @returns {Object} { content: Array, sha: String }
 */
async function getGitHubFile() {
  try {
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const response = await axios.get(url, { headers: getHeaders() });
    
    // Decode base64 content
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    
    let tokens = [];
    
    // Try to parse as JSON first
    try {
      tokens = JSON.parse(content);
      // Ensure it's an array
      if (!Array.isArray(tokens)) {
        tokens = [];
      }
    } catch (jsonError) {
      // If JSON parse fails, treat as plain text (one token per line)
      console.log('📝 File is plain text, converting to JSON format...');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      tokens = lines.map((line, index) => {
        // Check if line contains tab separator (name\ttoken\ttag\tdate format or name\ttoken format)
        if (line.includes('\t')) {
          const parts = line.split('\t');
          const name = parts[0] || `Token ${index + 1}`;
          const value = parts[1] || '';
          const tag = parts[2] || ''; // Tag is optional
          const createdAt = parts[3] || new Date().toISOString(); // Date is optional, use current if not present
          
          // Create consistent ID based on token value (first 10 chars + last 10 chars)
          const idBase = value.trim().substring(0, 10) + value.trim().substring(Math.max(0, value.trim().length - 10));
          const consistentId = Buffer.from(idBase).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
          return {
            id: consistentId,
            name: name.trim() || `Token ${index + 1}`,
            value: value.trim(),
            tag: tag.trim(),
            createdAt: createdAt.trim() || new Date().toISOString()
          };
        } else {
          // Plain token without name
          const tokenValue = line.trim();
          // Create consistent ID based on token value
          const idBase = tokenValue.substring(0, 10) + tokenValue.substring(Math.max(0, tokenValue.length - 10));
          const consistentId = Buffer.from(idBase).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
          return {
            id: consistentId,
            name: `Token ${index + 1}`,
            value: tokenValue,
            tag: '',
            createdAt: new Date().toISOString()
          };
        }
      });
    }
    
    return {
      content: tokens,
      sha: response.data.sha
    };
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error.response && error.response.status === 404) {
      return {
        content: [],
        sha: null
      };
    }
    throw error;
  }
}

/**
 * Update file content on GitHub
 * @param {Array} tokens - Array of token objects
 * @param {String} sha - Current file SHA
 * @param {String} message - Commit message
 */
async function updateGitHubFile(tokens, sha, message) {
  try {
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    
    // Check if file extension is .json or if we should use JSON format
    const useJsonFormat = GITHUB_FILE_PATH.endsWith('.json');
    
    let fileContent;
    if (useJsonFormat) {
      // Save as JSON format
      fileContent = JSON.stringify(tokens, null, 2);
    } else {
      // Save as plain text format with name, token, optional tag, and date (tab-separated)
      // Format: name\ttoken\ttag\tdate
      fileContent = tokens.map(t => {
        const tag = (t.tag && t.tag.trim() !== '') ? t.tag : '';
        const date = t.createdAt || new Date().toISOString();
        return `${t.name}\t${t.value}\t${tag}\t${date}`;
      }).join('\n');
    }
    
    // Convert to base64
    const content = Buffer.from(fileContent).toString('base64');
    
    const payload = {
      message: message,
      content: content,
      sha: sha // Required for updates, omit for new files
    };
    
    // If sha is null (new file), remove it from payload
    if (!sha) {
      delete payload.sha;
    }
    
    const response = await axios.put(url, payload, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error updating GitHub file:', error.response?.data || error.message);
    console.error('Full error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

/**
 * API Routes
 */

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Token Management System is running',
    github: {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      file: GITHUB_FILE_PATH
    }
  });
});

// GET all tokens
app.get('/api/tokens', async (req, res) => {
  try {
    const { content } = await getGitHubFile();
    res.json({ 
      success: true, 
      tokens: content 
    });
  } catch (error) {
    console.error('Error fetching tokens:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tokens from GitHub',
      error: error.message 
    });
  }
});

// POST new token
app.post('/api/tokens', async (req, res) => {
  try {
    const { name, token, tag } = req.body;
    
    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Name cannot be empty' 
      });
    }
    
    if (!token || token.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Token cannot be empty' 
      });
    }
    
    // Get current tokens
    const { content: tokens, sha } = await getGitHubFile();
    
    // Create new token object
    const newToken = {
      id: Date.now().toString(),
      name: name.trim(),
      value: token.trim(),
      tag: tag || '',
      createdAt: new Date().toISOString()
    };
    
    // Check for duplicates
    const isDuplicate = tokens.some(t => t.value === newToken.value);
    if (isDuplicate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token already exists' 
      });
    }
    
    // Add new token
    tokens.push(newToken);
    
    // Update GitHub file
    await updateGitHubFile(tokens, sha, `Add token: ${newToken.name}`);
    
    res.json({ 
      success: true, 
      message: 'Token added successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Error adding token:', error.message);
    console.error('Full error:', error.response?.data || error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add token',
      error: error.message,
      details: error.response?.data?.message || 'Unknown error'
    });
  }
});

// DELETE token by ID
app.delete('/api/tokens/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current tokens
    const { content: tokens, sha } = await getGitHubFile();
    
    // Find token index
    const tokenIndex = tokens.findIndex(t => t.id === id);
    
    if (tokenIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Token not found' 
      });
    }
    
    // Remove token
    const deletedToken = tokens.splice(tokenIndex, 1)[0];
    
    // Update GitHub file
    await updateGitHubFile(tokens, sha, `Delete token: ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Token deleted successfully',
      token: deletedToken
    });
  } catch (error) {
    console.error('Error deleting token:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete token',
      error: error.message 
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Token Management System running on http://localhost:${PORT}`);
  console.log(`📁 GitHub: ${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_FILE_PATH}`);
  console.log(`✅ Ready to manage tokens!`);
});
