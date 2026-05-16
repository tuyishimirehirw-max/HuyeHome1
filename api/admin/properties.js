// api/admin/properties.js
const { supabaseAdmin } = require('../../lib/supabase');
const { authenticateToken, isAdmin } = require('../../lib/auth');
const { successResponse, errorResponse } = require('../../lib/response');
const slugify = require('slugify');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Verify authentication
  const user = await authenticateToken(req);
  if (!user) {
    return errorResponse(res, 401, 'Unauthorized');
  }
  
  if (!isAdmin(user)) {
    return errorResponse(res, 403, 'Admin access required');
  }
  
  try {
    // GET - List all properties (admin view)
    if (req.method === 'GET') {
      const { page = 1, limit = 20, status, type } = req.query;
      const offset = (page - 1) * limit;
      
      let query = supabaseAdmin
        .from('properties')
        .select('*, profiles(username)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (status) query = query.eq('status', status);
      if (type) query = query.eq('property_type', type);
      
      const { data: properties, error, count } = await query;
      
      if (error) throw error;
      
      return successResponse(res, 200, 'Properties retrieved', {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    }
    
    // POST - Create new property
    if (req.method === 'POST') {
      const propertyData = req.body;
      
      // Generate slug
      const baseSlug = slugify(propertyData.title, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists
      while (true) {
        const { data: existing } = await supabaseAdmin
          .from('properties')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      const { data: property, error } = await supabaseAdmin
        .from('properties')
        .insert({
          ...propertyData,
          slug,
          created_by: user.id,
          price: parseFloat(propertyData.price),
          size: propertyData.size ? parseFloat(propertyData.size) : null,
          is_featured: propertyData.is_featured === 'true',
          is_verified: propertyData.is_verified === 'true'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add features if provided
      if (propertyData.features && Array.isArray(propertyData.features)) {
        const featuresData = propertyData.features.map(featureId => ({
          property_id: property.id,
          feature_id: featureId
        }));
        
        await supabaseAdmin
          .from('property_features')
          .insert(featuresData);
      }
      
      return successResponse(res, 201, 'Property created', property);
    }
    
    return errorResponse(res, 405, 'Method not allowed');
  } catch (error) {
    console.error('Error:', error);
    errorResponse(res, 500, 'Operation failed');
  }
};