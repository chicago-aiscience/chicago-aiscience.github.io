#!/bin/bash
#SBATCH --account=<PI_ACCOUNT>    # <-- change to an allowed account
#SBATCH --job-name=mpi_example
#SBATCH --partition=<PARTITION>    # <-- change to an allowed partition
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=16
#SBATCH --cpus-per-task=1
#SBATCH --mem=0
#SBATCH --time=01:00:00
#SBATCH --output=/path/to/your/project/logs/%x_%j.out    # <-- change to your project's logs directory
#SBATCH --error=/path/to/your/project/logs/%x_%j.err    # <-- change to your project's logs directory

set -euo pipefail

# ---- User paths ----
SCRIPT="/path/to/your/project/mpi.py"
INPUT="/path/to/your/project/mpi_input.txt"
LOGS="/path/to/your/project/logs"
RESULTS="/path/to/your/project/results"
VENV="/path/to/your/project/.venv"

mkdir -p "$LOGS" "$RESULTS"

# ---- Runtime settings ----
export PYTHONUNBUFFERED=1

# Open MPI transport preferences (Midway3)
# - Try UCX first; keep TCP + shared memory as fallback
export OMPI_MCA_pml=ucx
export OMPI_MCA_btl=self,vader,tcp
export OMPI_MCA_btl_tcp_if_include=ib0

# ---- Environment ----
module load openmpi/4.1.8
source "${VENV}/bin/activate"

echo "Nodes allocated:"
scontrol show hostnames "$SLURM_NODELIST"
echo "Total tasks: ${SLURM_NTASKS} (ntasks-per-node: ${SLURM_NTASKS_PER_NODE:-unknown})"

# Hostfile from Slurm allocation (cleaned up on exit)
HOSTFILE="$(mktemp "${SLURM_SUBMIT_DIR:-/tmp}/hostfile.${SLURM_JOB_ID}.XXXX")"
trap 'rm -f "$HOSTFILE"' EXIT
scontrol show hostnames "$SLURM_NODELIST" > "$HOSTFILE"

# Optional debug: sbatch --export=ALL,DEBUG=1 mpi.sbatch
DEBUG="${DEBUG:-0}"
if [[ "$DEBUG" == "1" ]]; then
  echo "Hostfile: $HOSTFILE"
  cat "$HOSTFILE"
  echo "Interfaces per node:"
  srun -N "$SLURM_JOB_NUM_NODES" -n "$SLURM_JOB_NUM_NODES" --ntasks-per-node=1 \
    bash -lc 'echo HOST=$(hostname); ip -o -4 addr show | awk "{print \$2,\$4}"'
  echo "mpi4py linked against:"
  python -c "import mpi4py.MPI as M; print(M.Get_library_version())"
fi

# ---- Launch (Open MPI via mpirun; works around Slurm PMI/PMIx limitations) ----
mpirun -np "$SLURM_NTASKS" \
  --hostfile "$HOSTFILE" \
  --map-by "ppr:${SLURM_NTASKS_PER_NODE}:node" \
  --bind-to none \
  --tag-output --timestamp-output \
  python -u "$SCRIPT" \
    --input "$INPUT" \
    --output "${RESULTS}/out_${SLURM_JOB_ID}.txt"

# ---- Deactivate environment ----
# conda deactivate myenv
deactivate
echo "Done."
