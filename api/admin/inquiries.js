// api/admin/inquiries.js
const { supabaseAdmin } = require('../../lib/supabase');
const { authenticateToken, isAdmin } = require('../../lib/auth');
const { successResponse, errorResponse } = require('../../lib/response');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const user = await authenticateToken(req);
  if (!user) return errorResponse(res, 401, 'Unauthorized');
  if (!isAdmin(user)) return errorResponse(res, 403, 'Admin access required');
  
  try {
    // GET all inquiries
    if (req.method === 'GET') {
      const { status, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = supabaseAdmin
        .from('inquiries')
        .select('*, properties(title, slug)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (status) query = query.eq('status', status);
      
      const { data: inquiries, error, count } = await query;
      if (error) throw error;
      
      return successResponse(res, 200, 'Inquiries retrieved', {
        inquiries,
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
      });
    }
    
    // PATCH - update inquiry status
    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { status } = req.body;
      
      if (!id || !status) {
        return errorResponse(res, 400, 'Inquiry ID and status required');
      }
      
      const { data, error } = await supabaseAdmin
        .from('inquiries')
        .update({ status, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return successResponse(res, 200, 'Inquiry updated', data);
    }
    
    // DELETE inquiry
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabaseAdmin
        .from('inquiries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return successResponse(res, 200, 'Inquiry deleted');
    }
    
    return errorResponse(res, 405, 'Method not allowed');
  } catch (error) {
    console.error('Error:', error);
    errorResponse(res, 500, 'Operation failed');
  }
};