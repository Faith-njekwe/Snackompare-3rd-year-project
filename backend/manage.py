#!/usr/bin/env python
import os
from pathlib import Path
import sys

from dotenv import load_dotenv


def main():
  """Run administrative tasks."""

   # Load .env from the same folder as manage.py
  BASE_DIR = Path(__file__).resolve().parent
  load_dotenv(BASE_DIR / ".env")
  
  os.environ.setdefault("DJANGO_SETTINGS_MODULE", "snackompare_backend.settings")
  try:
    from django.core.management import execute_from_command_line
  except ImportError as exc:
    raise ImportError(
      "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH?"
    ) from exc
  execute_from_command_line(sys.argv)


if __name__ == "__main__":
  main()
