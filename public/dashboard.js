class DashboardManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadStats();
        this.loadActivities();
        this.loadSavedEmails();
    }
    
    loadStats() {
        // Load from localStorage
        const recent = JSON.parse(localStorage.getItem('recent_emails') || '[]');
        const saved = JSON.parse(localStorage.getItem('saved_emails') || '[]');
        
        // Update stats
        document.getElementById('totalEmailsCreated').textContent = recent.length;
        document.getElementById('activeEmails').textContent = saved.length;
        document.getElementById('totalMessages').textContent = 'N/A'; // Would need actual message count
        document.getElementById('expiredEmails').textContent = Math.max(0, recent.length - saved.length);
    }
    
    loadActivities() {
        const activities = JSON.parse(localStorage.getItem('recent_emails') || '[]');
        const container = document.getElementById('activityList');
        
        if (activities.length === 0) {
            return; // Keep empty state
        }
        
        container.innerHTML = activities.slice(0, 10).map(item => {
            const time = new Date(item.created).toLocaleString();
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">Email dibuat: ${item.email}</div>
                        <div class="activity-time">${time}</div>
                    </div>
                    <button class="btn-icon" onclick="dashboard.openActivity('${item.email}')">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    loadSavedEmails() {
        const saved = JSON.parse(localStorage.getItem('saved_emails') || '[]');
        const container = document.getElementById('savedEmails');
        
        if (saved.length === 0) {
            return; // Keep empty state
        }
        
        container.innerHTML = saved.map(email => {
            const initials = email.substring(0, 2).toUpperCase();
            
            return `
                <div class="saved-email-item">
                    <div class="email-avatar-small" style="background: ${this.getRandomColor()}">
                        ${initials}
                    </div>
                    <div class="email-info">
                        <div class="email-address">${email}</div>
                        <div class="email-status">Disimpan</div>
                    </div>
                    <div class="email-actions">
                        <button class="btn-icon" onclick="dashboard.openSavedEmail('${email}')">
                            <i class="fas fa-inbox"></i>
                        </button>
                        <button class="btn-icon" onclick="dashboard.removeSavedEmail('${email}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openActivity(email) {
        window.location.href = `/inbox.html?email=${encodeURIComponent(email)}`;
    }
    
    openSavedEmail(email) {
        window.location.href = `/inbox.html?email=${encodeURIComponent(email)}`;
    }
    
    removeSavedEmail(email) {
        const saved = JSON.parse(localStorage.getItem('saved_emails') || '[]');
        const filtered = saved.filter(e => e !== email);
        localStorage.setItem('saved_emails', JSON.stringify(filtered));
        this.loadSavedEmails();
        this.loadStats();
        this.showToast('Email dihapus dari tersimpan', 'success');
    }
    
    clearSavedEmails() {
        if (confirm('Hapus semua email tersimpan?')) {
            localStorage.removeItem('saved_emails');
            this.loadSavedEmails();
            this.loadStats();
            this.showToast('Semua email tersimpan dihapus', 'success');
        }
    }
    
    refreshDashboard() {
        this.loadStats();
        this.loadActivities();
        this.loadSavedEmails();
        this.showToast('Dashboard diperbarui', 'success');
    }
    
    getRandomColor() {
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    showToast(message, type = 'info') {
        // Create toast if doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        
        toast.innerHTML = `${icon} ${message}`;
        toast.classList.add('show', type);
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});

// Global functions
window.refreshDashboard = () => window.dashboard?.refreshDashboard();
window.clearSavedEmails = () => window.dashboard?.clearSavedEmails();
window.goHome = () => {
    window.location.href = '/';
};

// Add CSS for dashboard
const style = document.createElement('style');
style.textContent = `
.stats-overview {
    margin-bottom: 40px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px;
}

.stat-box {
    background: white;
    border-radius: var(--radius);
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
}

.stat-box.primary {
    border-left: 5px solid var(--primary-color);
}

.stat-box.success {
    border-left: 5px solid var(--secondary-color);
}

.stat-box.warning {
    border-left: 5px solid var(--warning-color);
}

.stat-box.danger {
    border-left: 5px solid var(--danger-color);
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
}

.stat-box.primary .stat-icon {
    background: rgba(79, 70, 229, 0.1);
    color: var(--primary-color);
}

.stat-box.success .stat-icon {
    background: rgba(16, 185, 129, 0.1);
    color: var(--secondary-color);
}

.stat-box.warning .stat-icon {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning-color);
}

.stat-box.danger .stat-icon {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger-color);
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-label {
    color: var(--gray-color);
    font-size: 0.9rem;
}

.dashboard-section {
    background: white;
    border-radius: var(--radius);
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.activity-list, .saved-emails {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.activity-item, .saved-email-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-radius: var(--radius);
    border: 1px solid var(--border-color);
    transition: var(--transition);
}

.activity-item:hover, .saved-email-item:hover {
    background: #f8fafc;
    border-color: var(--primary-color);
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(79, 70, 229, 0.1);
    color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 600;
    margin-bottom: 5px;
}

.activity-time {
    font-size: 0.85rem;
    color: var(--gray-color);
}

.email-avatar-small {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
}

.email-info {
    flex: 1;
}

.email-address {
    font-weight: 600;
    margin-bottom: 5px;
}

.email-status {
    font-size: 0.85rem;
    color: var(--secondary-color);
    background: rgba(16, 185, 129, 0.1);
    padding: 2px 10px;
    border-radius: 10px;
    display: inline-block;
}

.system-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
    margin-top: 20px;
}

.info-card {
    padding: 20px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 15px 0;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--secondary-color);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.status-indicator.active .status-dot {
    background: var(--secondary-color);
}

.info-text {
    color: var(--gray-color);
    font-size: 0.9rem;
    margin-top: 10px;
}

.storage-bar {
    height: 10px;
    background: #e5e7eb;
    border-radius: 5px;
    margin: 15px 0;
    overflow: hidden;
}

.storage-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    border-radius: 5px;
}

.security-list {
    list-style: none;
    padding: 0;
    margin: 15px 0;
}

.security-list li {
    padding: 8px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.success-icon {
    color: var(--secondary-color);
}

.api-docs {
    margin-top: 20px;
}

.api-endpoint {
    background: #f8fafc;
    padding: 20px;
    border-radius: var(--radius);
    margin-bottom: 15px;
    border: 1px solid var(--border-color);
}

.endpoint-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.endpoint-method {
    padding: 5px 15px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.85rem;
    text-transform: uppercase;
}

.endpoint-method.get {
    background: #dbeafe;
    color: #1d4ed8;
}

.endpoint-method.post {
    background: #dcfce7;
    color: #059669;
}

.endpoint-url {
    font-family: 'Courier New', monospace;
    background: white;
    padding: 5px 10px;
    border-radius: 5px;
    border: 1px solid var(--border-color);
}

.endpoint-desc {
    color: var(--gray-color);
    font-size: 0.95rem;
}
`;
document.head.appendChild(style);
