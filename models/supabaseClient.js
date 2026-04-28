// ==========================================
// SUPABASE CONFIGURATION (MVC)
// ==========================================
const supabaseUrl = 'https://vaofuynoyyzlvqxfebxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhb2Z1eW5veXl6bHZxeGZlYnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzY5MjMsImV4cCI6MjA5MjkxMjkyM30.nkWOEPa1nLj0Tg4J11mh3t-jQIWMtDk6tfCIAnnN3R8';

export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
