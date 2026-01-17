const TempEmailUtils = require('./utils.js');

exports.handler = async (event, context) => {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };
    
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST.'
        })
      };
    }
    
    // Parse request body
    const { email, password } = JSON.parse(event.body || '{}');
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Email and password are required'
        })
      };
    }
    
    // Verify email exists and password matches
    const record = TempEmailUtils.getEmailRecord(email);
    
    if (!record) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Email not found'
        })
      };
    }
    
    if (record.password !== password) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid password'
        })
      };
    }
    
    // Delete email
    TempEmailUtils.deleteEmail(email);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email deleted successfully',
        deleted_at: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error deleting email:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete email'
      })
    };
  }
};
