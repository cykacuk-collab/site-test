# Supabase Postgres Best Practices Reference Copy
Source: c:\Users\Peli911GT\Desktop\site ma\.agents\skills\supabase-postgres-best-practices\SKILL.md
Methodology:
- Follow standard Postgres DDL/DCL conventions
- Table grants (GRANT ALL ON TABLE ... TO service_role)
- Idempotent policies and constraints
- SET search_path = public on SECURITY DEFINER functions to prevent hijacking
