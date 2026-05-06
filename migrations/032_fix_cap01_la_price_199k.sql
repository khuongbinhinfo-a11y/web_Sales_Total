-- Migration 032: Fix cap01_grade_la_1year price from 299000 to 199000
-- Created: 2026-05-06
-- Reason: Lop La is priced at 199000 as per release plan. Migration 029 inserted
--         with price 299000 incorrectly. This migration corrects it.

UPDATE products
SET price = 199000,
    updated_at = NOW()
WHERE id = 'cap01_grade_la_1year'
  AND price = 299000;
