// api/properties/[slug].js
const { supabase, supabaseAdmin } = require('../../lib/supabase');
const { successResponse, errorResponse } = require('../../lib/response');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }
  
  try {
    const { slug } = req.query;
    
    // Get property with details
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images(*),
        property_features(features(*)),
        profiles(full_name, username)
      `)
      .eq('slug', slug)
      .single();
    
    if (error || !property) {
      return errorResponse(res, 404, 'Property not found');
    }
    
    // Increment view count (use admin client to bypass RLS for update)
    await supabaseAdmin
      .from('properties')
      .update({ views_count: property.views_count + 1 })
      .eq('id', property.id);
    
    // Format features
    const features = property.property_features?.map(pf => pf.features) || [];
    
    const formattedProperty = {
      ...property,
      features,
      property_features: undefined
    };
    
    successResponse(res, 200, 'Property retrieved', formattedProperty);
  } catch (error) {
    console.error('Error:', error);
    errorResponse(res, 500, 'Failed to retrieve property');
  }
};