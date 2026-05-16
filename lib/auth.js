// lib/auth.js
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./supabase');

const authenticateToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user || !user.is_active) return null;
    
    return user;
  } catch (error) {
    return null;
  }
};

const isAdmin = (user) => {
  return user && user.role === 'admin';
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { authenticateToken, isAdmin, generateToken };