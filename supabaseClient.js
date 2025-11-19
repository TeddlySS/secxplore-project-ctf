import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://nbyvljvcqenorufrkfss.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieXZsanZjcWVub3J1ZnJrZnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDIwMzAsImV4cCI6MjA3OTExODAzMH0.E9Yvzp6CwKa7ycW4qFBm0ZZ3tx3dCyPEfyplLBo3_Vo';

// สร้าง client ตัวเดียวให้ทุกหน้า import ไปใช้

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
