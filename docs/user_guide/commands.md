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

You may also want see a list of all of the partitions if the none show up in the previous command.

```bash
sinfo -a
```

*(RCC partitions: https://docs.rcc.uchicago.edu/partitions/)*

# Launch an interactive CPU job (example)

**RCC**
```bash
srun --account=<PI_ACCOUNT> --partition=caslake --nodes=1 --ntasks=1 --cpus-per-task=2 --mem=4G --time=01:00:00 --pty bash -i
```

**DSI**
```bash
srun --partition general --nodes=1 --ntasks=1 --cpus-per-task=2 --mem=4GB --time=01:00:00 --pty bash -i
```

# Launch an interactive GPU job (example)

```bash
srun -p general --gres=gpu:a100:1 --mem=32G -t 01:30:00 --pty /bin/bash
```

Note: You may have to locate how to reference available GPUs: [View node and GPU information](#view-node-and-gpu-information)

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

(view-node-and-gpu-information)=
# View node and GPU information

```bash
sinfo -o "%50N %10c %20m %30G" NODELIST CPUS MEMORY GRES
```

# Attach to a running job

```bash
srun --jobid=<JOBID> --pty /bin/bash
```

# Check GPU status (NVIDIA GPUs)

```bash
nvidia-smi
```
