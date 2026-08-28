import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gpbeetknavfgmioaevtw.supabase.co', 'sb_publishable_YrvuGAWUdEZ0jZDPcZY7bg_YALorXNq');

async function test() {
  const { data, error } = await supabase.from('tournaments').select('*').limit(1);
  console.log("Tournaments:", data, error);
}

test();
