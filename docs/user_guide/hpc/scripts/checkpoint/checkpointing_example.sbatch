#!/bin/bash
#SBATCH --job-name=checkpointing_example
##SBATCH --account=<PI_ACCOUNT>    # <-- change to an allowed account on your cluster - RCC CLUSTER ONLY (uncomment if needed)
#SBATCH --partition=<PARTITION>    # <-- change to an allowed partition on your cluster
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=4G
#SBATCH --time=00:10:00
#SBATCH --output=/path/to/logs/%x_%j.out
#SBATCH --error=/path/to/logs/%x_%j.err
#SBATCH --signal=USR2@60        # send SIGUSR2 60s before wall-time kill

python checkpointing_example.py