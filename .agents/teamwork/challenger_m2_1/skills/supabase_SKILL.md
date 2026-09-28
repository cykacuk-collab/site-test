# Supabase Skill Summary
Path: c:\Users\Peli911GT\Desktop\site ma\.agents\skills\supabase\SKILL.md
Methodology:
- Check for breaking changes and verify against current Supabase conventions.
- Never use user_metadata in authorization or RLS.
- Use TO authenticated / TO anon instead of auth.role().
- Avoid RLS traps: UPDATE needs SELECT policy, UPDATE needs both USING and WITH CHECK.
- serverSupabaseServiceRole bypasses RLS safely on server side when needed for admin operations.
- Never expose service_role key to client.
