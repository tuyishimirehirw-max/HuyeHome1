// api/upload.js
const { supabaseAdmin } = require('../lib/supabase');
const { authenticateToken, isAdmin } = require('../lib/auth');
const { uploadImage } = require('../lib/storage');
const { successResponse, errorResponse } = require('../lib/response');

// Vercel requires raw body parsing for file uploads
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed');
  }
  
  const user = await authenticateToken(req);
  if (!user) return errorResponse(res, 401, 'Unauthorized');
  if (!isAdmin(user)) return errorResponse(res, 403, 'Admin access required');
  
  try {
    // In Vercel serverless, you need to parse multipart form data manually.
    // For simplicity, we'll assume the frontend sends base64 or we use a library like 'multiparty'.
    // Here's a minimal version using the 'raw' body (you may need to adjust).
    // Alternatively, use a service like Vercel Blob or upload directly to Supabase Storage from client.
    
    // For now, return error indicating that uploads need additional setup.
    // I'll provide a better solution: upload directly from browser to Supabase Storage.
    return errorResponse(res, 501, 'Server-side upload not implemented. Use client-side upload to Supabase Storage.');
    
    /* Example of client-side upload to Supabase:
       const { data, error } = await supabase.storage
         .from('property-images')
         .upload(`properties/${propertyId}/${file.name}`, file);
    */
  } catch (error) {
    console.error('Upload error:', error);
    errorResponse(res, 500, 'Upload failed');
  }
};