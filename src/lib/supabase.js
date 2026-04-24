import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cmhfcnnmygniglqvfqqc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtaGZjbm5teWduaWdscXZmcXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzUxMTgsImV4cCI6MjA5MjAxMTExOH0.VTW44RhBfLSP0CXyUpVh54CAN0yalyXoc5QLf2vfcPQ'  // ← paste your full anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const ADMIN_EMAIL = 'jkchintamani003@gmail.com'