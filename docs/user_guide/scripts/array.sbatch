#!/bin/bash
# NOTE: Consider enabling SLURM email notifications (see Appendix: SLURM Email Notifications)
#SBATCH --job-name=array_example
#SBATCH --partition=general             # <-- change as needed
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=4G
#SBATCH --time=00:30:00
#SBATCH --array=0-9                     # 10 tasks: indices 0..9
#SBATCH --output=logs/%x_%A_%a.out
#SBATCH --error=logs/%x_%A_%a.err

# =====================================
# JOB ARRAY TEMPLATE (ANNOTATED)
# =====================================
# Use job arrays when you have many similar tasks over different inputs:
# - parameter sweeps
# - per-sample preprocessing
# - independent simulations
#
# Key environment variables:
# - SLURM_ARRAY_JOB_ID  (the parent job ID)
# - SLURM_ARRAY_TASK_ID (the index for this array task)

set -euo pipefail

TASK_ID="${SLURM_ARRAY_TASK_ID}"
echo "Array task: ${TASK_ID}"

# Option A: Map task IDs to input files via a manifest
# Create a text file inputs.txt with one input per line.
MANIFEST="inputs.txt"
INPUT=$(sed -n "$((TASK_ID+1))p" "$MANIFEST")  # +1 because sed is 1-indexed
echo "Input for this task: ${INPUT}"

# Option B: Map task IDs to parameters (example)
# PARAM=$(python - <<'PY'
# import os
# tid = int(os.environ["SLURM_ARRAY_TASK_ID"])
# print([0.1,0.2,0.5,1.0,2.0][tid])
# PY
# )
# echo "Param: $PARAM"

# Run your program
python -u preprocess.py --input "$INPUT" --output "outputs/out_${TASK_ID}.parquet"

echo "Done."
