# Lesson 2: Data Management

## Objectives

Moving, organizing, and storing data on the cluster, scratch vs. long-term storage

- How to get data onto and off of the cluster: `rsync`, `scp`, `sftp`
- Storage break down:
    - Home directories
    - [Scratch vs. long-term storage](https://docs.rcc.uchicago.edu/storage/main/)
    - [Node-local storage (job execution)](https://cluster-policy.ds.uchicago.edu/using-the-cluster/node-local-storage/)

---

## 1. Data transfer tools

We will look at two categories of tools:

- For larger transfers, repeated syncs, and reliable transfers: `rsync`
- For small, quick, occasional transfers: `scp` / `sftp`

### `rsync`

`rsync` provides data syncing over SSH and is the best choice for when:

- you are syncing directories repeatedly
- you have large trees of files
- you want reliable, resumable transfers - helpful for dealing with network connection interruptions

**Sync local → RCC**

```bash
rsync -avz --progress -e ssh local_folder/ <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/project_folder/
```

**Sync RCC → local**

```bash
rsync -avz --progress -e ssh <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/project_folder/ local_folder/
```

Common options:
- `-a` archive mode (preserves timestamps/permissions)
- `-v` verbose
- `-z` compress in transit
- `--progress` show progress
- `--delete` (careful!) make destination match source by deleting extra files

References:
- RCC rsync examples (in SSH docs): https://docs.rcc.uchicago.edu/ssh/main/
- DSI rsync/scp guide: https://cluster-policy.ds.uchicago.edu/advanced-topics/rsync-scp/

>🧰 - Remember the input data that we copied in [Lesson 1.7 Step 4](#copy-data), you can also copy the input data from the local folder you downloaded it to the RCC cluster with this command:

```bash
rsync -avz --progress -e ssh /path/to/input/directory/on/your/laptop/ <CNetID>@midway3.rcc.uchicago.edu:/scratch/midway3/$USER/workshop-hpc-data
```

---

### `scp` + `sftp`

Both of these tools allow you to transfer data to and from the cluster using SSH. These tools do not sync data between two directories like `rsync` so you don't get the option to resume a data transfer if the copy is interrupted for some reason (e.g. network connection loss).

**`scp`(Secure Copy)**

Use `scp` to copy files over SSH. Good for small-to-moderate transfers.

*Copy a local file to RCC (Midway3 example):*

```bash
scp path/to/local_file.txt <CNetID>@midway3.rcc.uchicago.edu:/home/<CNetID>/
```

*Copy a directory recursively to RCC:*

```bash
scp -r path/to/local_folder <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/
```

*Copy a file from RCC to your laptop:*

```bash
scp <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/results.csv .
```

**`sftp` (Secure File Transfer Protocol)**

`sftp` is like an interactive file browser over SSH.

*Start an sftp session:*

```bash
sftp <CNetID>@midway3.rcc.uchicago.edu
```

*Useful commands inside `sftp`:*

```text
ls            # list remote files
lls           # list local files
cd DIR        # change remote directory
lcd DIR       # change local directory
get FILE      # download from remote
put FILE      # upload to remote
get -r DIR    # download directory
put -r DIR    # upload directory
bye           # exit
```

> 🧰 - prefixing commands with `l` makes them run on your local file system.

*Examples:*

Download a directory from remote to local:
```bash
sftp> cd /project/myproject  # Change to directory on
sftp> lcd ~/Downloads  # List files in local Downloads directory
sftp> get -r results   # Recursively download the results directory to the local Downloads directory
# Downloads the 'results' directory to ~/Downloads/results
```

Upload a directory from local to remote:
```bash
sftp> cd /project/myproject
sftp> lcd ~/Documents/mycode
sftp> put -r src  # Recursively upload the src directory to the cluster
# Uploads the 'src' directory to /project/myproject/src
```

## 2. Storage types

Many clusters will have different storage types for different purposes. We will loosely cover them here and then provide specifics for the RCC cluster and the DSI cluster. The rule of thumb — *code in home, data in project, temporary job files in scratch, heavy per-job I/O on node-local* — is expanded into full best practices in [§3](#data-best-practices).

### Home Directories (`/home/$USER`)

This is your personal space on the cluster:

- This space contains configuration files for the shell launched when you login and other cluster tools.
- You may want to use this space to store scripts and source code.
- This is a space to store files owned by you and not shared with others as your home directory is only accessible by you.

### Research or Project Space

Project or research directories are the primary location for shared research data and code.

- This space can often contain shared research code, input data, results data, analysis code and notebooks, and shared software environments.
- This space is the workspace for a research group.
- This is a space for sharing as most often everyone within a research group has access to these files.

### Scratch Space

Scratch space is a high performance storage space for temporary data.

- This space is often used by running jobs to read data from and write data to.
- Scratch spaces often offer higher I/O performance.
- Scratch spaces are often purged at regular intervals and are not backed up.

### Node-local Storage

This is storage that is only available on and connected directly to a specific compute node.

- Because this is an NVMe or SSD storage device attached to the node, I/O performance is the best and fastest.
- You may want to consider using the node-local storage, if you have an algorithm that requires heavy file I/O and perhaps you are seeing a bottleneck in your code's performance and runtime.
- Note that this is the most ephemeral data storage, as this storage space is wiped as soon a job releases the resource. In other words, once your job terminates on the cluster, the storage is purged.

**Typical workflow (nested in a batch script)**

1. Copy your algorithm inputs from either your home directory or research project space to the node local storage path
2. Run your algorithm, making sure it is pointing to the node local storage - this may mean defining a specific command line argument like `--inputdir` and using that reference through out your code.
3. Save your algorithm results back to your home directory or research project space.

>🧰 - Note you may have to figure out the size of the node-local storage so you know how much of your input data can be loaded to that space at a time. See specific cluster details below for info on how to do this.

(rcc-cluster-specifics)=
### RCC Cluster Specifics

The RCC cluster (Midway) offers all four storage types described above, plus long-term tiers. The specifics below are for **Midway3**, the cluster we use in this workshop; Midway2 and Beagle3 have slightly different paths and quotas. Quotas change over time, so treat the [official RCC storage docs](https://docs.rcc.uchicago.edu/storage/main/) as the source of truth.

You can check your own usage at any time with:

```bash
rcchelp quota        # or:  quota -u $USER
```

| Storage type | Path | Quota / size | Backed up? | Purge policy | Best for |
|---|---|---|---|---|---|
| Home | `/home/<CNetID>` | 30 GB soft / 35 GB hard (or 300K / 1M files) | ✅ Yes — daily + weekly snapshots | Never purged | Config files, scripts, source code — personal, owner-only |
| Project / research | `/project/<group>` | Varies by allocation | ✅ Yes — daily + weekly snapshots | Never purged | Shared group datasets, software installs, results (mode `2770`) |
| Scratch | `/scratch/midway3/<CNetID>` | 100 GB soft / 5 TB hard | ❌ No — not snapshotted or backed up | Treat as **temporary only** (short-term working data) | High-performance I/O — reading/writing data for running jobs |
| Node-local | `$TMPDIR` / `$SLURM_TMPDIR` (both → `/tmp/jobs/${SLURM_JOB_ID}`) | Varies by node | ❌ No | Purged when the job completes | High-throughput I/O of **many small files** (< 4 MB) |

**Using node-local storage on the RCC cluster**

Unlike the DSI cluster (below), **RCC node-local scratch requires no special request,** every job automatically gets a per-job directory, and its path is handed to you in two environment variables:

- `$TMPDIR` and `$SLURM_TMPDIR` are both set to `/tmp/jobs/${SLURM_JOB_ID}`.
- It's wiped automatically when the job completes, so copy results out before the job ends.
- It's best suited to **high-throughput I/O of many small files** (each < 4 MB).

Because the size varies by node and is **not** advertised as a Slurm resource (unlike DSI), you can't read it from `sinfo`. You have to check it from *on the compute node* — `$TMPDIR` only exists inside a running job, so `df -h "$TMPDIR"` on a login node will just report "No such file or directory."

One way to see the node-local storage size is via an interactive session (quick, one-off check).

Grab a short interactive job, then run `df` in the shell it drops you into:

```bash
srun --partition=schmidt-gpu --nodes=1 --ntasks=1 --cpus-per-task=2 --mem=4G --time=00:10:00 --pty bash -i
df -h "$TMPDIR"     # you are now on a compute node; $TMPDIR exists
```

You can still survey the nodes and their other resources (CPUs `%c`, memory in MB `%m`, GPUs `%G`, state `%t`) with `sinfo`:

```bash
sinfo -N -o "%N %c %m %G %t"     # one row per node
sinfo -p schmidt-gpu                 # scope to a single partition
```

**Putting it together in a batch script** — stage inputs onto the fast local disk, run, then copy results back to durable storage before the job exits:

```bash
#!/usr/bin/env bash
#SBATCH --job-name=local-io-example
#SBATCH --partition=schmidt-gpu
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=02:00:00

# $TMPDIR / $SLURM_TMPDIR already point at this job's node-local scratch — no request needed
echo "Node-local scratch: $TMPDIR"

# 1. Copy inputs from durable storage (/project or /scratch) onto node-local disk
rsync -a /project/<group>/workshop-hpc-data/ "$TMPDIR"/data/

# 2. Run your code pointed at the fast local path
python train.py --inputdir "$TMPDIR"/data --outputdir "$TMPDIR"/results

# 3. Copy results back to durable storage BEFORE the job ends ($TMPDIR is wiped on exit!)
rsync -a "$TMPDIR"/results/ /project/<group>/results/
```

**A worked example from the workshop.** The repo ships a concrete version of this pattern in [`slurm/06_nodelocal_predict.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/06_nodelocal_predict.sbatch): it stages the SoS/SVS inputs and the trained model onto node-local disk, writes the many small per-shard prediction files there, aggregates them locally, and copies only the single `discharge.csv` back to durable storage. The parts worth highlighting:

**1. Pick the node-local directory (with a fallback).** `$SLURM_TMPDIR` is the per-job disk physically on the compute node; fall back to a job-unique `/tmp` path if the site doesn't set it:

```bash
LOCAL="${SLURM_TMPDIR:-/tmp/$USER/$SLURM_JOB_ID}"
mkdir -p "$LOCAL/input" "$LOCAL/predictions"
```

**2. Always clean up on exit.** A `trap` removes the local directory on success, error, *or* signal, so the job never strands data on the compute node:

```bash
cleanup() { rm -rf "$LOCAL"; }
trap cleanup EXIT
```

**3. Stage inputs once with `rsync -a`.** Copy the read-only inputs and the model onto local disk a single time, then point the code at the fast local paths. `rsync -a` preserves timestamps/permissions and skips anything already staged, so a requeue doesn't re-copy the whole dataset:

```bash
rsync -a "$SOS_FILE" "$SVS_FILE" "$LOCAL/input/"
rsync -a "$MODEL" "$LOCAL/model.pt"
```

**4. Do the many-small-files work locally.** Each shard writes its per-reach CSV into `$LOCAL/predictions/`, and aggregation rolls them up locally — none of that churn touches the shared filesystem (exactly the many-small-files problem from [§3](#data-best-practices)).

**5. Copy only the result back — before the job ends.** Node-local disk is wiped on exit, so the single aggregated file is `rsync`ed to durable storage while the job is still alive:

```bash
rsync -a "$LOCAL/discharge.csv" "$WORK_DIR/runs/discharge.csv"
```

> 🧰 - Notice this script needs **no** `--gres=local` request. On RCC, node-local scratch is automatic via `$SLURM_TMPDIR` (see the table above) — there is no `local` generic resource to ask for, and adding `--gres=local:...` would leave the job unschedulable. That `--gres=local:<SIZE>` line is a **DSI-only** requirement, covered in the DSI specifics below.

(dsi-cluster-specifics)=
### DSI Cluster Specifics

The DSI cluster offers all four storage types described above. Quotas and node capacities change over time, so treat the [official storage overview](https://cluster-policy.ds.uchicago.edu/using-the-cluster/storage-overview/) and [node-local storage guide](https://cluster-policy.ds.uchicago.edu/using-the-cluster/node-local-storage/) as the source of truth.

You can check your own usage at any time with:

```bash
dsiquota --home
dsiquota --project <NAME>
dsiquota --scratch
# You can just run `dsiquota` to display all of the command options
```

| Storage type | Path | Quota / size | Backed up? | Purge policy | Best for |
|---|---|---|---|---|---|
| Home | `/home/<CNetID>` | 50 GB (fixed) | ✅ Yes | Never purged | Config files, scripts, source code — **not** for running jobs (not optimized for parallel I/O) |
| Project / research | `/project/<group>` | 500 GB default, up to 10 TB on request (faculty may request up to 3 directories) | ✅ Yes | Never purged | Shared group datasets, software installs, results |
| Scratch | `/net/scratch` and `/net/scratch2` | 50 GB per user on *each* (more available on request for active work) | ❌ No | Files not accessed for **60 days** are automatically deleted | Best network I/O — temporary files, intermediate results, large temporary datasets |
| Node-local | `/local/scratch/<CNetID>_<JOBID>/` | Varies by node: **200 GB – 9.5 TB** (request with `--gres=local:<SIZE>`) | ❌ No | Wiped as soon as the job completes or the node is reallocated (no grace period) | Fastest (NVMe/SSD) — heavy per-job file I/O |

**Using node-local storage on the DSI cluster**

**1. Request it in your job.** Node-local disk is a Slurm *generic resource* (GRES). Add `--gres=local:<SIZE>` (size in GB) to your `srun` or `sbatch` request. The scheduler will only place your job on a node that advertises at least that much local disk.

```bash
# Interactive example: request a shell with 200 GB of node-local scratch
srun -p general --gres=local:200G --pty bash
```

**2. Know where it lives.** Slurm creates a per-job directory for you at `/local/scratch/<CNetID>_<JOBID>/`. It is removed automatically when the job ends, so you must copy results out before then.

The DSI docs don't document an environment variable for this path, so build it from `$USER` (your CNetID) and `$SLURM_JOB_ID` — and confirm it inside the job:

```bash
LOCAL=/local/scratch/${USER}_${SLURM_JOB_ID}
ls -ld "$LOCAL"          # confirm Slurm created it
df -h "$LOCAL"           # check how much space is actually available
```

**3. Request only what you need.** Match the `local:` size to the smallest footprint you truly need so your job can land on more nodes (and you don't block other users).

**Figuring out how much a node has**

Survey *all* nodes at once with `sinfo`, printing the node name (`%N`) and its GRES (`%G`) — local disk shows up in the `local:disk:` field alongside GPUs:

```bash
sinfo -N -o "%N %G"
# g002 gpu:...,local:disk:200G
# k001 gpu:h200:4,local:disk:1500G
# n001 gpu:...,local:disk:9500G   -> this node advertises 9500 GB of local disk
```

To inspect a single node in full detail, use `scontrol` and read its `Gres=` line:

```bash
scontrol show node <nodename>
# ... Gres=gpu:h200:4,local:disk:1500G   -> this node advertises 1500 GB of local disk
```

**Putting it together in a batch script**

This follows the typical workflow above — stage inputs onto the fast local disk, run, then copy results back to durable storage before the job exits:

```bash
#!/usr/bin/env bash
#SBATCH --job-name=local-io-example
#SBATCH --partition=general
#SBATCH --gres=local:200G          # request 200 GB of node-local scratch
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=02:00:00

# Per-job directory Slurm created on the node's local NVMe/SSD
LOCAL=/local/scratch/${USER}_${SLURM_JOB_ID}

# 1. Copy inputs from network storage (/project or /net/scratch) onto node-local disk
rsync -a /project/<group>/workshop-hpc-data/ "$LOCAL"/data/

# 2. Run your code pointed at the fast local path
python train.py --inputdir "$LOCAL"/data --outputdir "$LOCAL"/results

# 3. Copy results back to durable storage BEFORE the job ends (local is wiped on exit!)
rsync -a "$LOCAL"/results/ /project/<group>/results/
```

---

(data-best-practices)=
## 3. Data management best practices

Each storage type above suits a different **stage** in the life of your data. Now that you have seen the specifics for the [RCC](#rcc-cluster-specifics) and [DSI](#dsi-cluster-specifics) clusters, this section covers how to *use* them well. A little organization up front — deciding what is short-term vs. long-term, and where each piece lives — saves a lot of pain later. A good test: six months from now, could you still answer *which data was used, which version of the code ran, what parameters were set, and can I reproduce this result?* The practices below are aimed at keeping that answer "yes."

### Match storage to the data's lifetime

Think about how long you need each file and how it is accessed, then place it accordingly:

| Data | Where it belongs | Why |
|---|---|---|
| Source code, scripts, configuration | `/home` (or a repo in `/project`) | Small, personal, backed up |
| Primary datasets, final results, shared environments | `/project` | Durable, shared with your group, backed up |
| Temporary & intermediate job files | `/scratch` | Fast I/O, **not** backed up, purged |
| Heavy per-job read/write | node-local (`$TMPDIR` / `--gres=local`) | Fastest, wiped when the job ends |

A few rules of thumb follow from this:

1. **Store code in home.** Keep source code, scripts, and configuration in your `/home` directory (or a Git repository).
2. **Keep data in project.** Store primary datasets, important results, and shared files in your `/project` directory.
3. **Use scratch for jobs.** Have running jobs read and write temporary files in a directory you create under `/scratch`, then copy final results back to `/project` when the job finishes.
4. **Check your usage.** Monitor your disk usage regularly so you don't hit quotas mid-job (see the quota commands in §2).
5. **Clean up regularly.** Delete files you no longer need — especially from shared `/scratch` — to be a good cluster citizen.

### Organize data for fast search and retrieval

When jobs need to find data in a large or growing collection (especially time series), a **hierarchical directory layout beats one giant flat folder**. Partition by the fields you filter on most — for time series, that is usually `year/month/day`:

```text
/project/<group>/data/
  2026/
    07/
      15/
        station-A.parquet
        station-B.parquet
      16/
        ...
```

Why it helps:

- A job can point straight at `data/2026/07/` instead of scanning millions of files.
- Parallel and scratch file systems slow down badly with huge flat directories — nesting keeps each directory small.
- The path itself documents the data, and new data appends cleanly without reshuffling existing files.

Watch out for the **many-small-files** problem, too: thousands of tiny files are slow on shared storage. Aggregate them into larger containers (e.g. `.parquet`, `.tar`, or `.zarr`), and remember that node-local storage is the right home for high-throughput small-file I/O.

> 🧰 - Keep raw inputs **read-only** and write derived/processed data to a separate directory. An accidental job then can't corrupt your source data, and you can always re-derive results from the original.

### Separate code, environments, and data

Code, environments, and data have different lifetimes and sharing needs, so keep them in **separate locations** rather than one mixed directory:

- **Code** — a Git repository (scripts, notebooks, job files). Version-controlled; never commit large data or secrets.
- **Software environments** — build a `conda`/`venv` environment **once** in a known location (personal → `/home`, shared → `/project`) and activate it from every job; don't rebuild it per run.
- **Data** — inputs and results live in `/project` (durable) and `/scratch` (temporary), never inside the code repository.

The workshop repository is laid out this way — `src/` for code, `config/` for configuration, `slurm/` for job scripts, and `environment.yml` for the environment — with the data kept on the cluster, outside the repo.

### From notebooks to codebases

Notebooks are ideal for exploration and are a great **first line of experiment tracking**. But batch jobs run *scripts*, not notebooks, and copy-pasted cells are hard to reproduce. As soon as you are repeating an analysis or scaling it to batch jobs:

- Move reusable logic out of the notebook into small, importable scripts/modules in your codebase (`src/`).
- Keep the notebook for exploration and figures, importing from the codebase so the two stay in sync.
- Put the codebase under version control so each job runs a known version of the code.

(track-experiments-configs-and-results)=
### Track experiments, configs, and results

To make results reproducible, capture **what produced them**: the data, the code version, the parameters, and the outputs. Layer tools as your needs grow:

| Layer | Tool | When to use it |
|---|---|---|
| Code | Git / GitHub | Always |
| Data | DVC | Files > 100 MB, or that change across runs |
| Experiments | MLflow or Weights & Biases | Comparing runs by parameters and metrics |
| Serving | Docker / GHCR | Sharing a working model |

Two habits that pay off immediately:

- **Keep the config with the results.** Write each run's exact parameters/config into that run's output directory, so a result is self-describing. The workshop does this: each experiment is a committed YAML in `config/experiments/`, and `train_consensus.py` writes the fully-resolved config to `config_used.yaml` in the run's output directory.
- **Give each run its own output directory**, keyed by date or job ID (e.g. `results/2026-07-15_<jobid>/`), so runs never overwrite each other.

For a fuller walkthrough of these tools, see the [Model, Data & Code Tracking guide](https://chicago-aiscience.github.io/index-1/).

> 🧰 - Sharing data with your group? `/project` directories are group-owned (mode `2770`, so new files inherit the group). Use `chgrp`/`chmod` for group-wide access, or `setfacl` for per-person control — see the [RCC access control guide](https://docs.rcc.uchicago.edu/data_sharing/access_control/).
