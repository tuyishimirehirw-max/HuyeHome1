// api/properties/index.js
const { supabase } = require('../../lib/supabase');
const { successResponse, errorResponse } = require('../../lib/response');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }
  
  try {
    const { page = 1, limit = 12, property_type, sector, min_price, max_price, listing_type } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('properties')
      .select('*, property_images(image_url, is_primary)', { count: 'exact' })
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (property_type) query = query.eq('property_type', property_type);
    if (sector) query = query.eq('sector', sector);
    if (listing_type) query = query.eq('listing_type', listing_type);
    if (min_price) query = query.gte('price', min_price);
    if (max_price) query = query.lte('price', max_price);
    
    const { data: properties, error, count } = await query;
    
    if (error) throw error;
    
    successResponse(res, 200, 'Properties retrieved', {
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    errorResponse(res, 500, 'Failed to retrieve properties');
  }
};