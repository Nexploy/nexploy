-- Remap legacy roles to the new GitLab-style role hierarchy (guest < developer < admin).
-- 'admin' and 'system' are intentionally left unchanged.
UPDATE "user"
SET "role" = CASE "role"
    WHEN 'readWrite' THEN 'developer'
    WHEN 'read' THEN 'guest'
    ELSE "role"
END
WHERE "role" IN ('readWrite', 'read');
