#!/bin/sh
set -e

echo "==> Generating Prisma Client..."
npx prisma generate

echo "==> Running migrations..."
if npx prisma migrate deploy 2>&1; then
  echo "==> Migrations applied successfully."
else
  EXIT_CODE=$?
  echo ""
  echo "!!! Migration failed (exit code $EXIT_CODE)."

  # In production, do NOT auto-resolve — fail hard so it's noticed
  if [ "$NODE_ENV" = "production" ]; then
    echo "!!! PRODUCTION: Refusing to auto-resolve. Fix migrations manually before restarting."
    echo "!!! Inspect the _prisma_migrations table for failed records."
    echo "!!! To resolve: docker exec <db-container> psql -U postgres -d <db> -c \"DELETE FROM _prisma_migrations WHERE finished_at IS NULL;\""
    exit 1
  fi

  # Dev only: attempt auto-resolve of failed migrations
  echo "!!! DEV: Attempting auto-resolve of failed migrations..."

  # Delete failed migration records (finished_at IS NULL = started but never completed)
  npx prisma db execute --schema prisma/schema.prisma --stdin <<'SQL' || true
DELETE FROM _prisma_migrations WHERE finished_at IS NULL;
SQL

  echo "==> Retrying migrations..."
  if npx prisma migrate deploy 2>&1; then
    echo "==> Migrations applied successfully on retry."
  else
    echo ""
    echo "!!! Migration failed again after auto-resolve."
    echo "!!! Manual intervention required. Starting app anyway so you can debug."
    echo "!!! Connect to the DB and inspect _prisma_migrations table."
  fi
fi

echo "==> Starting application..."
exec "$@"
