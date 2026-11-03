#!/usr/bin/env python3
"""Run the classroom with the shared simulation engine; default is offline replay."""
from pathlib import Path
import sys

CASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CASE.parent / 'operations'))
from run import main

if __name__ == '__main__':
    main(default_case=CASE)
