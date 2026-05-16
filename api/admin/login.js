// api/admin/login.js
const { supabase, supabaseAdmin } = require('../../lib/supabase');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);

    // Fetch profile including email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      console.log('Profile not found:', profileError);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!profile.email) {
      console.log('Profile has no email set');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Authenticate with Supabase Auth using the email from profile
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password
    });

    if (authError || !authData.user) {
      console.log('Auth error:', authError);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!profile.is_active) {
      return res.status(401).json({ success: false, message: 'Account inactive' });
    }

    const token = jwt.sign(
      { id: profile.id, username: username, role: profile.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: profile.id,
          username: username,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};