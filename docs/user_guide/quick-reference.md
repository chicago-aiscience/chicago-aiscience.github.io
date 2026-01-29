# Quick Reference

This page collects **ready-to-copy snippets** you’ll can use on RCC and DSI. You can copy these directly and adjust as needed.

---

## 1. SSH config

Create or edit `~/.ssh/config` on your **local machine**:

```text
# RCC
Host midway3
    HostName midway3.rcc.uchicago.edu
    User YOUR_CNETID

# DSI
Host fe.ds*
  HostName fe01.ds.uchicago.edu
  IdentityFile PATH_TO_PRIVATE_KEY
  ForwardAgent yes
  User YOUR_CNETID

Host *.ds !fe.ds
  HostName %h.uchicago.edu
  IdentityFile PATH_TO_PRIVATE_KEY
  ForwardAgent yes
  User YOUR_CNETID
  ProxyJump fe.ds
```

Then you can use:
```bash
ssh midway3
rsync -av data/ midway3:/scratch/midways3/$USER/data/
```

---

## 2. Minimal interactive job (RCC)

```bash
srun --partition=general --nodes=1 --ntasks=1 --cpus-per-task=2 --mem=4G --time=01:00:00 --pty bash -i
```

Use this to:
- test environments
- debug code
- explore installed software

---

## 3. Minimal GPU batch job

```bash
#!/bin/bash
#SBATCH --job-name=gpu
##SBATCH --account=<PI_ACCOUNT>    # <-- change to an allowed account on your cluster - RCC CLUSTER ONLY (uncomment if needed)
#SBATCH --partition=<PARTITION>    # <-- change to an allowed GPU partition on your cluster
#SBATCH --gres=gpu:1               # <-- change request 1 GPU (adjust as needed)
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=02:00:00
#SBATCH --output=/path/to/logs/%x_%j.out
#SBATCH --error=/path/to/logs/%x_%j.err

python gpu.py
```

---

## 4. Job array template (FAIL-only email)

```bash
#!/bin/bash
#SBATCH --job-name=array
##SBATCH --account=<PI_ACCOUNT>    # <-- change to an allowed account on your cluster; RCC CLUSTER ONLY (uncomment if needed)
#SBATCH --partition=<PARTITION>    # <-- change to an allowed GPU partition on your cluster
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=4G
#SBATCH --time=00:30:00
#SBATCH --array=0-9                # 10 tasks: indices 0..9
#SBATCH --output=/path/to/logs/%x_%A_%a.out
#SBATCH --error=/path/to/logs/%x_%A_%a.err

python array.py --index $SLURM_ARRAY_TASK_ID
```

---

## 5. Data transfer cheatsheet

### `rsync` (preferred)

```bash
rsync -avz --progress local_dir/ midway3:/scratch/midways3/$USER/project/
```

### `scp` (small files)

```bash
scp file.txt midway3:/home/$USER/
```

### `sftp` (interactive)

```bash
sftp midway3:/home/$USER/
```

---

## 6. Monitor and manage jobs

```bash
squeue -u $USER
scancel <JOBID>
scontrol show job <JOBID>
```

---

## 7. Where to go next

- For full scripts: see [**Running Jobs (SLURM)**](./running-jobs.md)
- For data transfer details: see [**Data Transfer**](./data-transfer.md)
