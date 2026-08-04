# HPC Introduction

## Repository: https://github.com/chicago-aiscience/workshop-hpc-2026-sep

## Objectives

>**Goal** - Enable researchers to independently run a real, multi-stage GPU compute workflow on an HPC cluster from first login to a reproducible, parallelized, fault-tolerant pipeline using a single river-discharge modeling project (SWOT Confluence) as the through-line.

**Lesson Goals:**

1. **Getting Started** — Log in to the cluster, set up a software environment, and submit your first interactive and batch jobs.
2. **Errors and Monitoring** — Watch jobs and GPU usage while they run, read metrics and logs to diagnose failures, and recover from interruptions.
3. **Data Management** — Move data on and off the cluster and place it across scratch, long-term, and node-local storage for fast, safe runs.
4. **Building Workflows** — Turn a multi-step pipeline into parallel job arrays chained by SLURM dependencies.
5. **Reproducibility and Checkpointing** — Pin environments, record manifests and job metadata, and checkpoint jobs so runs are repeatable and interruption-proof.

>Guiding design principle: every SLURM concept is taught by doing it to the same project (build a manifest → train the consensus model → predict → aggregate → benchmark river discharge), so skills compound.

## Prequisites

Participants should be comfortable in a terminal:
- Navigating the filesystem
- Editing files (nano/vim or VS Code Remote)
- Running Python scripts and reading tracebacks
- Setting/using environment variables and may be new (or newer) to HPC/SLURM
- No deep ML background is assumed; the discharge model is the example, not the focus.

**Access & logistics (must be done before lesson 1)**

1. A cluster account on RCC (Midway) or the DSI cluster — provisioned ahead of time.
2. SSH set up and tested: an SSH key created and uploaded (DSI requires this) and/or Duo enrolled (RCC) with a successful test login before the workshop.
3. A terminal / SSH client: native on macOS/Linux; Windows users need WSL, Windows Terminal, or PuTTY.
4. Permission to submit to the target partition, including a GPU partition/allocation if their account needs to be added to one (GPU access is often gated separately).
5. Workshop materials staged: the project repo + the shared mini dataset (~tens of MB) available to copy.


## Symbols

- 👉 - Some action should be taken in the workshop steps (indicates interactive step)
- 🧰 - A tip that might make something easier or provides further explanation
- ✅ - Verification checkpoint to determine current progress

## Introducing the workshop repository

Throughout this series we'll work with a single real project so that each new cluster skill is practiced on the same, growing example rather than disconnected toy commands. The repository lives here:

**https://github.com/chicago-aiscience/workshop-hpc-2026-sep**

### What the project does

It's a miniature version of a real research task: **estimating river discharge from SWOT satellite observations**. Several algorithms each estimate discharge for a river reach; the pipeline trains a small model to learn a *consensus* of those estimates against observed gauge discharge, predicts discharge for every reach, gathers the results, and scores them:

```
  SoS + SVS ─► build_manifest ─► train_consensus ─► predict_discharge ─┐
  (+ priors)   (per-reach CSV)   (learn consensus)   (per-reach Q)      │
                                                                        │
   ┌──────────────────────────────────————————————————————————————————─┘
   │
   └─► aggregate_discharge ─► benchmark_consensus ─► evaluate
       (one tidy table)       (skill vs. gauge)      (scores + plots)
```

It's a *teaching* reimplementation built on real [SWOT Confluence](https://podaac.jpl.nasa.gov/) products, rewritten as a few hundred lines of readable Python so the focus stays on **running work on the cluster**, not on the modeling details. No ML background is needed — the model is the vehicle for learning HPC.

---

### What's in the repository

| Path | What it holds |
|---|---|
| [`environment.yml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/environment.yml) | The pinned `conda` environment (Python, PyTorch, netCDF4, pandas, …) |
| [`config/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/config) | `setup_env.sh` (builds the env, §5), `paths.sh` (shared data paths + `EXPERIMENT_CONFIG`, sourced by every job), and `experiments/` (YAML experiment configs) |
| [`src/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/src) | The Python pipeline — one small script per stage (see below) |
| [`slurm/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/slurm) | The SLURM job scripts (`*.sbatch`) and interactive/monitoring walkthroughs (`*.md`) |
| `README.md`, `WORKSHOP_GUIDE.md` | Project overview and a map of which file teaches which lesson |

The pipeline itself (`src/`) is deliberately one readable script per step:

| Script | Stage | Runs on |
|---|---|---|
| `build_manifest.py` | Join the SoS, gauge (SVS), and prior inputs → one row per (reach, overpass) CSV "manifest" | CPU (instant) |
| `train_consensus.py` | Train the consensus model to predict gauge discharge from the algorithm estimates | **GPU** |
| `predict_discharge.py` | Apply the model to every reach → predicted discharge | **GPU** |
| `aggregate_discharge.py` | Concatenate the per-shard predictions → one tidy discharge table | CPU |
| `benchmark_consensus.py` | Score the learned consensus against the gauge (NSE, KGE, RMSE, %bias) | CPU |
| `evaluate.py` | Produce the summary and plots | CPU |

---

### How we'll use it across the workshop

Each lesson runs a different part of this same project, adding one layer of cluster skill:

| Lesson | What we do with the repo |
|---|---|
| **1. Getting Started** | Build the environment (§5) and submit the training step as your first batch and interactive job |
| **2. Errors & Monitoring** | Watch that job's GPU usage, read its logs, and recover it from interruption |
| **3. Data Management** | Move the SWOT input data onto the cluster and place it across scratch / project / node-local storage |
| **4. Building Workflows** | Run prediction in parallel with a **job array**, then chain the analysis steps with **dependencies** |
| **5. Reproducibility & Checkpointing** | Pin the environment, record configs and job metadata, and checkpoint long runs |

---

### How you'll get it onto the cluster

You'll bring the code to the cluster with `git` (we'll cover moving files in Lesson 3):

```bash
git clone https://github.com/chicago-aiscience/workshop-hpc-2026-sep.git
cd workshop-hpc-2026-sep
```

The project runs on a **small two-basin subset of the SWOT Confluence products (~tens of MB)** provided for the workshop, so every stage finishes quickly and the whole pipeline fits comfortably in a workshop session.

> 🧰 — You don't need to read all the Python to follow the workshop. Think of `src/` as "the work" and `slurm/` + `config/` as "how we ask the cluster to run that work." Every lesson points you at the specific files it uses.
