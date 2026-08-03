import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://uxkcdlgdvdcoxhufbtlx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4a2NkbGdkdmRjb3hodWZidGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzgwNTgsImV4cCI6MjEwMTAxNDA1OH0.scm9cnqv-owmh95_QdOQenvLr50-XOhfW_Lv78nlEDU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.from('struktur_organisasi').select('*');
  console.log(JSON.stringify({data, error}, null, 2));
}
run();
