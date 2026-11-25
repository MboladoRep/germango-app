// ===== Supabase (opcional; ahora mismo no se usa para nada más) =====
// La clave "anon" es pública por diseño; asegúrate de tener RLS activado en Supabase.
const SUPABASE_URL = 'https://eofolsrnycdiioobpihq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZm9sc3JueWNkaWlvb2JwaWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTE1NDgsImV4cCI6MjA4ODg4NzU0OH0.rIma6h2uA3vmUj-NxtYODKdwS9AZHk646awFiQsCFbA';

let _supabase;
if (SUPABASE_URL && SUPABASE_URL !== 'TU_URL') {
  try { _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }
  catch (e) { console.log('Supabase init failed, using local engine.'); }
}
