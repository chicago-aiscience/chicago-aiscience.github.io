#!/bin/bash
# NOTE: Consider enabling SLURM email notifications (see Appendix: SLURM Email Notifications)
#SBATCH --job-name=gpu_example
##SBATCH --account=pi-account    # <-- change to an allowed account on your cluster - RCC CLUSTER ONLY (uncomment if needed)
#SBATCH --partition=general      # <-- change to an allowed GPU partition on your cluster
#SBATCH --gres=gpu:1             # <-- change request 1 GPU (adjust as needed)
##SBATCH --gres=local:200G       # <-- Request node local storage - DSI CLUSTER ONLY (uncomment if needed)
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=02:00:00
#SBATCH --output=/path/to/logs/%x_%j.out
#SBATCH --error=/path/to/logs/%x_%j.err

# ===============================
# GPU JOB TEMPLATE (ANNOTATED)
# ===============================
# Tips:
# - Request the minimum resources you need (time/mem/CPU/GPU) to start sooner.
# - On RCC compute nodes, outbound internet is typically blocked.
# - Create a logs/ directory (and any output dirs) before submitting.
# - Uncomment required steps to execute script to customize to your usage.

set -euo pipefail

# 1) Load modules (adjust to your software stack)
# module purge
# module load cuda/12.1  # example; check `module avail` on your cluster

# 2) Activate your environment
# Recommended: keep envs in your project/scratch, not in $HOME if large.
# source /path/to/venv/bin/activate
# OR for conda/mamba:
# source ~/.bashrc
# conda activate myenv

# 3) (Optional) Use node-local scratch for high I/O temporary files
# SLURM may set $TMPDIR / $SLURM_TMPDIR on some clusters.
# If set, it is FAST but DELETED when the job ends.
WORKDIR="${SLURM_TMPDIR:-/local/scratch}/${USER}_${SLURM_JOB_ID}"
mkdir -p "$WORKDIR"
echo "Working directory: $WORKDIR"

# 4) Copy inputs to node-local storage (optional)
# cp -r /path/to/input "$WORKDIR/"

# 5) Run your workload
# Example: Python training script (replace with your command)
python -u /home/ntebaldi/user-guide/gpu/gpu.py \
  --epochs 5 \
  --batch-size 64 \
  --outdir "${WORKDIR}/run_${SLURM_JOB_ID}"

# 6) Copy outputs back to persistent storage if you used node-local scratch
# rsync -av "$WORKDIR/" /scratch/midways3/$USER/somewhere/

# 7) Deactivate your environment
# deactivate
# conda deactivate myenv

echo "Done."
