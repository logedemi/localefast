class TempEmailApp {
    constructor() {
        this.apiBase = '/.netlify/functions';
        this.currentEmail = null;
        this.currentPassword = null;
        this.init();
    }
    
    init() {
        this.updateDomainDisplay();
        this.loadRecentEmails();
        this.loadStats();
        this.setupEventListeners();
        this.applySavedTheme();
        
        // Check if there's email in URL
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        if (email) {
            document.getElementById('accessEmail').value = email;
            this.showAccessForm();
        }
    }
    
    setupEventListeners() {
        // Enter key on access email field
        document.getElementById('accessEmail')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.accessInbox();
        });
        
        // Enter key on email prefix field
        document.getElementById('emailPrefix')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateCustomEmail();
        });
    }
    
    updateDomainDisplay() {
        const domain = window.location.hostname;
        const displayElement = document.getElementById('domainDisplay');
        const suffixElement = document.getElementById('domainSuffix');
        
        if (displayElement) {
            displayElement.textContent = `@temp.${domain}`;
        }
        
        if (suffixElement) {
            suffixElement.textContent = `@temp.${domain}`;
        }
    }
    
    async createNewEmail() {
        try {
            this.showLoading('Membuat email baru...');
            
            const response = await fetch(`${this.apiBase}/create-email`);
            const data = await response.json();
            
            if (data.success) {
                this.currentEmail = data.email;
                this.currentPassword = data.password;
                this.displayEmailResult(data);
                this.saveToRecent(data);
                this.showToast('Email berhasil dibuat!', 'success');
            } else {
                throw new Error(data.error || 'Failed to create email');
            }
        } catch (error) {
            console.error('Error creating email:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async generateCustomEmail() {
        try {
            const prefix = document.getElementById('emailPrefix').value.trim();
            const lifetime = document.getElementById('emailLifetime').value;
            
            this.showLoading('Membuat email custom...');
            
            // First get a base email
            const response = await fetch(`${this.apiBase}/create-email`);
            const data = await response.json();
            
            if (data.success) {
                // If prefix provided, modify the email
                if (prefix) {
                    const [user, domain] = data.email.split('@');
                    const customEmail = `${prefix}_${user}@${domain}`;
                    data.email = customEmail;
                }
                
                this.currentEmail = data.email;
                this.currentPassword = data.password;
                this.displayEmailResult(data);
                this.saveToRecent(data);
                this.showToast('Email custom berhasil dibuat!', 'success');
            }
        } catch (error) {
            console.error('Error generating custom email:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    displayEmailResult(data) {
        // Update UI elements
        document.getElementById('generatedEmail').value = data.email;
        document.getElementById('generatedPassword').value = data.password;
        document.getElementById('expiryTime').textContent = data.expires_in;
        
        // Show result section
        document.getElementById('resultSection').style.display = 'block';
        
        // Scroll to result
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    copyEmail() {
        const emailInput = document.getElementById('generatedEmail');
        if (emailInput.value) {
            navigator.clipboard.writeText(emailInput.value)
                .then(() => this.showToast('Email disalin ke clipboard!', 'success'))
                .catch(err => console.error('Copy failed:', err));
        }
    }
    
    copyPassword() {
        const passInput = document.getElementById('generatedPassword');
        if (passInput.value) {
            navigator.clipboard.writeText(passInput.value)
                .then(() => this.showToast('Password disalin!', 'success'))
                .catch(err => console.error('Copy failed:', err));
        }
    }
    
    copyAllCredentials() {
        const email = document.getElementById('generatedEmail').value;
        const password = document.getElementById('generatedPassword').value;
        
        const text = `Email: ${email}\nPassword: ${password}`;
        
        navigator.clipboard.writeText(text)
            .then(() => this.showToast('Semua kredensial disalin!', 'success'))
            .catch(err => console.error('Copy failed:', err));
    }
    
    togglePassword() {
        const passInput = document.getElementById('generatedPassword');
        const toggleBtn = event.currentTarget;
        
        if (passInput.type === 'password') {
            passInput.type = 'text';
            toggleBtn.innerHTML = '<i class="far fa-eye-slash"></i>';
        } else {
            passInput.type = 'password';
            toggleBtn.innerHTML = '<i class="far fa-eye"></i>';
        }
    }
    
    goToInbox() {
        if (this.currentEmail) {
            window.location.href = `/inbox.html?email=${encodeURIComponent(this.currentEmail)}`;
        }
    }
    
    saveEmail() {
        if (!this.currentEmail) return;
        
        const emails = JSON.parse(localStorage.getItem('saved_emails') || '[]');
        if (!emails.includes(this.currentEmail)) {
            emails.push(this.currentEmail);
            localStorage.setItem('saved_emails', JSON.stringify(emails));
            this.showToast('Email disimpan!', 'success');
        }
    }
    
    async deleteEmail() {
        if (!this.currentEmail || !this.currentPassword) return;
        
        if (!confirm('Apakah Anda yakin ingin menghapus email ini?')) return;
        
        try {
            const response = await fetch(`${this.apiBase}/delete-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.currentEmail,
                    password: this.currentPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Email berhasil dihapus!', 'success');
                document.getElementById('resultSection').style.display = 'none';
                this.removeFromRecent(this.currentEmail);
                this.currentEmail = null;
                this.currentPassword = null;
            }
        } catch (error) {
            this.showToast('Gagal menghapus email', 'error');
        }
    }
    
    showAccessForm() {
        document.getElementById('accessForm').style.display = 'block';
    }
    
    hideAccessForm() {
        document.getElementById('accessForm').style.display = 'none';
    }
    
    async accessInbox() {
        const email = document.getElementById('accessEmail').value.trim();
        const password = document.getElementById('accessPassword').value;
        
        if (!email) {
            this.showToast('Masukkan alamat email', 'warning');
            return;
        }
        
        // Validate email format
        if (!email.includes('@')) {
            this.showToast('Format email tidak valid', 'warning');
            return;
        }
        
        // Check if email exists
        try {
            const params = new URLSearchParams({ email });
            if (password) params.append('password', password);
            
            const response = await fetch(`${this.apiBase}/check-inbox?${params}`);
            const data = await response.json();
            
            if (data.success) {
                window.location.href = `/inbox.html?email=${encodeURIComponent(email)}`;
            } else {
                this.showToast(data.error || 'Email tidak ditemukan', 'error');
            }
        } catch (error) {
            this.showToast('Error mengakses inbox', 'error');
        }
    }
    
    saveToRecent(emailData) {
        const recent = JSON.parse(localStorage.getItem('recent_emails') || '[]');
        
        // Remove if already exists
        const filtered = recent.filter(e => e.email !== emailData.email);
        
        // Add to beginning
        filtered.unshift({
            email: emailData.email,
            created: new Date().toISOString(),
            expires: emailData.expires_in
        });
        
        // Keep only last 10
        const limited = filtered.slice(0, 10);
        localStorage.setItem('recent_emails', JSON.stringify(limited));
        
        this.loadRecentEmails();
    }
    
    loadRecentEmails() {
        const recent = JSON.parse(localStorage.getItem('recent_emails') || '[]');
        const container = document.getElementById('recentEmails');
        
        if (!container) return;
        
        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox fa-3x"></i>
                    <p>Belum ada email yang dibuat</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recent.map((item, index) => {
            const shortEmail = item.email.length > 30 ? 
                item.email.substring(0, 30) + '...' : item.email;
            const initials = item.email.substring(0, 2).toUpperCase();
            
            return `
                <div class="email-item">
                    <div class="email-info">
                        <div class="email-avatar" style="background: ${this.getRandomColor()}">
                            ${initials}
                        </div>
                        <div>
                            <div class="email-address">${shortEmail}</div>
                            <div class="email-meta">Expires in ${item.expires}</div>
                        </div>
                    </div>
                    <div class="email-actions">
                        <button class="btn-icon" onclick="app.openRecentEmail('${item.email}')" title="Buka">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn-icon" onclick="app.deleteRecentEmail('${item.email}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openRecentEmail(email) {
        window.location.href = `/inbox.html?email=${encodeURIComponent(email)}`;
    }
    
    deleteRecentEmail(email) {
        const recent = JSON.parse(localStorage.getItem('recent_emails') || '[]');
        const filtered = recent.filter(e => e.email !== email);
        localStorage.setItem('recent_emails', JSON.stringify(filtered));
        this.loadRecentEmails();
        this.showToast('Email dihapus dari riwayat', 'success');
    }
    
    clearHistory() {
        if (confirm('Hapus semua riwayat email?')) {
            localStorage.removeItem('recent_emails');
            this.loadRecentEmails();
            this.showToast('Riwayat berhasil dihapus', 'success');
        }
    }
    
    getRandomColor() {
        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#06b6d4'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    async loadStats() {
        try {
            // For now, just show local storage count
            const recent = JSON.parse(localStorage.getItem('recent_emails') || '[]');
            document.getElementById('totalEmails')?.textContent = recent.length;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    refreshGenerator() {
        document.getElementById('emailPrefix').value = '';
        document.getElementById('emailLifetime').value = '24';
        this.showToast('Generator direset', 'info');
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = event.currentTarget.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.showToast(`Tema ${newTheme} diaktifkan`, 'info');
    }
    
    applySavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeBtn = document.querySelector('.btn-nav');
        if (themeBtn) {
            const icon = themeBtn.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
    
    showApiInfo() {
        const domain = window.location.hostname;
        const apiInfo = `
API Endpoints:
1. Create Email: https://${domain}/.netlify/functions/create-email
2. Check Inbox: https://${domain}/.netlify/functions/check-inbox?email=YOUR_EMAIL
3. Delete Email: POST to https://${domain}/.netlify/functions/delete-email
        `;
        
        alert(apiInfo);
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        // Set icon based on type
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
        // Simple loading indicator
        this.showToast(message, 'info');
    }
    
    hideLoading() {
        // Loading handled by toast timeout
    }
    
    removeFromRecent(email) {
        const recent = JSON.parse(localStorage.getItem('recent_emails') || '[]');
        const filtered = recent.filter(e => e.email !== email);
        localStorage.setItem('recent_emails', JSON.stringify(filtered));
        this.loadRecentEmails();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TempEmailApp();
});

// Global functions for HTML onclick handlers
window.createNewEmail = () => window.app?.createNewEmail();
window.generateCustomEmail = () => window.app?.generateCustomEmail();
window.copyEmail = () => window.app?.copyEmail();
window.copyPassword = () => window.app?.copyPassword();
window.copyAllCredentials = () => window.app?.copyAllCredentials();
window.togglePassword = () => window.app?.togglePassword();
window.goToInbox = () => window.app?.goToInbox();
window.saveEmail = () => window.app?.saveEmail();
window.deleteEmail = () => window.app?.deleteEmail();
window.showAccessForm = () => window.app?.showAccessForm();
window.hideAccessForm = () => window.app?.hideAccessForm();
window.accessInbox = () => window.app?.accessInbox();
window.refreshGenerator = () => window.app?.refreshGenerator();
window.toggleTheme = () => window.app?.toggleTheme();
window.showApiInfo = () => window.app?.showApiInfo();
window.clearHistory = () => window.app?.clearHistory();
