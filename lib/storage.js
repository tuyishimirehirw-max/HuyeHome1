// lib/storage.js
const { supabaseAdmin } = require('./supabase');

const uploadImage = async (file, propertyId, isPrimary = false) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `properties/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('property-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('property-images')
      .getPublicUrl(filePath);
    
    // Save to database
    const { data: imageRecord, error: dbError } = await supabaseAdmin
      .from('property_images')
      .insert({
        property_id: propertyId,
        image_url: publicUrl,
        storage_path: filePath,
        is_primary: isPrimary,
        alt_text: `${propertyId}-image`
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    return imageRecord;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

const deleteImage = async (imageId, storagePath) => {
  // Delete from storage
  await supabaseAdmin.storage
    .from('property-images')
    .remove([storagePath]);
  
  // Delete from database
  await supabaseAdmin
    .from('property_images')
    .delete()
    .eq('id', imageId);
};

module.exports = { uploadImage, deleteImage };