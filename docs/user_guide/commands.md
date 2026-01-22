# Commands Cheatsheet

# View all jobs in the queue

```bash
squeue
```

# View all partitions

```bash
sinfo -a
```

# View partitions user can access (SLURM accounting)

```bash
sacctmgr show associations where user=$USER
```

# Launch an interactive CPU job (example)

```bash
srun --partition general --nodes=1 --ntasks=1 --cpus-per-task=2 --mem=4GB --time=01:00:00 --pty bash -i
```

# Launch an interactive GPU job (example)

```bash
srun -p general --gres=gpu:a100:1 --mem=32G -t 01:30:00 --pty /bin/bash
```

# View your jobs

```bash
squeue -u $USER
```

# Cancel a job

```bash
scancel <job_id>
```

# Show job details

```bash
scontrol show job $SLURM_JOB_ID
```

# View node and GPU information

```bash
sinfo -o "%50N %10c %20m %30G" NODELIST CPUS MEMORY GRES
```

# Attach to a running job

```bash
srun --jobid=<JOBID> --pty /bin/bash
```

# Check GPU status

```bash
nvidia-smi
```