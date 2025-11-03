/**
 * Token Management System - Frontend Logic
 * Handles UI interactions and API communication
 */

// Configuration
const API_BASE_URL = window.location.origin;

// DOM Elements
const addTokenForm = document.getElementById('addTokenForm');
const nameInput = document.getElementById('nameInput');
const tokenInput = document.getElementById('tokenInput');
const tagInput = document.getElementById('tagInput');
const addTokenBtn = document.getElementById('addTokenBtn');
const refreshBtn = document.getElementById('refreshBtn');
const tokensList = document.getElementById('tokensList');
const tokensTableBody = document.getElementById('tokensTableBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const statusBanner = document.getElementById('statusBanner');
const statusMessage = document.getElementById('statusMessage');
const tokenCount = document.getElementById('tokenCount');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const sortFilter = document.getElementById('sortFilter');
const tagFilter = document.getElementById('tagFilter');
const expiryFilter = document.getElementById('expiryFilter');
const filterStats = document.getElementById('filterStats');
const filteredCount = document.getElementById('filteredCount');
const totalCount = document.getElementById('totalCount');
const expiryStats = document.getElementById('expiryStats');
const expiredCount = document.getElementById('expiredCount');
const expiringCount = document.getElementById('expiringCount');
const darkModeToggle = document.getElementById('darkModeToggle');
const exportBtn = document.getElementById('exportBtn');
const exportMenu = document.getElementById('exportMenu');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const bulkActions = document.getElementById('bulkActions');
const selectedCount = document.getElementById('selectedCount');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');

// State
let tokens = [];
let filteredTokens = [];
let isLoading = false;
let currentSearchTerm = '';
let currentSortOrder = 'newest';
let currentTagFilter = '';
let currentExpiryFilter = '';
let selectedTokens = new Set();
let isDarkMode = localStorage.getItem('darkMode') === 'true';

/**
 * Initialize the application
 */
function init() {
    console.log('🚀 Token Management System initialized');
    initDarkMode();
    loadTokens();
    setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    addTokenForm.addEventListener('submit', handleAddToken);
    refreshBtn.addEventListener('click', handleRefresh);
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    sortFilter.addEventListener('change', handleSort);
    tagFilter.addEventListener('change', handleTagFilter);
    expiryFilter.addEventListener('change', handleExpiryFilter);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    exportBtn.addEventListener('click', toggleExportMenu);
    importBtn.addEventListener('click', () => importFileInput.click());
    
    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.classList.add('hidden');
        }
    });
    importFileInput.addEventListener('change', importTokens);
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
    deleteSelectedBtn.addEventListener('click', deleteSelectedTokens);
    deselectAllBtn.addEventListener('click', deselectAll);
}

/**
 * Show status message
 * @param {String} message - Message to display
 * @param {String} type - Type of message (success, error, info)
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusBanner.className = `mb-6 p-4 rounded-lg shadow-md status-${type}`;
    statusBanner.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusBanner.classList.add('hidden');
    }, 5000);
}

/**
 * Update UI state
 * @param {Boolean} loading - Loading state
 */
function updateUIState(loading) {
    isLoading = loading;
    
    if (loading) {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        tokensList.classList.add('hidden');
        addTokenBtn.disabled = true;
        addTokenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
    } else {
        loadingState.classList.add('hidden');
        addTokenBtn.disabled = false;
        addTokenBtn.innerHTML = '<i class="fas fa-plus"></i><span>Add Token</span>';
        
        if (tokens.length === 0) {
            emptyState.classList.remove('hidden');
            tokensList.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            tokensList.classList.remove('hidden');
        }
    }
    
    // Update token count
    tokenCount.textContent = tokens.length;
}

/**
 * Load tokens from API
 */
async function loadTokens() {
    try {
        updateUIState(true);
        
        const response = await fetch(`${API_BASE_URL}/api/tokens`);
        const data = await response.json();
        
        if (data.success) {
            tokens = data.tokens;
            console.log(`✅ Loaded ${tokens.length} tokens`);
            console.log('Token details:', tokens); // Debug: Show all token data
            renderTokens();
        } else {
            throw new Error(data.message);
        }
        
        updateUIState(false);
    } catch (error) {
        console.error('Error loading tokens:', error);
        showStatus(`Failed to load tokens: ${error.message}`, 'error');
        updateUIState(false);
    }
}

/**
 * Render tokens list
 */
function renderTokens() {
    tokensTableBody.innerHTML = '';
    
    // Apply filters and sorting
    filteredTokens = filterAndSortTokens(tokens, currentSearchTerm, currentSortOrder);
    
    // Update stats
    updateFilterStats();
    
    // Render filtered tokens
    filteredTokens.forEach((token, index) => {
        const tokenRow = createTokenRow(token, index);
        tokensTableBody.appendChild(tokenRow);
    });
    
    // Show "no results" message if filtered list is empty but main list has items
    if (filteredTokens.length === 0 && tokens.length > 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = `
            <td colspan="4" class="px-4 py-8 text-center">
                <i class="fas fa-search text-gray-300 text-4xl mb-3"></i>
                <p class="text-gray-600">No tokens found matching your search</p>
                <button onclick="clearSearch()" class="mt-3 text-indigo-600 hover:text-indigo-800">
                    Clear search
                </button>
            </td>
        `;
        tokensTableBody.appendChild(noResultsRow);
    }
}

/**
 * Filter and sort tokens
 * @param {Array} tokenList - List of tokens
 * @param {String} searchTerm - Search term
 * @param {String} sortOrder - Sort order
 * @returns {Array} Filtered and sorted tokens
 */
function filterAndSortTokens(tokenList, searchTerm, sortOrder) {
    let result = [...tokenList];
    
    // Apply tag filter
    if (currentTagFilter) {
        result = result.filter(token => token.tag === currentTagFilter);
    }
    
    // Apply expiry filter
    if (currentExpiryFilter) {
        result = result.filter(token => {
            const now = new Date();
            const tokenDate = new Date(token.createdAt);
            const tokenAge = Math.floor((now - tokenDate) / (1000 * 60 * 60 * 24));
            
            switch (currentExpiryFilter) {
                case 'expired':
                    return tokenAge >= 30;
                case 'expiring':
                    return tokenAge >= 25 && tokenAge < 30;
                case 'active':
                    return tokenAge < 25;
                default:
                    return true;
            }
        });
    }
    
    // Apply search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(token => {
            const name = (token.name || '').toLowerCase();
            const value = (token.value || '').toLowerCase();
            return name.includes(term) || value.includes(term);
        });
    }
    
    // Apply sorting
    switch (sortOrder) {
        case 'newest':
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'name-asc':
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
    }
    
    return result;
}

/**
 * Update filter statistics
 */
function updateFilterStats() {
    totalCount.textContent = tokens.length;
    filteredCount.textContent = filteredTokens.length;
    
    // Calculate expiry statistics
    const now = new Date();
    let expired = 0;
    let expiring = 0;
    
    tokens.forEach(token => {
        const tokenDate = new Date(token.createdAt);
        const tokenAge = Math.floor((now - tokenDate) / (1000 * 60 * 60 * 24));
        
        if (tokenAge >= 30) {
            expired++;
        } else if (tokenAge >= 25) {
            expiring++;
        }
    });
    
    expiredCount.textContent = expired;
    expiringCount.textContent = expiring;
    
    // Show expiry stats if there are expired or expiring tokens
    if (expired > 0 || expiring > 0) {
        expiryStats.classList.remove('hidden');
    } else {
        expiryStats.classList.add('hidden');
    }
    
    // Show filter stats only when filtering is active
    if (currentSearchTerm || filteredTokens.length !== tokens.length) {
        filterStats.classList.remove('hidden');
    } else {
        filterStats.classList.add('hidden');
    }
}

/**
 * Handle search input
 * @param {Event} e - Input event
 */
function handleSearch(e) {
    currentSearchTerm = e.target.value.trim();
    
    // Show/hide clear button
    if (currentSearchTerm) {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }
    
    renderTokens();
}

/**
 * Clear search
 */
function clearSearch() {
    searchInput.value = '';
    currentSearchTerm = '';
    clearSearchBtn.classList.add('hidden');
    renderTokens();
    searchInput.focus();
}

/**
 * Handle sort change
 * @param {Event} e - Change event
 */
function handleSort(e) {
    currentSortOrder = e.target.value;
    renderTokens();
}

/**
 * Create token row element
 * @param {Object} token - Token object
 * @param {Number} index - Token index
 * @returns {HTMLElement} Token row element
 */
function createTokenRow(token, index) {
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-200 hover:bg-gray-50 transition token-card';
    row.style.animationDelay = `${index * 0.05}s`;
    
    // Format date as DD-MM-YYYY
    const date = new Date(token.createdAt);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    // Also create readable format like "02 Nov 2025"
    const readableDate = date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric'
    });
    
    // Check if token is older than 1 month (30 days)
    const now = new Date();
    const tokenAge = Math.floor((now - date) / (1000 * 60 * 60 * 24)); // Days
    const isExpired = tokenAge >= 30;
    const daysLeft = 30 - tokenAge;
    
    // Set row background color based on age
    if (isExpired) {
        row.className += ' bg-red-50 border-red-200';
    } else if (tokenAge >= 25) {
        row.className += ' bg-yellow-50 border-yellow-200'; // Warning: expiring soon
    }
    
    // Mask the token (show only first 4 and last 4 characters)
    const tokenValue = token.value || '';
    let maskedToken = '••••••••••••••';
    if (tokenValue.length > 8) {
        maskedToken = tokenValue.substring(0, 4) + '••••••••' + tokenValue.substring(tokenValue.length - 4);
    } else if (tokenValue.length > 0) {
        maskedToken = '••••••••••••••';
    }
    
    // Get name from token object
    const tokenName = escapeHtml(token.name || 'Unknown');
    
    // Get tag badge
    const tagBadges = {
        'production': '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">🔴 Production</span>',
        'development': '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">🟢 Development</span>',
        'testing': '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">🟡 Testing</span>',
        'staging': '<span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">🟠 Staging</span>',
        'personal': '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">🔵 Personal</span>'
    };
    const tagBadge = token.tag ? tagBadges[token.tag] || '' : '<span class="text-gray-400 text-xs">-</span>';
    
    const isChecked = selectedTokens.has(token.id) ? 'checked' : '';
    
    row.innerHTML = `
        <td class="px-4 py-4 text-center">
            <input 
                type="checkbox" 
                class="token-checkbox w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                data-token-id="${token.id}"
                ${isChecked}
                onchange="toggleTokenSelection('${token.id}')"
            >
        </td>
        <td class="px-4 py-4">
            <div class="flex items-center">
                <i class="fas fa-user-circle text-indigo-500 mr-2 text-lg"></i>
                <span class="font-medium text-gray-800">${tokenName}</span>
            </div>
        </td>
        <td class="px-4 py-4">
            <div class="flex items-center space-x-2">
                <span class="font-mono text-gray-600" id="token-${token.id}">${maskedToken}</span>
                <button 
                    onclick="toggleTokenVisibility('${token.id}', '${escapeHtml(tokenValue)}')"
                    class="text-gray-400 hover:text-indigo-600 transition"
                    title="Show/Hide token"
                >
                    <i class="fas fa-eye" id="eye-${token.id}"></i>
                </button>
            </div>
        </td>
        <td class="px-4 py-4">
            ${tagBadge}
        </td>
        <td class="px-4 py-4">
            <div class="flex flex-col">
                <span class="${isExpired ? 'text-red-700 font-semibold' : 'text-gray-700'}" title="${readableDate}">
                    ${formattedDate}
                </span>
                ${isExpired ? 
                    `<span class="text-xs text-red-600 mt-1">
                        <i class="fas fa-exclamation-triangle mr-1"></i>Expired (${tokenAge} days old)
                    </span>` : 
                    tokenAge >= 25 ? 
                    `<span class="text-xs text-yellow-600 mt-1">
                        <i class="fas fa-clock mr-1"></i>Expires in ${daysLeft} days
                    </span>` :
                    `<span class="text-xs text-gray-500 mt-1">${tokenAge} days old</span>`
                }
            </div>
        </td>
        <td class="px-4 py-4">
            <div class="flex items-center justify-center space-x-2">
                <button 
                    onclick="copyToClipboard('${escapeHtml(tokenValue)}', this)"
                    class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center space-x-1"
                    title="Copy to clipboard"
                >
                    <i class="fas fa-copy"></i>
                    <span class="hidden lg:inline">Copy</span>
                </button>
                <button 
                    onclick="deleteToken('${token.id}')"
                    class="btn-delete px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm flex items-center space-x-1"
                    title="Delete token"
                >
                    <i class="fas fa-trash"></i>
                    <span class="hidden lg:inline">Delete</span>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Toggle token visibility
 * @param {String} tokenId - Token ID
 * @param {String} fullToken - Full token value
 */
function toggleTokenVisibility(tokenId, fullToken) {
    const tokenElement = document.getElementById(`token-${tokenId}`);
    const eyeIcon = document.getElementById(`eye-${tokenId}`);
    
    if (tokenElement.dataset.visible === 'true') {
        // Hide token
        let maskedToken = '••••••••••••••';
        if (fullToken.length > 8) {
            maskedToken = fullToken.substring(0, 4) + '••••••••' + fullToken.substring(fullToken.length - 4);
        }
        tokenElement.textContent = maskedToken;
        tokenElement.dataset.visible = 'false';
        eyeIcon.className = 'fas fa-eye';
    } else {
        // Show token
        tokenElement.textContent = fullToken;
        tokenElement.dataset.visible = 'true';
        eyeIcon.className = 'fas fa-eye-slash';
    }
}

/**
 * Handle add token form submission
 * @param {Event} e - Form submit event
 */
async function handleAddToken(e) {
    e.preventDefault();
    
    const nameValue = nameInput.value.trim();
    const tokenValue = tokenInput.value.trim();
    const tagValue = tagInput.value;
    
    if (!nameValue) {
        showStatus('Please enter a name', 'error');
        nameInput.focus();
        return;
    }
    
    if (!tokenValue) {
        showStatus('Please enter a token', 'error');
        tokenInput.focus();
        return;
    }
    
    try {
        updateUIState(true);
        
        const response = await fetch(`${API_BASE_URL}/api/tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name: nameValue,
                token: tokenValue,
                tag: tagValue
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Add token to local state
            tokens.push(data.token);
            renderTokens();
            
            // Clear inputs
            nameInput.value = '';
            tokenInput.value = '';
            tagInput.value = '';
            nameInput.focus();
            
            showStatus('Token added successfully!', 'success');
            console.log('✅ Token added:', data.token.id);
        } else {
            throw new Error(data.message);
        }
        
        updateUIState(false);
    } catch (error) {
        console.error('Error adding token:', error);
        showStatus(`Failed to add token: ${error.message}`, 'error');
        updateUIState(false);
    }
}

/**
 * Delete token
 * @param {String} tokenId - Token ID to delete
 */
async function deleteToken(tokenId) {
    if (!confirm('Are you sure you want to delete this token?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/tokens/${tokenId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove token from local state
            tokens = tokens.filter(t => t.id !== tokenId);
            renderTokens();
            updateUIState(false);
            
            showStatus('Token deleted successfully!', 'success');
            console.log('✅ Token deleted:', tokenId);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error deleting token:', error);
        showStatus(`Failed to delete token: ${error.message}`, 'error');
    }
}

/**
 * Copy token to clipboard
 * @param {String} text - Text to copy
 * @param {HTMLElement} button - Button element
 */
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i><span class="hidden sm:inline">Copied!</span>';
        button.classList.add('copy-feedback', 'bg-green-500');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copy-feedback', 'bg-green-500');
        }, 2000);
        
        showStatus('Token copied to clipboard!', 'success');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showStatus('Failed to copy to clipboard', 'error');
    }
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
    console.log('🔄 Refreshing tokens...');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i><span>Refreshing...</span>';
    refreshBtn.disabled = true;
    
    await loadTokens();
    
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Refresh</span>';
    refreshBtn.disabled = false;
    showStatus('Tokens refreshed!', 'success');
}

/**
 * Escape HTML to prevent XSS
 * @param {String} text - Text to escape
 * @returns {String} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Dark Mode Functions
 */
function initDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun text-yellow-400 text-xl"></i>';
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    if (isDarkMode) {
        darkModeToggle.innerHTML = '<i class="fas fa-sun text-yellow-400 text-xl"></i>';
        showStatus('Dark mode enabled', 'success');
    } else {
        darkModeToggle.innerHTML = '<i class="fas fa-moon text-gray-600 text-xl"></i>';
        showStatus('Light mode enabled', 'success');
    }
}

/**
 * Tag Filter
 */
function handleTagFilter(e) {
    currentTagFilter = e.target.value;
    renderTokens();
}

/**
 * Expiry Filter
 */
function handleExpiryFilter(e) {
    currentExpiryFilter = e.target.value;
    renderTokens();
}

/**
 * Toggle Export Menu
 */
function toggleExportMenu(e) {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
}

/**
 * Export Tokens to CSV (Excel compatible)
 */
function exportToCSV() {
    try {
        exportMenu.classList.add('hidden');
        
        // CSV Header with UTF-8 BOM for Excel compatibility
        let csv = '\uFEFF'; // UTF-8 BOM
        csv += 'Name,Token,Tag,Added On\r\n';
        
        // CSV Data
        tokens.forEach(token => {
            const date = new Date(token.createdAt);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
            
            // Escape double quotes and wrap in quotes
            const name = `"${(token.name || '').replace(/"/g, '""')}"`;
            const value = `"${(token.value || '').replace(/"/g, '""')}"`;
            const tag = `"${token.tag || 'None'}"`;
            const dateStr = `"${formattedDate}"`;
            
            csv += `${name},${value},${tag},${dateStr}\r\n`;
        });
        
        // Create and download file with proper CSV MIME type
        const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `tokens-backup-${new Date().toISOString().split('T')[0]}.csv`);
        
        // Force download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        showStatus(`Exported ${tokens.length} tokens to CSV successfully!`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showStatus('Failed to export tokens to CSV', 'error');
    }
}

/**
 * Export Tokens to JSON
 */
function exportToJSON() {
    try {
        exportMenu.classList.add('hidden');
        
        const dataStr = JSON.stringify(tokens, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tokens-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showStatus(`Exported ${tokens.length} tokens to JSON successfully!`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showStatus('Failed to export tokens to JSON', 'error');
    }
}

/**
 * Import Tokens from JSON
 */
async function importTokens(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const importedTokens = JSON.parse(text);
        
        if (!Array.isArray(importedTokens)) {
            throw new Error('Invalid file format');
        }
        
        const confirmed = confirm(`Import ${importedTokens.length} tokens? This will add them to your existing tokens.`);
        if (!confirmed) {
            importFileInput.value = '';
            return;
        }
        
        // Add imported tokens
        for (const token of importedTokens) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/tokens`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: token.name || 'Imported Token',
                        token: token.value || token.token,
                        tag: token.tag || ''
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    tokens.push(data.token);
                }
            } catch (err) {
                console.error('Failed to import token:', err);
            }
        }
        
        renderTokens();
        updateUIState(false);
        showStatus(`Imported ${importedTokens.length} tokens successfully!`, 'success');
        importFileInput.value = '';
        
    } catch (error) {
        console.error('Import error:', error);
        showStatus('Failed to import tokens. Please check file format.', 'error');
        importFileInput.value = '';
    }
}

/**
 * Bulk Selection Functions
 */
function toggleSelectAll(e) {
    if (e.target.checked) {
        filteredTokens.forEach(token => selectedTokens.add(token.id));
    } else {
        selectedTokens.clear();
    }
    renderTokens();
    updateBulkActions();
}

function toggleTokenSelection(tokenId) {
    if (selectedTokens.has(tokenId)) {
        selectedTokens.delete(tokenId);
    } else {
        selectedTokens.add(tokenId);
    }
    updateBulkActions();
    updateSelectAllCheckbox();
}

function updateBulkActions() {
    selectedCount.textContent = selectedTokens.size;
    if (selectedTokens.size > 0) {
        bulkActions.classList.remove('hidden');
    } else {
        bulkActions.classList.add('hidden');
    }
}

function updateSelectAllCheckbox() {
    const allSelected = filteredTokens.length > 0 && 
                       filteredTokens.every(token => selectedTokens.has(token.id));
    selectAllCheckbox.checked = allSelected;
}

function deselectAll() {
    selectedTokens.clear();
    selectAllCheckbox.checked = false;
    renderTokens();
    updateBulkActions();
}

async function deleteSelectedTokens() {
    if (selectedTokens.size === 0) return;
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedTokens.size} selected tokens?`);
    if (!confirmed) return;
    
    const idsToDelete = Array.from(selectedTokens);
    let deleted = 0;
    
    for (const id of idsToDelete) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tokens/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                tokens = tokens.filter(t => t.id !== id);
                deleted++;
            }
        } catch (error) {
            console.error('Failed to delete token:', id, error);
        }
    }
    
    selectedTokens.clear();
    renderTokens();
    updateUIState(false);
    updateBulkActions();
    showStatus(`Deleted ${deleted} tokens successfully!`, 'success');
}

// Make functions available globally
window.deleteToken = deleteToken;
window.copyToClipboard = copyToClipboard;
window.toggleTokenVisibility = toggleTokenVisibility;
window.clearSearch = clearSearch;
window.toggleTokenSelection = toggleTokenSelection;
window.exportToCSV = exportToCSV;
window.exportToJSON = exportToJSON;
