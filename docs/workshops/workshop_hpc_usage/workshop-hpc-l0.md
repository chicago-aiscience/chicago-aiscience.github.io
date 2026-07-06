# HPC Introduction

## Repository: https://github.com/chicago-aiscience/workshop-hpc-2026-sep

## Objectives

>**Goal** - Enable researchers to independently run a real, multi-stage GPU compute workflow on an HPC cluster from first login to a reproducible, parallelized, fault-tolerant pipeline using a single cell-microscopy segmentation project as the through-line.

**Lesson Goals:**

1. **Getting Started** — Log in to the cluster, set up a software environment, and submit your first interactive and batch jobs.
2. **Errors and Monitoring** — Watch jobs and GPU usage while they run, read metrics and logs to diagnose failures, and recover from interruptions.
3. **Data Management** — Move data on and off the cluster and place it across scratch, long-term, and node-local storage for fast, safe runs.
4. **Building Workflows** — Turn a multi-step pipeline into parallel job arrays chained by SLURM dependencies.
5. **Reproducibility and Checkpointing** — Pin environments, record manifests and job metadata, and checkpoint jobs so runs are repeatable and interruption-proof.

>Guiding design principle: every SLURM concept is taught by doing it to the same project (fine-tune → segment → measure → classify organoid images), so skills compound.

## Prequisites

Participants should be comfortable in a terminal:
- Navigating the filesystem
- Editing files (nano/vim or VS Code Remote)
- Running Python scripts and reading tracebacks
- Setting/using environment variables and may be new (or newer) to HPC/SLURM
- No deep ML background is assumed; the segmentation model is the example, not the focus.

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

It's a miniature version of a real UChicago research task: **analyzing microscopy images of brain organoids**. The pipeline fine-tunes a pretrained image-segmentation model on organoid images, uses it to outline every organoid, measures each one's shape, and predicts a quality label:

```
  images ─► build_manifest ─► seg_finetune ─► seg_infer ─┐
           (image/mask CSV)   (fine-tune)     (masks)    │
                                                         │
   ┌──────────────────────────────────────────────────———┘
   │
   └─► morphology ─► classify ─► evaluate
       (area+circ.)  (Acceptable?) (metrics+plots)
```

It's a *teaching* reimplementation of a production segmentation pipeline, rewritten as ~800 lines of readable Python so the focus stays on **running work on the cluster**, not on the machine-learning details. No ML background is needed — the model is the vehicle for learning HPC.

---

### What's in the repository

| Path | What it holds |
|---|---|
| [`environment.yml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/environment.yml) | The pinned `conda` environment (Python, PyTorch, scikit-image, …) |
| [`config/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/config) | `setup_env.sh` (builds the env, §5) and `paths.sh` (shared `INPUT_DIR` / `WORK_DIR` / `LABELS` paths, sourced by every job) |
| [`src/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/src) | The Python pipeline — one small script per stage (see below) |
| [`slurm/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/slurm) | The SLURM job scripts (`*.sbatch`) and interactive/monitoring walkthroughs (`*.md`) |
| `README.md`, `WORKSHOP_GUIDE.md` | Project overview and a map of which file teaches which lesson |

The pipeline itself (`src/`) is deliberately one readable script per step:

| Script | Stage | Runs on |
|---|---|---|
| `build_manifest.py` | List which images (and masks/labels) a job will use → a CSV "manifest" | CPU (instant) |
| `seg_finetune.py` | Fine-tune the segmentation model on hand-labeled images | **GPU** |
| `seg_infer.py` | Apply the model to many images → predicted outline masks | **GPU** |
| `morphology.py` | Turn masks into measurements (area, circularity) | CPU |
| `classify.py` | Predict organoid quality from those measurements | CPU |
| `evaluate.py` | Score the predictions and produce plots | CPU |

---

### How we'll use it across the workshop

Each lesson runs a different part of this same project, adding one layer of cluster skill:

| Lesson | What we do with the repo |
|---|---|
| **1. Getting Started** | Build the environment (§5) and submit the fine-tune as your first batch and interactive job |
| **2. Errors & Monitoring** | Watch that job's GPU usage, read its logs, and recover it from interruption |
| **3. Data Management** | Move the image dataset onto the cluster and place it across scratch / project storage |
| **4. Building Workflows** | Run segmentation in parallel with a **job array**, then chain the analysis steps with **dependencies** |
| **5. Reproducibility & Checkpointing** | Pin the environment, record manifests and job metadata, and checkpoint long runs |

---

### How you'll get it onto the cluster

You'll bring the code to the cluster with `git` (we'll cover moving files in Lesson 3):

```bash
git clone https://github.com/chicago-aiscience/workshop-hpc-2026-sep.git
cd workshop-hpc-2026-sep
```

The project runs on a **small subset of organoid images (~tens of MB)** provided for the workshop, so every stage finishes quickly and the whole pipeline fits comfortably in a workshop session.

> 🧰 — You don't need to read all the Python to follow the workshop. Think of `src/` as "the work" and `slurm/` + `config/` as "how we ask the cluster to run that work." Every lesson points you at the specific files it uses.
