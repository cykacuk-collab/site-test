# Supabase Skill Copy for Challenger
(Refer to original at c:\Users\Peli911GT\Desktop\site ma\.agents\skills\supabase\SKILL.md)
Core methodology:
- Verify against changelog and docs before implementing.
- Verify your work with empirical test queries.
- Never use user_metadata for authorization (use app_metadata).
- Avoid exposing service_role or secret keys in public clients.
- Handle RLS and grants explicitly.
