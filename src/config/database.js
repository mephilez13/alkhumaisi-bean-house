const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
  console.warn('⚠️  Supabase credentials belum dikonfigurasi. API tidak akan berfungsi.');
  console.warn('⚠️  Silakan isi SUPABASE_URL dan SUPABASE_KEY di file .env');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase connected');
}

module.exports = { supabase };
