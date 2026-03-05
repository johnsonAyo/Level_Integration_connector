#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit push
echo "Migrations complete."

echo "Starting application..."
exec node dist/src/main.js
