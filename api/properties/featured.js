// api/properties/featured.js
const { supabase } = require('../../lib/supabase');
const { successResponse, errorResponse } = require('../../lib/response');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }
  
  try {
    const { limit = 6 } = req.query;
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*, property_images(image_url, is_primary, alt_text)')
      .eq('status', 'available')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    // Transform data for frontend
    const formattedProperties = properties.map(prop => ({
      ...prop,
      primary_image: prop.property_images?.find(img => img.is_primary)?.image_url || prop.property_images?.[0]?.image_url,
      images: prop.property_images
    }));
    
    successResponse(res, 200, 'Featured properties retrieved', formattedProperties);
  } catch (error) {
    console.error('Error:', error);
    errorResponse(res, 500, 'Failed to retrieve featured properties');
  }
};