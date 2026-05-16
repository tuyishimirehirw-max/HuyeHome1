// api/inquiries/index.js
const { supabase } = require('../../lib/supabase');
const { successResponse, errorResponse } = require('../../lib/response');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed');
  }
  
  try {
    const { property_id, name, email, phone, message } = req.body;
    
    // Validate
    if (!name || !phone || !message) {
      return errorResponse(res, 400, 'Name, phone, and message are required');
    }
    
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        property_id: property_id || null,
        name,
        email: email || null,
        phone,
        message,
        status: 'new'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Optional: Send notification email/WhatsApp here
    
    successResponse(res, 201, 'Inquiry submitted successfully', inquiry);
  } catch (error) {
    console.error('Error:', error);
    errorResponse(res, 500, 'Failed to submit inquiry');
  }
};