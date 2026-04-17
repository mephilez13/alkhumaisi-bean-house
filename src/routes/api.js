const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { supabase } = require('../config/database');
const multer = require('multer');
const path = require('path');

// Image upload config: Use Memory Storage for Supabase
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Helper function to upload to Supabase Storage
async function uploadToSupabase(file) {
  const filename = `product-${Date.now()}${path.extname(file.originalname)}`;
  
  const { data, error } = await supabase.storage
    .from('products')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('products')
    .getPublicUrl(filename);

  return publicData.publicUrl;
}

// ========== PRODUCTS (Admin) ==========
router.get('/products', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, unit, stock, description, sort_order } = req.body;
    
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file);
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        { 
          name, 
          category: category || 'Arabica', 
          price: parseFloat(price), 
          unit: unit || 'gr', 
          stock: parseFloat(stock || 0), 
          description: description || '', 
          image: imageUrl, 
          sort_order: parseInt(sort_order || 0) 
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/products/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, unit, stock, description, is_active, sort_order } = req.body;
    
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Produk tidak ditemukan' });

    let imageUrl = existing.image;
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file);
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        name: name || existing.name,
        category: category || existing.category,
        price: price !== undefined ? parseFloat(price) : existing.price,
        unit: unit || existing.unit,
        stock: stock !== undefined ? parseFloat(stock) : existing.stock,
        description: description ?? existing.description,
        image: imageUrl,
        is_active: is_active !== undefined ? (is_active === '1' || is_active === true) : existing.is_active,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : existing.sort_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/products/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SETTINGS (Admin) ==========
router.get('/settings', auth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) throw error;

    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const updates = Object.entries(req.body).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    const { error } = await supabase
      .from('settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) throw error;
    res.json({ message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
