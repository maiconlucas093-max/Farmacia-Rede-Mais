
// Conexão oficial da Drogaria Rede Mais com o Supabase
(() => {
    const SUPABASE_URL =
    "https://fwcfuxsvwexpuxozpkuj.supabase.co";
  
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Ba1XXaQ7tFaZg7ebr78rYg_uQas1i7D";
  if (!window.supabase?.createClient) {
    console.error("Biblioteca Supabase não carregada.");
    return;
  }

  window.redeMaisSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );

  console.log("Conexão Supabase preparada.");
})();
