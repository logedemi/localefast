class InboxManager {
    constructor() {
        this.apiBase = '/.netlify/functions';
        this.currentEmail = null;
        this.currentMessages = [];
        this.refreshInterval = null;
        this.init();
    }
    
    init() {
        this.getEmailFromURL();
        this.setupEventListeners();
        this.loadInbox();
        
        // Auto-refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadInbox(true); // Silent refresh
        }, 30000);
    }
    
    getEmailFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentEmail = urlParams.get('email');
        
        if (!this.currentEmail) {
            this.showError('Email tidak ditemukan di URL');
            setTimeout(() => window.location.href = '/', 3000);
            return;
        }
        
        this.updateUI();
    }
    
    updateUI() {
        // Update email display
        document.getElementById('currentEmail').textContent = this.currentEmail;
        
        // Update avatar
        const avatar = document.getElementById('emailAvatar');
        if (avatar) {
            const initials = this.currentEmail.substring(0, 2).toUpperCase();
            avatar.textContent = initials;
            avatar.style.backgroundColor = this.getRandomColor();
        }
        
        // Update API URL
        const apiUrl = `${window.location.origin}${this.apiBase}/check-inbox?email=${encodeURIComponent(this.currentEmail)}`;
        document.getElementById('apiUrl').textContent = apiUrl;
    }
    
    async loadInbox(silent = false) {
        if (!this.currentEmail) return;
        
        try {
            if (!silent) {
                this.showLoading('Memuat inbox...');
                document.getElementById('refreshBtn').disabled = true;
            }
            
            const response = await fetch(`${this.apiBase}/check-inbox?email=${encodeURIComponent(this.currentEmail)}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentMessages = data.messages || [];
                this.displayMessages();
                this.updateStats(data);
                this.updateEmailInfo(data);
                
                if (!silent) {
                    this.showToast('Inbox diperbarui', 'success');
                }
            } else {
                if (data.error === 'Email not found or expired') {
                    this.showError('Email telah kadaluarsa atau dihapus');
                    setTimeout(() => window.location.href = '/', 3000);
                } else {
                    this.showError(data.error || 'Gagal memuat inbox');
                }
            }
        } catch (error) {
            console.error('Error loading inbox:', error);
            if (!silent) {
                this.showError('Gagal memuat inbox');
            }
        } finally {
            if (!silent) {
                this.hideLoading();
                document.getElementById('refreshBtn').disabled = false;
            }
        }
    }
    
    displayMessages() {
        const container = document.getElementById('messagesList');
        
        if (this.currentMessages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox fa-3x"></i>
                    <p>Tidak ada pesan</p>
                    <p class="empty-subtitle">Email yang dikirim ke alamat ini akan muncul di sini</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.currentMessages.map((message, index) => {
            const fromName = message.from || 'Unknown';
            const subject = message.subject || '(No subject)';
            const time = this.formatTime(message.received_at);
            const preview = message.preview || 'No preview available';
            
            return `
                <div class="message-item ${message.read ? '' : 'unread'}" 
                     onclick="inboxManager.openMessage('${message.id}')"
                     data-message-id="${message.id}">
                    <div class="message-icon">
                        ${message.read ? 
                            '<i class="far fa-envelope-open"></i>' : 
                            '<i class="fas fa-envelope"></i>'}
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-from">${fromName}</span>
                            <span class="message-time">${time}</span>
                        </div>
                        <div class="message-subject">${subject}</div>
                        <div class="message-preview">${preview}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    async openMessage(messageId) {
        try {
            this.showLoading('Memuat pesan...');
            
            const response = await fetch(
                `${this.apiBase}/check-inbox?email=${encodeURIComponent(this.currentEmail)}&message_id=${messageId}&mark_read=true`
            );
            
            const data = await response.json();
            
            if (data.success) {
                this.displayMessage(data.message);
                this.markMessageAsRead(messageId);
            } else {
                this.showError('Gagal memuat pesan');
            }
        } catch (error) {
            console.error('Error opening message:', error);
            this.showError('Gagal memuat pesan');
        } finally {
            this.hideLoading();
        }
    }
    
    displayMessage(message) {
        const container = document.getElementById('messageViewer');
        
        const from = message.from || 'Unknown Sender';
        const subject = message.subject || '(No subject)';
        const time = this.formatTime(message.received_at);
        const text = message.text || 'No content';
        const html = message.html || '';
        
        container.innerHTML = `
            <div class="message-detail">
                <div class="message-detail-header">
                    <h3>${subject}</h3>
                    <div class="message-actions">
                        <button class="btn-icon" onclick="inboxManager.replyMessage()" title="Reply">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button class="btn-icon" onclick="inboxManager.deleteMessage('${message.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-icon" onclick="inboxManager.copyMessage('${message.id}')" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="message-meta">
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <strong>From:</strong> ${from}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-envelope"></i>
                        <strong>To:</strong> ${this.currentEmail}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <strong>Received:</strong> ${time}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-id-badge"></i>
                        <strong>Message ID:</strong> ${message.id}
                    </div>
                </div>
                
                <div class="message-body">
                    ${html ? `
                        <div class="message-html">
                            <iframe srcdoc="${this.escapeHtml(html)}" 
                                    sandbox="allow-same-origin"
                                    onload="this.style.height = this.contentWindow.document.body.scrollHeight + 'px'">
                            </iframe>
                        </div>
                    ` : ''}
                    
                    <div class="message-text">
                        <pre>${text}</pre>
                    </div>
                </div>
            </div>
        `;
        
        // Scroll to top of message
        container.scrollTop = 0;
    }
    
    markMessageAsRead(messageId) {
        // Update UI
        const messageItem = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageItem) {
            messageItem.classList.remove('unread');
            messageItem.querySelector('.message-icon').innerHTML = '<i class="far fa-envelope-open"></i>';
        }
        
        // Update stats
        const unreadElement = document.getElementById('unreadMessages');
        if (unreadElement) {
            const current = parseInt(unreadElement.textContent) || 0;
            if (current > 0) {
                unreadElement.textContent = current - 1;
            }
        }
    }
    
    updateStats(data) {
        // Update statistics
        document.getElementById('totalMessages').textContent = data.stats?.total_messages || 0;
        document.getElementById('unreadMessages').textContent = data.stats?.unread_messages || 0;
        document.getElementById('messageCount').innerHTML = 
            `<i class="fas fa-envelope"></i> Pesan: ${data.stats?.total_messages || 0}`;
        
        // Update expiry
        const hours = data.expires_in_hours || 24;
        document.getElementById('expiryHours').textContent = hours;
        document.getElementById('footerExpiry').textContent = hours;
    }
    
    updateEmailInfo(data) {
        document.getElementById('emailCreated').innerHTML = 
            `<i class="fas fa-calendar-plus"></i> Dibuat: ${this.formatTime(data.created_at)}`;
        
        document.getElementById('emailExpires').innerHTML = 
            `<i class="fas fa-clock"></i> Expires: ${this.formatTime(data.expires_at)}`;
    }
    
    async deleteThisEmail() {
        if (!confirm('Apakah Anda yakin ingin menghapus email ini? Semua pesan akan hilang.')) {
            return;
        }
        
        try {
            this.showLoading('Menghapus email...');
            
            // Try to delete via API
            const response = await fetch(`${this.apiBase}/delete-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.currentEmail,
                    password: 'not-required-for-now' // In production, you'd need proper auth
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Email berhasil dihapus', 'success');
                setTimeout(() => window.location.href = '/', 2000);
            } else {
                // Even if API fails, redirect to home
                this.showToast('Email dihapus dari sesi ini', 'info');
                setTimeout(() => window.location.href = '/', 2000);
            }
        } catch (error) {
            console.error('Error deleting email:', error);
            this.showToast('Redirecting to home...', 'info');
            setTimeout(() => window.location.href = '/', 2000);
        }
    }
    
    deleteMessage(messageId) {
        if (!confirm('Delete this message?')) return;
        
        // In a real implementation, you would call an API to delete the message
        this.showToast('Message deletion would be implemented with a proper API', 'info');
    }
    
    copyMessage(messageId) {
        const message = this.currentMessages.find(m => m.id === messageId);
        if (message) {
            const text = `From: ${message.from}\nSubject: ${message.subject}\n\n${message.text}`;
            navigator.clipboard.writeText(text)
                .then(() => this.showToast('Message copied to clipboard', 'success'))
                .catch(err => console.error('Copy failed:', err));
        }
    }
    
    replyMessage() {
        this.showToast('Reply functionality would require a sending email service', 'info');
    }
    
    refreshInbox() {
        this.loadInbox();
    }
    
    // Utility methods
    formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    escapeHtml(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    getRandomColor() {
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';
        
        toast.innerHTML = `${icon} ${message}`;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
    
    showLoading(message) {
        this.showToast(message, 'info');
    }
    
    hideLoading() {
        // Loading handled by toast timeout
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
}

// Initialize inbox manager
document.addEventListener('DOMContentLoaded', () => {
    window.inboxManager = new InboxManager();
});

// Global functions
window.refreshInbox = () => window.inboxManager?.refreshInbox();
window.deleteThisEmail = () => window.inboxManager?.deleteThisEmail();
window.copyApiUrl = () => {
    const apiUrl = document.getElementById('apiUrl')?.textContent;
    if (apiUrl) {
        navigator.clipboard.writeText(apiUrl)
            .then(() => window.inboxManager?.showToast('API URL copied', 'success'))
            .catch(err => console.error('Copy failed:', err));
    }
};
window.goHome = () => {
    window.location.href = '/';
};

// Add CSS for inbox page
const style = document.createElement('style');
style.textContent = `
.inbox-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: var(--radius);
    padding: 30px;
    margin-bottom: 30px;
    color: white;
    box-shadow: var(--shadow);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.email-display-large {
    display: flex;
    align-items: center;
    gap: 20px;
}

.email-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: white;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.email-meta {
    display: flex;
    gap: 20px;
    margin-top: 10px;
    flex-wrap: wrap;
}

.meta-item {
    background: rgba(255,255,255,0.2);
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.9rem;
}

.inbox-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.stat-card {
    background: rgba(255,255,255,0.1);
    padding: 20px;
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    gap: 15px;
    backdrop-filter: blur(10px);
}

.stat-card i {
    font-size: 2rem;
    opacity: 0.8;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.messages-container {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 30px;
    margin-bottom: 40px;
    min-height: 500px;
}

.messages-sidebar {
    background: white;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
}

.message-viewer {
    background: white;
    border-radius: var(--radius);
    padding: 30px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    overflow-y: auto;
}

.message-item {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: var(--transition);
}

.message-item:hover {
    background: #f8fafc;
}

.message-item.unread {
    background: #f0f9ff;
    border-left: 4px solid var(--primary-color);
}

.message-icon {
    float: left;
    margin-right: 15px;
    color: var(--gray-color);
}

.message-item.unread .message-icon {
    color: var(--primary-color);
}

.message-content {
    overflow: hidden;
}

.message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
}

.message-from {
    font-weight: 600;
    color: var(--dark-color);
}

.message-time {
    font-size: 0.85rem;
    color: var(--gray-color);
}

.message-subject {
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--dark-color);
}

.message-preview {
    font-size: 0.9rem;
    color: var(--gray-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.viewer-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--gray-color);
}

.viewer-empty i {
    margin-bottom: 20px;
    opacity: 0.5;
}

.message-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--border-color);
}

.message-meta {
    background: #f8fafc;
    padding: 20px;
    border-radius: var(--radius);
    margin-bottom: 30px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.meta-item {
    background: none;
    padding: 0;
    color: var(--dark-color);
}

.message-body {
    margin-top: 30px;
}

.message-html iframe {
    width: 100%;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    margin-bottom: 30px;
    min-height: 300px;
}

.message-text pre {
    white-space: pre-wrap;
    font-family: inherit;
    background: #f8fafc;
    padding: 20px;
    border-radius: var(--radius);
    border: 1px solid var(--border-color);
}

.info-card, .api-card {
    background: white;
    border-radius: var(--radius);
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    margin-top: 20px;
}

.info-item {
    text-align: center;
}

.info-item i {
    font-size: 2.5rem;
    color: var(--primary-color);
    margin-bottom: 15px;
}

.code-block {
    background: #1f2937;
    color: white;
    padding: 20px;
    border-radius: var(--radius);
    margin-top: 15px;
    font-family: 'Courier New', monospace;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow-x: auto;
}

@media (max-width: 768px) {
    .messages-container {
        grid-template-columns: 1fr;
    }
    
    .header-content {
        flex-direction: column;
        gap: 20px;
        text-align: center;
    }
    
    .email-meta {
        justify-content: center;
    }
    
    .inbox-stats {
        grid-template-columns: 1fr;
    }
}
`;
document.head.appendChild(style);
