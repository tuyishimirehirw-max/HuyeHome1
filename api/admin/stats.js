// api/admin/stats.js
const { supabaseAdmin } = require('../../lib/supabase');
const { authenticateToken, isAdmin } = require('../../lib/auth');
const { successResponse, errorResponse } = require('../../lib/response');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }
  
  const user = await authenticateToken(req);
  if (!user) return errorResponse(res, 401, 'Unauthorized');
  if (!isAdmin(user)) return errorResponse(res, 403, 'Admin access required');
  
  try {
    const [totalProps, availableProps, soldProps, totalInquiries, newInquiries, featuredProps, totalViews, avgPrice] = await Promise.all([
      supabaseAdmin.from('properties').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'available'),
      supabaseAdmin.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
      supabaseAdmin.from('inquiries').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabaseAdmin.from('properties').select('*', { count: 'exact', head: true }).eq('is_featured', true),
      supabaseAdmin.from('properties').select('views_count'),
      supabaseAdmin.from('properties').select('price').eq('status', 'available')
    ]);
    
    const totalViewsSum = totalViews.data?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
    const avgPriceValue = avgPrice.data?.length 
      ? avgPrice.data.reduce((sum, p) => sum + p.price, 0) / avgPrice.data.length 
      : 0;
    
    const stats = {
      totalProperties: totalProps.count || 0,
      availableProperties: availableProps.count || 0,
      soldProperties: soldProps.count || 0,
      totalInquiries: totalInquiries.count || 0,
      newInquiries: newInquiries.count || 0,
      featuredProperties: featuredProps.count || 0,
      totalViews: totalViewsSum,
      averagePrice: Math.round(avgPriceValue)
    };
    
    successResponse(res, 200, 'Dashboard stats', stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    errorResponse(res, 500, 'Failed to fetch stats');
  }
};