import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: invData } = await supabase.from('inventory_logs').select('*').limit(20).order('date', {ascending: false});
  console.log("INV", invData);

  const { data: rmData } = await supabase.from('rm_logs').select('*').limit(20).order('created_at', {ascending: false});
  console.log("RM", JSON.stringify(rmData, null, 2));
}
check();
