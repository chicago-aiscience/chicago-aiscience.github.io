# Running Jobs (SLURM)

These patterns apply to both RCC and DSI because both use **SLURM**. These templates are designed to be copied into your project and edited.

## When to use interactive vs batch jobs

| Use case | Recommended |
|--------|------------|
| Debugging code | `srun` |
| Testing environments | `srun` |
| Exploratory analysis | `srun` |
| Long-running jobs | `sbatch` |
| Production workflows | `sbatch` |

:::{tip}
Prototype with `srun`, then scale with `sbatch`.
:::

## `sbatch` Batch job submissions

Before submitting:
- Create a `logs/` directory (and any output directories your code expects)
- Update `#SBATCH --partition=...` to a partition you can access
- Request the *minimum* resources you need so jobs start sooner

### GPU job (batch)

- Request the *minimum* time/memory/GPU you need
- Smaller requests often start sooner

Submit:
```bash
sbatch scripts/gpu.sbatch
```

File contents:

```{literalinclude} scripts/gpu.sbatch
:language: bash
```

### Job arrays

Run many similar jobs over different inputs. Reference: https://slurm.schedmd.com/job_array.html

Submit:
```bash
sbatch scripts/array.sbatch
```

File contents:

```{literalinclude} scripts/array.sbatch
:language: bash
```

### Multi-node MPI jobs

Run across nodes in the cluster. Reference: https://docs.open-mpi.org/en/main/launching-apps/slurm.html

Submit:
```bash
sbatch scripts/mpi.sbatch
```

File contents:

```{literalinclude} scripts/mpi.sbatch
:language: bash
```

## `srun` Interactive jobs

Interactive jobs let you run commands directly on a compute node instead of submitting a batch script. They are ideal for:
- Debugging jobs that fail in batch mode
- Testing software environments and modules
- Running short experiments or exploratory analyses
- Developing code before scaling up to batch jobs
:::{warning}
Never run compute-heavy work on login nodes. Always use `srun` or `sinteractive`.
:::

**`srun`: direct interactive jobs (recommended)**, the preferred and most flexible way to start an interactive session.

---

### Basic interactive CPU job
```bash
srun --partition=general --nodes=1 --ntasks=1 --cpus-per-task=2 --mem=4G --time=01:00:00 --pty bash -i
```

Use this to:
- Activate virtual environments
- Compile code
- Run small test cases
- Verify file paths and permissions

---

### Interactive GPU job
```bash
srun --partition=schmidt-gpu --gres=gpu:1 --cpus-per-task=4 --mem=32G --time=01:30:00 --pty bash
```

Verify GPU access:
```bash
nvidia-smi
```

---

### Attach to a running job
```bash
srun --jobid=<JOBID> --pty bash
```

Useful for inspecting logs or diagnosing issues.

---

### `sinteractive`: convenience wrapper (RCC only)

`sinteractive` is an RCC-provided wrapper around `srun`.

Example:
```bash
sinteractive
```

With options:
```bash
sinteractive --mem=8G --time=01:00:00
```

Notes:
- RCC-specific (not available on DSI)
- Defaults may request more resources than intended
- Prefer `srun` for clarity and reproducibility

---

## Open OnDemand (RCC only)

**Open OnDemand (OOD)** is a web-based interface to the RCC clusters. It provides an alternative to the command line for common tasks and is especially useful for visualization, notebooks, and interactive workflows.

RCC documentation: https://docs.rcc.uchicago.edu/open_ondemand/open_ondemand/

**What Open OnDemand is good for**

Use Open OnDemand when you want to:
- Browse and manage files through a web interface
- Launch **interactive desktops** on compute nodes
- Run **Jupyter notebooks** without setting up port forwarding
- Use GUI-based tools (e.g., visualization, IDEs) on cluster hardware

Open OnDemand still submits jobs through **SLURM**—it does *not* bypass scheduling or resource limits.

---

**Accessing Open OnDemand**

1. Go to: https://ondemand.rcc.uchicago.edu
2. Log in with your UChicago credentials
3. Choose an app or interactive session from the menu

---

**Open OnDemand vs `srun` and `sbatch`**

| Task | Recommended |
|-----|------------|
| Debugging via terminal | `srun` |
| Jupyter notebooks | Open OnDemand |
| Interactive desktop / GUI apps | Open OnDemand |
| Scripted, repeatable workflows | `sbatch` |
| Lightweight exploration | Either |

:::{tip}
Open OnDemand is best for **interactive, user-facing work**.
For reproducible research pipelines, prefer `sbatch` and version-controlled scripts.
:::

---

**Important notes**

- Open OnDemand sessions:
  - Run on **compute nodes**, not login nodes
  - Count against your allocation
  - Are subject to the same time and memory limits as `srun`
- If a session ends or times out, unsaved work may be lost
- For long or unattended jobs, always use `sbatch`

---

## Common mistakes

- Forgetting `--time`
- Requesting excessive resources
- Running large jobs interactively
- Leaving interactive sessions idle

:::{tip}
Exit when finished:
```bash
exit
```
:::

## SLURM Email Notifications

SLURM can automatically email you when a job **starts**, **ends**, or **fails**. This is strongly recommended for long-running or unattended jobs.

SLURM documentation (email): https://slurm.schedmd.com/sbatch.html#OPT_mail-type

**When email notifications are most useful**

Use SLURM email notifications when:
- Jobs run longer than ~30 minutes
- You submit jobs before leaving for the day
- You are debugging jobs that fail intermittently
- You are running large job arrays

:::{warning}
**For very large job arrays, consider:**
```bash
#SBATCH --mail-type=FAIL
```
***to avoid email overload.*** Otherwise you may recieve a *very large number* of emails and it will be difficult to sort through them in your inbox. See "Job arrays and email volume below".
:::

---

***Basic SBATCH options***

Add the following lines to your `*.sbatch` file:

```bash
#SBATCH --mail-user=YOUR_EMAIL@uchicago.edu
#SBATCH --mail-type=END,FAIL
```

Common `--mail-type` values:

- `BEGIN` – email when the job starts
- `END` – email when the job finishes successfully
- `FAIL` – email if the job fails
- `ALL` – email on all events

Recommended default:
```bash
#SBATCH --mail-type=END,FAIL
```

---

**Example: GPU job with email notifications**

```bash
#SBATCH --job-name=gpu_example
#SBATCH --partition=schmidt-gpu
#SBATCH --gres=gpu:1
#SBATCH --time=02:00:00
#SBATCH --mem=32G
#SBATCH --mail-user=YOUR_EMAIL@uchicago.edu
#SBATCH --mail-type=END,FAIL
```

This ensures you are notified if:
- the job crashes
- the job completes while you are away

---

**Setting a default email address**

You can avoid repeating `--mail-user` by configuring SLURM once.

Check your current account settings:
```bash
sacctmgr show user $USER format=User,Email
```

If no email is set, ask RCC or DSI support to add one for you.

---

**Troubleshooting**

If you do not receive emails:
- Check spam/junk folders
- Verify your email address is correct
- Confirm the cluster allows outbound email (RCC and DSI do)
- Ask support to verify your SLURM account email

---

**Job arrays and email volume**

Be careful when enabling email notifications for **job arrays**.

If you submit an array with many tasks (e.g. 100–1,000), SLURM can send **one email per task**, which quickly becomes overwhelming.

Use **FAIL only** so you are notified *only* when something goes wrong:

```bash
#SBATCH --array=0-99
#SBATCH --mail-user=YOUR_EMAIL@uchicago.edu
#SBATCH --mail-type=FAIL
```

This way:
- You receive an email if **any task fails**
- You avoid dozens (or hundreds) of completion emails

:::{tip}
For very large arrays, consider monitoring progress with:
```bash
squeue -u $USER
```
and reviewing output logs after completion. ***Do not use email.***
:::