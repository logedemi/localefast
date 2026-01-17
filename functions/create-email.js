const TempEmailUtils = require('./utils.js');

exports.handler = async (event, context) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    // Get custom domain from environment or request
    const domain = process.env.CUSTOM_DOMAIN || 
                   event.headers.host || 
                   'temp.email.com';
    
    // Extract subdomain if present
    const cleanDomain = domain.replace('www.', '');
    const emailDomain = `temp.${cleanDomain}`;
    
    // Generate email
    const email = TempEmailUtils.generateRandomEmail(emailDomain);
    const password = TempEmailUtils.generatePassword();
    
    // Create record
    TempEmailUtils.createEmailRecord(email, password, 24); // 24 hours
    
    // Return response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email: email,
        password: password,
        expires_in: '24 jam',
        created_at: new Date().toISOString(),
        inbox_url: `https://${cleanDomain}/inbox.html?email=${encodeURIComponent(email)}`,
        api_url: `https://${cleanDomain}/.netlify/functions/check-inbox?email=${encodeURIComponent(email)}`
      }, null, 2)
    };
    
  } catch (error) {
    console.error('Error creating email:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create email',
        message: error.message
      }, null, 2)
    };
  }
};
