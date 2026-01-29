#!/usr/bin/env python3
"""
Toy MPI example for SLURM multi-node jobs.

This script demonstrates basic MPI concepts:
- Rank identification (which process am I?)
- Size (how many processes total?)
- Point-to-point communication
- Collective operations (reduce, gather)

Usage:
    srun --mpi=pmix python mpi.py --input data.txt --output results/output.dat
"""

import argparse
import os
from pathlib import Path

from mpi4py import MPI


def main():
    parser = argparse.ArgumentParser(description='Toy MPI example')
    parser.add_argument('--input', type=str, default='data.txt', help='Input file path')
    parser.add_argument('--output', type=str, default='results/output.dat', help='Output file path')

    args = parser.parse_args()

    # Initialize MPI
    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()

    # Get hostname for this rank
    hostname = MPI.Get_processor_name()

    # Print rank information (only rank 0 prints summary)
    if rank == 0:
        print(f"MPI job running with {size} processes")
        print(f"Output will be written by rank 0")
        print("-" * 60)

    print(f"Rank {rank}/{size-1} running on {hostname}")

    # Simple computation: each rank computes a value
    # In a real application, this would be your actual computation
    local_value = rank * 10 + 5
    print(f"Rank {rank}: computed local_value = {local_value}")

    # Example 1: Reduce operation (sum all local values)
    total_sum = comm.reduce(local_value, op=MPI.SUM, root=0)
    if rank == 0:
        print(f"\nSum of all local values: {total_sum}")

    # Example 2: Gather operation (collect all values)
    all_values = comm.gather(local_value, root=0)
    if rank == 0:
        print(f"All values gathered: {all_values}")

    # Example 3: Broadcast (rank 0 sends data to all)
    if rank == 0:
        message = f"Hello from rank 0! Total processes: {size}"
    else:
        message = None

    message = comm.bcast(message, root=0)
    print(f"Rank {rank} received broadcast: {message}")

    # Rank 0 reads input file (if it exists) and writes output
    if rank == 0:
        input_path = Path(args.input)
        input_info = "No input file provided"
        if input_path.exists():
            input_info = f"Input file: {input_path} (exists)"
        else:
            input_info = f"Input file: {input_path} (not found, using defaults)"

        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            f.write(f"MPI Job Results\n")
            f.write("=" * 60 + "\n")
            f.write(f"{input_info}\n")
            f.write(f"Total processes: {size}\n")
            f.write(f"Sum of all values: {total_sum}\n")
            f.write(f"All values: {all_values}\n")
            f.write(f"Computed on node: {hostname}\n")

        print(f"\n{input_info}")
        print(f"Output saved to: {output_path}")
        print("Done!")


if __name__ == '__main__':
    main()
