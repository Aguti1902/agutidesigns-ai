import { createClient } from '@supabase/supabase-js';

// anon key and project URL are public by design (present in every browser request)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xzyhrloiwapbrqmglxeo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eWhybG9pd2FwYnJxbWdseGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Mzk2NjIsImV4cCI6MjA4NjMxNTY2Mn0.6Mn9Bpo6xffHkBj-DYVBsgXhQmFq9pXZ5QsiewuGOV4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});
