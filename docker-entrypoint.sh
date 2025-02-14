#!/bin/sh
source venv2/bin/activate
exec python backup_server.py "$@"
