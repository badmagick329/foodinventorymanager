#!/bin/sh

npx prisma migrate deploy

# Run the CMD
exec "$@"
