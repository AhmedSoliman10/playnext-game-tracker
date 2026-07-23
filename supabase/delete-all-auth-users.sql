-- Use this only when you intentionally want to remove all PlayNext accounts.
-- It deletes Auth users; profile, library, ratings, follows, and activity rows
-- cascade through the foreign-key constraints.
delete from auth.users;
