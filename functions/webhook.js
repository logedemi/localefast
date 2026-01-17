const TempEmailUtils = require('./utils.js');

exports.handler = async (event, context) => {
  try {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    // Parse incoming email data
    let emailData;
    try {
      emailData = JSON.parse(event.body);
    } catch (e) {
      // Try form-encoded data
      const params = new URLSearchParams(event.body);
      emailData = {
        to: params.get('to') || params.get('recipient'),
        from: params.get('from') || params.get('sender'),
        subject: params.get('subject'),
        text: params.get('text') || params.get('body-plain'),
        html: params.get('html') || params.get('body-html')
      };
    }
    
    // Validate required fields
    if (!emailData.to) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing recipient (to) field' })
      };
    }
    
    // Extract email from "to" field (handle "Name <email>" format)
    const toMatch = emailData.to.match(/<([^>]+)>/) || [null, emailData.to];
    const toEmail = toMatch[1] || emailData.to;
    
    // Check if email exists in our system
    const record = TempEmailUtils.getEmailRecord(toEmail);
    
    if (!record) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'Email not found',
          received_email: toEmail 
        })
      };
    }
    
    // Add message to inbox
    const messageId = TempEmailUtils.addMessageToEmail(toEmail, {
      from: emailData.from,
      subject: emailData.subject || '(No subject)',
      text: emailData.text || '',
      html: emailData.html || ''
    });
    
    console.log(`New message received for ${toEmail}: ${messageId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message_id: messageId,
        delivered: true,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Webhook error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
