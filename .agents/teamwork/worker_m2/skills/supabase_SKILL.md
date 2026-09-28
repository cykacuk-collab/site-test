# Supabase Skill Reference (worker_m2 copy)
Source: .agents/skills/supabase/SKILL.md

Key concepts applied for Milestone 2:
1. Privileged server operations:
   - Use `serverSupabaseServiceRole(event)` from `@nuxtjs/supabase` on server-side endpoints to access database with service role, bypassing RLS lockdown cleanly without 42501 permission errors.
   - Do NOT expose service role to client.
2. Auth verification:
   - Check if user is authenticated and has admin rights, but support dev mode fallback (`if (process.dev) ...`).
3. Database queries:
   - Query `orders` with joins `order_items(..., products(...))`
   - Clean status updates with validation.
