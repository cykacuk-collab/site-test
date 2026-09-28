# Supabase Skill Reference Copy
Source: c:\Users\Peli911GT\Desktop\site ma\.agents\skills\supabase\SKILL.md
Methodology:
- Verify against changelog and current docs
- Never expose service_role or secret keys in public clients
- In server endpoints, use serverSupabaseServiceRole(event) for privileged administrative operations
- RLS in exposed schemas: enable RLS on every table in public schema
- Security Definer functions in public are callable by all roles unless explicitly revoked and search_path is set
