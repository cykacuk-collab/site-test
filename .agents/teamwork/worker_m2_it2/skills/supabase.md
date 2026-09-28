# Supabase Skill (Local Workspace Copy)
Source: c:\Users\Peli911GT\Desktop\site ma\.agents\skills\supabase\SKILL.md

Core Methodology:
- Verify against changelog and current docs; run test queries to confirm changes.
- Ensure proper table exposure to Data API: anon and authenticated roles need explicit GRANTs if not automatically exposed.
- Enable RLS on public schema tables; use `TO authenticated` with ownership predicate (`(select auth.uid()) = user_id`), not deprecated `auth.role()`.
- Never expose service_role or secret keys on public clients.
- Handle database errors, RLS surprises, and permission denied (42501) cleanly.
