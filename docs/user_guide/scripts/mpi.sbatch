#!/bin/bash
# NOTE: Consider enabling SLURM email notifications (see Appendix: SLURM Email Notifications)
#SBATCH --job-name=mpi_example
#SBATCH --partition=general             # <-- change as needed
#SBATCH --nodes=2                       # request 2 nodes (adjust)
#SBATCH --ntasks-per-node=16            # MPI ranks per node (adjust)
#SBATCH --cpus-per-task=1               # often 1 for pure-MPI; adjust for hybrid MPI+OpenMP
#SBATCH --mem=0                         # 0 = use all memory on node (cluster-dependent)
#SBATCH --time=01:00:00
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err

# =====================================
# MPI MULTI-NODE TEMPLATE (ANNOTATED)
# =====================================
# This template assumes Open MPI integrated with SLURM.
# Many clusters recommend launching MPI jobs with `srun` (not `mpirun`).
#
# References:
# - Open MPI + SLURM launching apps: https://docs.open-mpi.org/en/main/launching-apps/slurm.html

set -euo pipefail

# 1) Load MPI module (cluster-specific)
# module purge
# module load openmpi/4.1.6  # example; check `module avail`

# 2) (Optional) Set OpenMP threads if using hybrid MPI+OpenMP
# export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

echo "Nodes allocated:"
scontrol show hostnames "$SLURM_NODELIST"

echo "Running MPI job with total tasks: $SLURM_NTASKS"

# 3) Launch via srun (recommended on many SLURM clusters)
# Replace ./my_mpi_program with your executable.
srun --mpi=pmix ./my_mpi_program --input data/input.dat --output results/out_${SLURM_JOB_ID}.dat

echo "Done."
