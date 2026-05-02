-- Migration: Add Public Route Registry and Route Locking System
-- Purpose: Support multi-branch route locking with exact/branch scope rules
-- Replaces: Hardcoded mauDemoLocked boolean with data-driven route registry

BEGIN;

-- ═══════════════════ TABLE: PUBLIC_ROUTE_REGISTRY ═══════════════════
-- Master list of lockable public routes (data-driven configuration)
-- Replaces hardcoded route definitions in main.js and server.js
CREATE TABLE public_route_registry (
  id SERIAL PRIMARY KEY,
  route_id VARCHAR(50) NOT NULL UNIQUE,          -- home, web, demo, software, study, work, guide, contact
  display_name VARCHAR(255) NOT NULL,             -- Vietnamese display name
  path VARCHAR(255) NOT NULL,                     -- Primary route path (/mau-demo, /phan-mem, etc.)
  parent_id VARCHAR(50),                          -- For hierarchy (phan-mem is parent of phan-mem/hoc-tap)
  lockable BOOLEAN NOT NULL DEFAULT TRUE,         -- Whether this route can be locked
  sort_order SMALLINT DEFAULT 0,                  -- UI ordering in admin tree
  description TEXT,                                -- Help text for admins
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════ TABLE: PUBLIC_ROUTE_LOCKS ═══════════════════
-- Lock state overlay for public routes
-- Tracks when each route was locked, by whom, with what message
CREATE TABLE public_route_locks (
  id SERIAL PRIMARY KEY,
  route_id VARCHAR(50) NOT NULL UNIQUE,          -- Reference to public_route_registry.route_id
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,      -- Lock state
  lock_scope VARCHAR(20) NOT NULL DEFAULT 'exact',  -- 'exact' (only this route) or 'branch' (this + children)
  lock_message TEXT,                              -- Custom message shown when route is locked
  locked_at TIMESTAMP,                            -- When lock was applied
  locked_by VARCHAR(255),                         -- Admin username who applied lock
  prev_lock_state JSONB,                          -- Backup of previous lock state for audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_route_registry FOREIGN KEY (route_id) 
    REFERENCES public_route_registry(route_id) ON DELETE CASCADE
);

-- ═══════════════════ SEED DATA: 8 PUBLIC MARKETING ROUTES ═══════════════════
-- Initialize registry with all public routes from main.js#383
INSERT INTO public_route_registry (route_id, display_name, path, lockable, sort_order, description)
VALUES
  ('home', 'Trang chủ', '/', TRUE, 0, 'Trang chủ chính'),
  ('web', 'Thiết kế web', '/thiet-ke-web', TRUE, 1, 'Dịch vụ thiết kế website'),
  ('demo', 'Mẫu demo', '/mau-demo', TRUE, 2, 'Mẫu website demo'),
  ('software', 'Phần mềm', '/phan-mem', TRUE, 3, 'Phần mềm bán thành phẩm'),
  ('study', 'Học tập', '/phan-mem/hoc-tap', TRUE, 4, 'Ứng dụng hỗ trợ học tập'),
  ('work', 'Làm việc', '/phan-mem/lam-viec', TRUE, 5, 'Ứng dụng hỗ trợ làm việc'),
  ('guide', 'Hướng dẫn', '/huong-dan', TRUE, 6, 'Tài liệu và hướng dẫn'),
  ('contact', 'Liên hệ', '/lien-he', TRUE, 7, 'Liên hệ hỗ trợ');

-- Initialize all locks as unlocked (ready for locking)
INSERT INTO public_route_locks (route_id, is_locked, lock_scope)
SELECT route_id, FALSE, 'exact' FROM public_route_registry;

-- ═══════════════════ INDEXES FOR PERFORMANCE ═══════════════════
CREATE INDEX idx_public_route_registry_route_id ON public_route_registry(route_id);
CREATE INDEX idx_public_route_registry_parent_id ON public_route_registry(parent_id);
CREATE INDEX idx_public_route_registry_lockable ON public_route_registry(lockable);

CREATE INDEX idx_public_route_locks_route_id ON public_route_locks(route_id);
CREATE INDEX idx_public_route_locks_is_locked ON public_route_locks(is_locked);
CREATE INDEX idx_public_route_locks_locked_at ON public_route_locks(locked_at DESC);

-- ═══════════════════ MIGRATION HELPER TABLE ═══════════════════
-- Track migration status for backward compatibility with mauDemoLocked
CREATE TABLE IF NOT EXISTS public_route_locks_migration (
  id SERIAL PRIMARY KEY,
  migration_key VARCHAR(100) NOT NULL UNIQUE,
  migration_state JSONB,
  migrated_at TIMESTAMP DEFAULT NOW()
);

-- Record migration: mauDemoLocked -> publicRouteLocks
-- This will be checked at app startup to migrate old config if needed
INSERT INTO public_route_locks_migration (migration_key, migration_state)
VALUES ('mau_demo_locked_v1', '{"status":"pending","converted_from":"pageFlags.mauDemoLocked","conversion_date":null}'::jsonb)
ON CONFLICT DO NOTHING;

-- ═══════════════════ GRANT PERMISSIONS ═══════════════════
-- If using specific roles, uncomment:
-- GRANT SELECT ON public_route_registry TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON public_route_locks TO app_user;

COMMIT;
