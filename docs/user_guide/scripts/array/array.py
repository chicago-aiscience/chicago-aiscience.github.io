#!/usr/bin/env python3
"""
Toy example for SLURM job arrays.

This script processes a specific element from an input file based on
SLURM_ARRAY_TASK_ID. Each array task processes one line/element.

Usage:
    python array.py --input inputs.txt --output outputs/result_0.txt
"""

import argparse
import json
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description='Process array task')
    parser.add_argument('--input', type=str, required=True, help='Input file path')
    parser.add_argument('--output', type=str, required=True, help='Output file path')

    args = parser.parse_args()

    # Get the array task ID from SLURM environment variable
    task_id = os.environ.get('SLURM_ARRAY_TASK_ID')
    if task_id is None:
        print("Warning: SLURM_ARRAY_TASK_ID not set. Using 0 as default.")
        task_id = '0'

    task_id = int(task_id)
    print(f"Processing array task: {task_id}")

    # Read input file (supports both JSON and text files)
    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # Check if file is JSON
    if input_path.suffix.lower() == '.json':
        with open(input_path, 'r') as f:
            data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("JSON file must contain an array")
        elements = data
    else:
        # Read as text file (one element per line)
        with open(input_path, 'r') as f:
            elements = [line.strip() for line in f.readlines() if line.strip()]

    # Check if task_id is valid
    if task_id >= len(elements):
        raise IndexError(f"Task ID {task_id} exceeds number of elements ({len(elements)}) in input file")

    # Get the element for this task
    element = elements[task_id]
    print(f"Processing element {task_id}: {element}")

    # Simple processing: just uppercase and add some info
    # (Replace this with your actual processing logic)
    processed = element.upper()
    result = f"Task {task_id} processed: {processed}\n"

    # Create output directory if needed
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write output
    with open(output_path, 'w') as f:
        f.write(result)
        f.write(f"Original: {element}\n")
        f.write(f"Processed: {processed}\n")

    print(f"Output saved to: {output_path}")
    print("Done!")


if __name__ == '__main__':
    main()
