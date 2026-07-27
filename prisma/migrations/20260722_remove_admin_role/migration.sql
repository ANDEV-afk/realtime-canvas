-- AlterEnum
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT IF EXISTS "WorkspaceMember_role_check";

-- Migrate existing ADMIN roles to EDITOR
UPDATE "WorkspaceMember" SET role = 'EDITOR' WHERE role = 'ADMIN';

-- Recreate the enum without ADMIN
ALTER TYPE "WorkspaceRole" ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE "WorkspaceRole" ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE "WorkspaceRole" ADD VALUE IF NOT EXISTS 'VIEWER';

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_role_check" CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER'));
