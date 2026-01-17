const crypto = require('crypto');

// Simple in-memory store
const emailStore = new Map();
const messageStore = new Map();

class TempEmailUtils {
  static generateRandomEmail(domain = 'temp.email.com') {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(3).toString('hex');
    const username = `user_${timestamp}_${randomStr}`;
    return `${username}@${domain}`;
  }

  static generatePassword(length = 12) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  static createEmailRecord(email, password, ttlHours = 24) {
    const record = {
      email,
      password,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttlHours * 60 * 60 * 1000),
      messages: [],
      isActive: true
    };
    
    emailStore.set(email, record);
    return record;
  }

  static getEmailRecord(email) {
    const record = emailStore.get(email);
    if (!record) return null;
    
    // Check if expired
    if (Date.now() > record.expiresAt) {
      emailStore.delete(email);
      return null;
    }
    
    return record;
  }

  static addMessageToEmail(email, message) {
    const record = this.getEmailRecord(email);
    if (!record) return false;
    
    const messageId = crypto.randomBytes(8).toString('hex');
    const fullMessage = {
      id: messageId,
      ...message,
      receivedAt: new Date().toISOString(),
      read: false
    };
    
    record.messages.unshift(fullMessage);
    
    // Keep only last 100 messages
    if (record.messages.length > 100) {
      record.messages = record.messages.slice(0, 100);
    }
    
    // Store in message store for quick access
    messageStore.set(messageId, { email, ...fullMessage });
    
    return messageId;
  }

  static getMessages(email) {
    const record = this.getEmailRecord(email);
    return record ? record.messages : [];
  }

  static getMessage(messageId) {
    return messageStore.get(messageId) || null;
  }

  static markAsRead(email, messageId) {
    const record = this.getEmailRecord(email);
    if (!record) return false;
    
    const messageIndex = record.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      record.messages[messageIndex].read = true;
      return true;
    }
    
    const globalMessage = messageStore.get(messageId);
    if (globalMessage && globalMessage.email === email) {
      globalMessage.read = true;
      return true;
    }
    
    return false;
  }

  static deleteEmail(email) {
    const record = emailStore.get(email);
    if (record) {
      // Remove all messages from message store
      record.messages.forEach(msg => {
        messageStore.delete(msg.id);
      });
    }
    emailStore.delete(email);
    return true;
  }

  static cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [email, record] of emailStore.entries()) {
      if (now > record.expiresAt) {
        this.deleteEmail(email);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  static getStats() {
    this.cleanupExpired();
    return {
      totalEmails: emailStore.size,
      totalMessages: messageStore.size,
      activeSince: new Date().toLocaleString()
    };
  }
}

module.exports = TempEmailUtils;
