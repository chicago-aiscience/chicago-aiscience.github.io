# Quick Reference

This page collects **ready-to-copy snippets** you’ll can use on RCC and DSI. You can copy these directly and adjust as needed.

---

## 1. SSH config

Create or edit `~/.ssh/config` on your **local machine**:

```text
Host midway3
    HostName midway3.rcc.uchicago.edu
    User YOUR_CNETID

Host dsi
    HostName login.ds.uchicago.edu
    User YOUR_CNETID
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
#SBATCH --job-name=gpu_min
#SBATCH --partition=schmidt-gpu
#SBATCH --gres=gpu:1
#SBATCH --time=01:00:00
#SBATCH --mem=16G
#SBATCH --mail-user=YOUR_EMAIL@uchicago.edu
#SBATCH --mail-type=END,FAIL

python train.py
```

---

## 4. Job array template (FAIL-only email)

```bash
#!/bin/bash
#SBATCH --job-name=array_min
#SBATCH --array=0-9
#SBATCH --time=00:30:00
#SBATCH --mem=4G
#SBATCH --mail-user=YOUR_EMAIL@uchicago.edu
#SBATCH --mail-type=FAIL

python preprocess.py --index $SLURM_ARRAY_TASK_ID
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

- For full scripts: see **Appendix: Annotated SLURM Scripts**
- For email setup: see **Appendix: SLURM Email Notifications**
- For data transfer details: see **Data Transfer**
