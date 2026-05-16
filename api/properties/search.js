// api/properties/search.js
const { supabase } = require('../../lib/supabase');
const { successResponse, errorResponse } = require('../../lib/response');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }
  
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return errorResponse(res, 400, 'Search query must be at least 2 characters');
    }
    
    // Full-text search on title and description
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*, property_images(image_url, is_primary)')
      .eq('status', 'available')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    successResponse(res, 200, 'Search results', properties);
  } catch (error) {
    console.error('Search error:', error);
    errorResponse(res, 500, 'Search failed');
  }
};