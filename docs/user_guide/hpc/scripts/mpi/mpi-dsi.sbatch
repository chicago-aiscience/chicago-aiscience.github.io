#!/bin/bash
#SBATCH --job-name=mpi_example
#SBATCH --partition=general
#SBATCH --nodes=2
#SBATCH --ntasks-per-node=16
#SBATCH --cpus-per-task=1
#SBATCH --mem=0
#SBATCH --time=01:00:00
#SBATCH --output=/path/to/your/project/logs/%x_%j.out
#SBATCH --error=/path/to/your/project/logs/%x_%j.err

set -euo pipefail

# Optional debug: sbatch --export=ALL,DEBUG=1 mpi.sbatch
DEBUG="${DEBUG:-0}"

# ---- Paths ----
SCRIPT="/path/to/your/project/mpi.py"
INPUT="/path/to/your/project/mpi_input.txt"
LOGS="/path/to/your/project/logs"
RESULTS="/path/to/your/project/results"
VENV="/path/to/your/project/.venv"
MPI_TYPE="pmix_v3"

mkdir -p "$LOGS" "$RESULTS"

# ---- Runtime settings ----
export PYTHONUNBUFFERED=1

# Force Open MPI to use TCP over a clean interface set (avoid docker/loopback bridges)
export OMPI_MCA_btl=self,tcp
export OMPI_MCA_btl_tcp_if_exclude=lo,docker0,virbr0
# Conservative PML (avoid UCX surprises on this cluster)
export OMPI_MCA_pml=ob1

# ---- Environment ----
# module purge
# module load openmpi/<version>
source "${VENV}/bin/activate"

echo "Nodes allocated:"
scontrol show hostnames "$SLURM_NODELIST"
echo "Total tasks: ${SLURM_NTASKS} (ntasks-per-node: ${SLURM_NTASKS_PER_NODE:-unknown})"
echo "DEBUG=${DEBUG}  MPI_TYPE=${MPI_TYPE}"

if [[ "$DEBUG" == "1" ]]; then
  echo "Interfaces per node:"
  srun -N "$SLURM_JOB_NUM_NODES" -n "$SLURM_JOB_NUM_NODES" --ntasks-per-node=1 \
    bash -lc 'echo HOST=$(hostname); ip -o -4 addr show | awk "{print \$2,\$4}"'
  echo "mpi4py linked against:"
  python -c "import mpi4py.MPI as M; print(M.Get_library_version())"
fi

# ---- Launch ----
SRUN_ARGS=(--mpi="${MPI_TYPE}" --label --kill-on-bad-exit=1)

if [[ "$DEBUG" == "1" ]]; then
  SRUN_ARGS+=(--output="${LOGS}/%x_%j_%t.out" --error="${LOGS}/%x_%j_%t.err")
fi

srun "${SRUN_ARGS[@]}" \
  python -u "$SCRIPT" \
    --input "$INPUT" \
    --output "${RESULTS}/out_${SLURM_JOB_ID}.txt"

deactivate
echo "Done."
