const TempEmailUtils = require('./utils.js');

exports.handler = async (event, context) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };
    
    // Parse query parameters
    const { email, password, message_id, mark_read } = event.queryStringParameters;
    
    // Check if email exists
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Email parameter is required'
        }, null, 2)
      };
    }
    
    const record = TempEmailUtils.getEmailRecord(email);
    
    if (!record) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Email not found or expired'
        }, null, 2)
      };
    }
    
    // Verify password if provided
    if (password && record.password !== password) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid password'
        }, null, 2)
      };
    }
    
    // Get specific message
    if (message_id) {
      const message = TempEmailUtils.getMessage(message_id);
      
      if (!message || message.email !== email) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Message not found'
          }, null, 2)
        };
      }
      
      // Mark as read if requested
      if (mark_read === 'true' || mark_read === '1') {
        TempEmailUtils.markAsRead(email, message_id);
        message.read = true;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: message
        }, null, 2)
      };
    }
    
    // Get all messages
    const messages = TempEmailUtils.getMessages(email);
    
    // Calculate stats
    const unreadCount = messages.filter(msg => !msg.read).length;
    const totalCount = messages.length;
    
    // Return inbox data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email: email,
        created_at: new Date(record.createdAt).toISOString(),
        expires_at: new Date(record.expiresAt).toISOString(),
        expires_in_hours: Math.round((record.expiresAt - Date.now()) / (60 * 60 * 1000)),
        stats: {
          total_messages: totalCount,
          unread_messages: unreadCount,
          read_messages: totalCount - unreadCount
        },
        messages: messages.map(msg => ({
          id: msg.id,
          from: msg.from,
          subject: msg.subject,
          received_at: msg.receivedAt,
          read: msg.read,
          preview: msg.text ? msg.text.substring(0, 100) + '...' : 'No content'
        }))
      }, null, 2)
    };
    
  } catch (error) {
    console.error('Error checking inbox:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to check inbox',
        message: error.message
      }, null, 2)
    };
  }
};
