const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Public: Get active products (no auth needed)
router.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Public products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public: Get settings (no auth needed)
router.get('/settings', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) throw error;

    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (error) {
    console.error('Public settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
