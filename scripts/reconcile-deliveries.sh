#!/usr/bin/env bash
set -euo pipefail

reconcile_lock=/run/lock/planetaketo-delivery-reconcile.lock
exec 9>"$reconcile_lock"
flock -n 9 || exit 0

cd /apps/planetaketo
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config --import tsx scripts/reconcile-deliveries.ts
