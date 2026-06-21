BEGIN;

UPDATE products
SET
  price = CASE
    WHEN id = 'prod-bloomia-yearly' THEN 990000
    WHEN id = 'prod-bloomia-lifetime' THEN 2500000
    ELSE price
  END,
  active = TRUE
WHERE id IN ('prod-bloomia-yearly', 'prod-bloomia-lifetime');

COMMIT;
