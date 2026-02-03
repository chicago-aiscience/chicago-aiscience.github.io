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

You may want to determine what partitions you can run on by reviewing a list of available partitions on the cluster:

```bash
sinfo -a
```

*(RCC partitions: https://docs.rcc.uchicago.edu/partitions/)*

File contents:

```{literalinclude} scripts/gpu/gpu.sbatch
:language: bash
```

**See this repository directory for full example:** https://github.com/chicago-aiscience/chicago-aiscience.github.io/tree/main/docs/user_guide/scripts/gpu

:::{note}
**Cluster-specific configuration:**

- **RCC cluster**: Uncomment `##SBATCH --account=...` and set your account name
- **DSI cluster**: Uncomment `##SBATCH --gres=local:...` if you need node-local storage (fast temporary storage that is deleted when the job ends)
:::

### Job arrays

Run many similar jobs over different inputs. Reference: https://slurm.schedmd.com/job_array.html

Submit:
```bash
sbatch scripts/array.sbatch
```

File contents:

```{literalinclude} scripts/array/array.sbatch
:language: bash
```

**See this repository directory for full example:** https://github.com/chicago-aiscience/chicago-aiscience.github.io/tree/main/docs/user_guide/scripts/array

### Multi-node MPI jobs

Run across nodes in the cluster. Reference: https://docs.open-mpi.org/en/main/launching-apps/slurm.html

Submit:
```bash
sbatch scripts/mpi.sbatch
```

RCC Cluster submission file contents:

```{literalinclude} scripts/mpi/mpi-rcc.sbatch
:language: bash
```

DSI Cluster submission file contents:

```{literalinclude} scripts/mpi/mpi-dsi.sbatch
:language: bash
```

**See this repository directory for full example:** https://github.com/chicago-aiscience/chicago-aiscience.github.io/tree/main/docs/user_guide/scripts/mpi

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

1. Go to: https://midway3-ondemand.rcc.uchicago.edu
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

# Software Modules

On RCC clusters (like Midway2 / Midway3) and to some extent the DSI cluster, most scientific software isn’t available in your shell by default.

Instead, packaged tools, languages, libraries, and compilers are managed through Environment Modules which is a system that lets you load, unload, and switch software versions cleanly.

A module is basically a script that sets up your environment (e.g., `PATH`, `LD_LIBRARY_PATH`) so a specific software package and its dependencies become available in your session.

You use the module command (`module avail`, `module load`, etc.) to interact with these.

**The benefit:** no conflicting software versions, easy switching between versions, and reproducibility across compute sessions.

**Modules may also provide:**

- Libraries (e.g., FFTW, MKL) used by other software
- Developer tools (CMake, debugger/profilers)
- Language environments (Perl, Java)

These support both building complex codes and running them smoothly on compute nodes.

## How to run software modules

1. See what’s available:

  ```bash
  module avail
  ```

2. Load what you need:

  ```bash
  module load <software>/<version>
  ```

3. Check what’s loaded:

```bash
module list
```

4. Run your code inside a job script or interactive session.

:::{tip}
Key point: Loading a module adjusts your environment so the software just works without manual path juggling.
:::

# Monitoring Jobs

Once you submit a job, Slurm provides several commands to help you track its status, priority, and resource usage on RCC clusters.

## Check Job Status: `squeue`

View your running and pending jobs:

```bash
squeue -u $USER
```

Key fields include job ID, state (`PD` = pending, `R` = running), elapsed time, and node or pending reason.

For a custom view:
```bash
squeue -u $USER -o "%.18i %.9P %.8j %.2t %.10M %.6D %R"
```

## Check Job Priority: `sprio`

If a job is pending, use `sprio` to understand its scheduling priority:

```bash
sprio -u $USER
```

*Only prints output for pending jobs.* This shows how factors like job age, fairshare, and job size affect when your job will start.

## Check Job Efficiency: `seff`

After a job finishes, summarize how efficiently it used resources:

```bash
seff <JOBID>
```

Use CPU and memory efficiency to adjust future job requests.
