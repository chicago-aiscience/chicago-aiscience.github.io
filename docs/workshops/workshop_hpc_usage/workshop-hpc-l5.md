# Lesson 5: Reproducibility (BONUS)

## Objectives

Make a run repeatable - by you next month, by a collaborator next year - and make long runs survive interruption.

- **Levels of reproducibility** - Decide *how* reproducible a run needs to be before paying for it.
- **Pinning environments** - Pin what `conda` can pin, and record what it can't.
- **Configuration** - Defaults in code, overridden by a committed config file, overridden by CLI flags.
- **Data and manifests** - Record exactly which inputs a run consumed.
- **Deterministic operations** - Seeding, library determinism flags, what they cost, and why a tolerance beats bit-for-bit equality.
- **Job metadata** - Stamp the job id, git SHA, and environment into the results.
- **Checkpointing** - What belongs in a checkpoint, how often to write one, and the options beyond in-code checkpointing.

> 🧰 - This is a **bonus** lesson. Nothing here is required to run jobs on the cluster - it's what keeps those jobs' results defensible six months later. Most of it is small, one-time work you do once per project.

---

## 1. What "reproducible" actually means

[Lesson 2](./workshop-hpc-l2.md#data-best-practices) posed the test: *six months from now, could you still answer which data was used, which version of the code ran, what parameters were set, and can I reproduce this result?*

"Reproduce" is not one thing, though. It's a ladder, and each rung costs more than the one below it:

| Level | The question it answers | What it takes |
|---|---|---|
| **Repeatable** | Can *I* rerun this next month and get the same result? | Pinned environment, committed config, recorded inputs |
| **Reproducible** | Can a *colleague* rerun it on the same cluster? | + no hardcoded paths, a documented data source, no hidden local state |
| **Portable** | Does it still work on a *different* cluster or GPU? | + a lock file or container, no hardware assumptions |
| **Bitwise identical** | Are the outputs byte-for-byte equal? | + seeding, deterministic kernels, fixed thread counts, *and the same hardware* |

**Most scientific work should target "portable" and hold results to a tolerance** rather than chase bitwise equality. The last rung is achievable, but it constrains your hardware and can slow your code down - see [§5](#deterministic-operations).

A result is the product of six things. Pin the first five and hardware is the only thing left that can move:

```{mermaid}
flowchart TD
    C["<b>Code</b><br/>git SHA"] --> R(["<b>Result</b>"])
    E["<b>Environment</b><br/>pinned spec"] --> R
    D["<b>Data</b><br/>manifest + hashes"] --> R
    P["<b>Config</b><br/>committed YAML"] --> R
    S["<b>Randomness</b><br/>seeds"] --> R
    H["<b>Hardware</b><br/>GPU, thread count"] -.-> R
```

The rest of this lesson works through each of them - environment, config, data, randomness, and the record that ties them together - then returns to checkpointing.

---

(pinning-environments)=
## 2. Pinning environments

An environment that resolves differently each time it's built is the most common reason a run stops reproducing. `conda env create` without version constraints gives you whatever was newest the day you ran it.

### Levels of pinning

| Level | What it looks like | Rebuilds identically? | Good for |
|---|---|---|---|
| **Unpinned** | `numpy` | ❌ No | Nothing - avoid |
| **Minor-pinned** | `numpy=2.2.*` | Mostly - patch versions can move | Readable specs you maintain by hand |
| **Exact** | `numpy=2.2.6` | Yes, if the package is still hosted | Publishing a result |
| **Locked** | `numpy=2.2.6=py311h...` + channel URLs | Yes, on the same platform | Archival / handing off a run |

The workshop's [`environment.yml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/environment.yml) sits at the **minor-pinned** level:

```yaml
dependencies:
  - python=3.11
  - numpy=2.2.*
  - pandas=2.3.*
  - netcdf4=1.7.*
  - pip:
      - torch==2.8.*
```

That's a deliberate trade-off: it stays readable and hand-editable, it accepts patch-level bug fixes, and it still rebuilds the same major/minor stack months later. It is *not* a lock file.

### Generating a lock file

When you want the archival version - the one that pins transitive dependencies and build strings too - export from a working environment:

```bash
conda env export --no-builds > environment.lock.yml   # every package + version, no build strings
conda list --explicit      > environment.lock.txt     # exact package URLs (platform-specific)
```

- **`--no-builds`** - Portable across platforms; pins versions but lets conda re-solve build variants.
- **`conda list --explicit`** - The strictest option. Rebuild with `conda create --name env --file environment.lock.txt`. It records exact URLs, so it only works on the same OS/architecture.
- **`conda env export --from-history`** - The *opposite* of a lock: only the packages you explicitly asked for, no transitive dependencies. Useful for cleaning up a hand-written spec, not for reproducing one.

On the pip side, `pip freeze > requirements.lock.txt` is the equivalent; [`pip-compile --generate-hashes`](https://pip-tools.readthedocs.io/) additionally records a hash per wheel so a tampered or re-uploaded package fails loudly.

> 🧰 - Commit both files: `environment.yml` is the spec humans read and edit, `environment.lock.*` is the artifact that reproduces a specific run. Regenerate the lock whenever you intentionally change the spec.

### What conda cannot pin

Your environment is only part of the software stack a job runs against. These live outside it:

| Outside the env | Why it matters | What to do |
|---|---|---|
| **Cluster modules** | `module load python` gives you whatever the site's default is *today* | Always load a version: `module load python/anaconda-2025.12` |
| **NVIDIA driver** | Sets the maximum CUDA the node supports; varies node to node | Record it; don't assume it |
| **System MPI / compilers** | Node-dependent, not captured by conda | Load a pinned module and record it |
| **`$PATH`, shell rc files** | An inherited variable can shadow your env | `set -euo pipefail`, activate explicitly, don't rely on `.bashrc` |

Since you can't pin them all, **record them** - that's what [§6](#job-metadata) is for.

### Containers: the strongest pin

If your cluster provides Apptainer (formerly Singularity), a container image pins the OS, the system libraries, *and* your environment in one artifact, referenced by digest:

```bash
apptainer exec --nv /project/<group>/images/workshop-hpc.sif python src/train_consensus.py ...
```

`--nv` passes the node's NVIDIA driver into the container - the one thing the image deliberately does *not* carry, since it has to match the host.

> 🧰 - A conda environment is thousands of small files, which is slow on shared storage (see [Lesson 2](./workshop-hpc-l2.md#data-best-practices)). A `.sif` image is a **single file**, which is why containers often start faster in a large job array than a conda env does. Build the environment **once** in a known location and activate it from every job - never rebuild it inside an array task.

---

(config-files)=
## 3. Configuration: defaults, config files, and CLI overrides

Parameters that live only in your shell history are the fastest way to lose a result. The fix is a three-layer scheme that gives you a recorded default *and* the convenience of flags.

```{mermaid}
flowchart LR
    A["<b>DEFAULTS</b><br/>in code (src/config.py)<br/><i>always present</i>"] --> B["<b>YAML config</b><br/>config/experiments/*.yaml<br/><i>committed = the experiment</i>"] --> C["<b>CLI flag</b><br/>--lr 3e-4<br/><i>one-off override</i>"] --> D["<b>Resolved config</b><br/>written to config_used.yaml"]
```

Each layer overrides the one before it. Nothing is ever *only* on the command line, because the resolved result is written next to the output.

### How the workshop does it

[`src/config.py`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/src/config.py) holds the canonical defaults - one place that knows every knob's fallback value:

```python
DEFAULTS: dict = {
    "data":  {"basins": ["2322", "2326"]},   # SWORD basin prefixes to include
    "model": {"hidden": 64},                 # width of the MLP's two hidden layers
    "train": {"epochs": 50, "batch_size": 256, "lr": 1e-3, "checkpoint_interval": 50},
}
```

[`config/experiments/baseline.yaml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/config/experiments/baseline.yaml) is the committed experiment - only the knobs it changes:

```yaml
data:
  basins: [2322, 2326]          # 2322 = Loire, 2326 = Rhine
model:
  hidden: 64
train:
  epochs: 500
  batch_size: 256
  lr: 1.0e-3
  checkpoint_interval: 50       # steps between rolling checkpoints (0 disables)
```

And the CLI keeps the flags, for anyone who'd rather type than edit a file:

```python
# Hyperparameters default to None: unset -> take the config/DEFAULTS value;
# set -> override the config for this run.
ap.add_argument("--lr", type=float, default=None)
ap.add_argument("--epochs", type=int, default=None)
```

```python
cfg = load_config(args.config)                    # DEFAULTS <- YAML
apply_overrides(cfg, [                            #           <- CLI (only when not None)
    ("model.hidden",  args.hidden),
    ("train.epochs",  args.epochs),
    ("train.lr",      args.lr),
])
```

> 🧰 - The `default=None` is what makes this work. If you write `default=1e-3` in `argparse`, you can no longer tell "the user asked for 1e-3" apart from "the user said nothing" - and the flag silently overrides your config file on *every* run. `None` means "not passed", so the config wins.

### Writing the resolved config next to the results

One line, and every run becomes self-describing:

```python
save_config(cfg, out / "config_used.yaml")      # the fully-merged knobs, in the run's output dir
```

This is the habit from [Lesson 2](./workshop-hpc-l2.md#track-experiments-configs-and-results), made concrete. `config_used.yaml` is the *merged* result - defaults, YAML, and any CLI overrides folded together - so you never have to reconstruct what a flag did.

### The rules that follow

1. **A new experiment is a new committed YAML.** Copy `baseline.yaml` to `wider.yaml`, change `hidden: 128`, commit it. Git then diffs your experiments for you.
2. **A CLI flag is for a one-off.** Smoke tests (`--epochs 1`), a single sweep point, a debugging run. If you find yourself passing the same flag repeatedly, it belongs in a config file.
3. **Keep paths and secrets out of the experiment config.** Those are *where the job runs*, not *what the experiment is*. The workshop keeps them in [`config/paths.sh`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/config/paths.sh) as environment variables, so the same experiment YAML works on RCC and DSI unchanged.
4. **Save the resolved config from every stage that has knobs**, not just training.

> 🧰 - Note the gap in the workshop repo as shipped: `build_manifest.py` accepts `--basins` to override `data.basins`, but doesn't call `save_config()`. It gets away with it because the manifest carries a `basin` column, so the record survives in the data itself. Your own code won't always be that lucky - write a `config_used.yaml` per stage.

---

(data-manifests)=
## 4. Data: manifests and input provenance

Code and config are easy to version. Data is the hard one - it's large, it lives outside the repo, and it changes.

### The manifest as the record of what was consumed

A **manifest** is a small table that says exactly which data rows a run used. In the workshop, [`build_manifest.py`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/src/build_manifest.py) joins the SoS algorithm discharges, the ML priors, and the gauge target into one row per `(reach, SWOT overpass)`:

```text
reach_id, basin, date, month, q_metroman, q_momma, q_neobam, q_sic4dvar,
q_consensus, prior_mean_q, prior_monthly_q, gauge_q
```

It does three jobs at once:

- **Provenance** - The manifest *is* the record of which reaches and dates a run touched. Keep it with the results and the question "which data was used?" answers itself.
- **Decoupling** - It separates *where* data lives from *what* a job reads. That's what made node-local staging ([Lesson 2](./workshop-hpc-l2.md#data-best-practices)) and array sharding ([Lesson 4](./workshop-hpc-l4.md)) possible - `predict_discharge.py` strides the manifest by `$SLURM_ARRAY_TASK_ID` and needs to know nothing about the filesystem.
- **A cheap diff** - Two runs that disagree are much easier to debug when you can diff their manifests first.

> 🧰 - Build the manifest **once** and reuse it across stages, rather than re-deriving the input list in each script. A manifest that is rebuilt per stage can silently drift between them.

### Hash the inputs

A manifest says which *rows* were used; a hash says the underlying *file* hasn't changed:

```bash
sha256sum "$SOS_FILE" "$SVS_FILE" "$PRIORS_FILE" > "$WORK_DIR/runs/consensus/input_hashes.txt"
```

For multi-gigabyte inputs where hashing is too slow to do per job, record `path`, `size`, and `mtime` instead, and hash only the (much smaller) manifest built from them.

### Where each kind of data belongs

| Data | Versioned by | Lives in |
|---|---|---|
| Raw inputs (read-only) | Hash + documented source | `/project` (durable, backed up) |
| Manifests | Committed script + recorded config | The run's output directory |
| Intermediate / per-shard files | Nothing - they're re-derivable | `/scratch` or node-local |
| Final results | The run directory + its metadata | `/project` |
| Large files you need to version | [DVC](../../user_guide/tracking/dvc.md) or a committed pointer file | Repo pointer + a remote |

The two habits from [Lesson 2](./workshop-hpc-l2.md#data-best-practices) still carry most of the weight: **keep raw inputs read-only** so a stray job can't corrupt them, and **give every run its own output directory** so nothing is overwritten.

> 🧰 - For files too large for Git but too static to justify DVC, a committed **pointer file** (a few lines of YAML with `path`, `sha256`, `source`, and `git_commit`) gives you the same guarantee for almost no setup. The [Model, Data & Code Tracking guide](https://chicago-aiscience.github.io/index-1/) walks through pointers, DVC, MLflow, and W&B, and when each is worth adopting.

---

(deterministic-operations)=
## 5. Deterministic operations

Everything so far pins the *inputs*. Randomness is what's left: two runs with identical code, environment, data, and config can still disagree.

### Where the randomness comes from

| Source | Controlled by a seed? |
|---|---|
| Weight initialization | ✅ Yes |
| Data shuffling / batch order | ✅ Yes |
| Train/test splits | ✅ Yes |
| Dropout, augmentation, sampling | ✅ Yes |
| Python `set`/`dict` iteration order (string hashing) | ✅ Yes, via `PYTHONHASHSEED` |
| GPU parallel reductions and atomics | ❌ No - needs deterministic kernels |
| Thread count (`OMP_NUM_THREADS`) changing reduction order | ❌ No - pin the thread count |
| TF32 / mixed precision on Ampere+ GPUs | ❌ No - a numerics setting, not a seed |
| A different GPU model or library version | ❌ No - not fixable by any flag |

The first block is cheap to fix and buys you most of what you want. The second block is where the cost is.

### Step 1: seed everything

```python
import random

import numpy as np
import torch

def set_seed(seed: int) -> None:
    """Seed every RNG a run touches. Call once, before building the model."""
    random.seed(seed)                 # Python's random module
    np.random.seed(seed)              # NumPy's legacy global RNG
    torch.manual_seed(seed)           # PyTorch CPU *and* all visible CUDA devices
```

`DataLoader` shuffling needs one more step - pass an explicitly seeded generator, and re-seed the worker processes:

```python
def seed_worker(worker_id: int) -> None:
    """Re-seed numpy/random inside each DataLoader worker process."""
    worker_seed = torch.initial_seed() % 2**32
    np.random.seed(worker_seed)
    random.seed(worker_seed)

g = torch.Generator()
g.manual_seed(seed)

loader = DataLoader(ds, batch_size=bs, shuffle=True,
                    generator=g, worker_init_fn=seed_worker)
```

And `PYTHONHASHSEED` has to be set *before* the interpreter starts, so it goes in the batch script:

```bash
export PYTHONHASHSEED=0
export OMP_NUM_THREADS=${SLURM_CPUS_PER_TASK:-1}   # pin thread count: reduction order depends on it
```

> 🧰 - Prefer `np.random.default_rng(seed)` for new NumPy code - it gives you an isolated generator instead of mutating global state. `np.random.seed()` is shown above because most existing scientific code still uses the global RNG, and seeding it is what makes *that* code reproducible.

### Step 2: ask the libraries for deterministic kernels

Seeding fixes *which* numbers get drawn. It does not fix the *order* in which a GPU sums them - and floating-point addition isn't associative, so a different order gives a different last bit.

```python
torch.use_deterministic_algorithms(True)      # error out if an op has no deterministic version
torch.backends.cudnn.deterministic = True     # pick deterministic cuDNN kernels
torch.backends.cudnn.benchmark = False        # disable the autotuner (it picks by timing = varies)
```

Separately, **TF32** is about numerics rather than determinism: it makes a run agree with itself but *not* with the same code on an older GPU. If you need results that match across hardware generations, turn it off:

```python
torch.backends.cudnn.allow_tf32 = False       # defaults to True - this is the one that usually bites
torch.backends.cuda.matmul.allow_tf32 = False # already False by default in PyTorch 2.x; set it explicitly
```

`use_deterministic_algorithms(True)` also requires a cuBLAS workspace setting, again before the process starts:

```bash
export CUBLAS_WORKSPACE_CONFIG=:4096:8    # required by torch.use_deterministic_algorithms on CUDA
```

Other libraries have their own switches. The ones worth knowing:

| Library | What to set | Note |
|---|---|---|
| **scikit-learn** | `random_state=42` on *every* estimator and splitter (`train_test_split`, `KFold(shuffle=True, ...)`, `RandomForest`, `KMeans`) | It has no global seed - an unset `random_state` is a silent source of drift |
| **XGBoost** | `seed=42`, and pin `tree_method` explicitly | The CPU `hist` builder is reproducible; the GPU path historically has not been guaranteed to be, so verify it if you rely on it |
| **LightGBM** | `seed=42`, `deterministic=True`, `force_row_wise=True` | `deterministic=True` alone isn't enough without fixing the binning mode |
| **JAX** | Explicit `PRNGKey` split through every call | No global RNG at all - randomness is always passed in, which is the design that makes this easy |
| **TensorFlow** | `tf.keras.utils.set_random_seed(42)` + `tf.config.experimental.enable_op_determinism()` | The `enable_op_determinism` call is TF's equivalent of `use_deterministic_algorithms` |

> 🧰 - `use_deterministic_algorithms(True)` **raises a `RuntimeError`** for operations that have no deterministic implementation, rather than silently continuing. That is the point - but it means enabling it can break a working script. Common offenders are the backward passes of scatter/index operations, `nn.Embedding` (dense gradients), some pooling layers, and `interpolate`. `warn_only=True` downgrades the error to a warning while you work out which op is responsible.

### Step 3: accept that this costs something

Determinism is not free:

- **`cudnn.benchmark = False`** gives up the autotuner that picks the fastest convolution kernel for your shapes. On convolution-heavy models this is the largest single cost.
- **Deterministic kernels** are sometimes slower implementations of the same operation, because the fast version relies on atomics.
- **Disabling TF32** can slow matmul-heavy work substantially on Ampere and newer cards, where TF32 tensor cores are several times faster than full FP32.

**How much slower depends entirely on your op mix - measure it, don't guess.** Time one epoch with the flags on and one with them off before deciding.

The workshop's consensus MLP is a useful contrast: it's `Linear` → `ReLU` → `MSELoss`, all of which are already deterministic, so the flags cost essentially nothing here. **Seeding alone makes it reproducible.** That won't hold for a convolutional or transformer model.

### Step 4: hold results to a tolerance instead

Given the cost, bitwise equality is usually the wrong target. The useful question isn't "are the bytes identical?" but **"is the difference small enough that my conclusion doesn't change?"**

That threshold is yours to set, and it should be set at the level of the *reported result*, not the raw tensors:

```python
import numpy as np

# Element-level: are two prediction arrays close enough?
np.testing.assert_allclose(new_q, ref_q, rtol=1e-5, atol=1e-8)

# Conclusion-level: does the skill score still round to the same answer?
assert abs(new_nse - ref_nse) < 0.01, f"NSE moved by {abs(new_nse - ref_nse):.4f}"
```

`torch.testing.assert_close` does the same for tensors, with sensible per-dtype defaults.

Two things make this practical:

- **Pick the tolerance from the science, not the arithmetic.** If discharge is reported to three significant figures and gauge measurement error is 5-10%, a `1e-6` disagreement between two runs is noise. Say so explicitly, in a comment or the run's README, so nobody re-litigates it later.
- **A tolerance is a *test*, not a shrug.** Store a reference result, compare against it on every rerun, and fail loudly when the difference exceeds the threshold. That catches a real regression (a changed preprocessing step) while ignoring a harmless one (a new GPU model).

> 🧰 - The single most useful thing you can do here is **record the seed in the config and in the run metadata**. A run you can't re-seed can't be re-run at all - the tolerance question never even comes up.

### 👉 Try it: make training reproducible, then check the cost

The workshop's `train_consensus.py` doesn't seed anything today - `DataLoader(..., shuffle=True)` draws from the global torch RNG, so two runs of `02_train.sbatch` produce different weights. Fixing that is a self-contained exercise.

**1. Add a `seed` knob** to `DEFAULTS` in `src/config.py` and to `config/experiments/baseline.yaml`:

```yaml
train:
  seed: 42
```

**2. Add `set_seed()`** (from Step 1 above) to `src/train_consensus.py` and call it in `main()`, right after the config is resolved and before `build_dataloader`. Add a matching `--seed` flag with `default=None` so it can be overridden per run.

**3. Run it twice into separate directories and compare.** In an interactive session ([Lesson 1.7](./workshop-hpc-l1.md#running-interactive-job)), so both runs land where you want them. This uses the training manifest built by `02_train.sbatch` - if you don't have it yet, run `build_manifest.py` first as shown in [Lesson 3.6](./workshop-hpc-l3.md#test-job-interruptions):

```bash
source config/paths.sh
module load python/anaconda-2025.12
conda activate $ENV_NAME

for tag in a b; do
  python src/train_consensus.py --config "$EXPERIMENT_CONFIG" \
      --manifest "$WORK_DIR/data/manifest_train.csv" \
      --out "$WORK_DIR/runs/consensus_$tag" --epochs 5
done
```

Then check that the two final models agree:

```bash
python - <<PY
import torch
a = torch.load("$WORK_DIR/runs/consensus_a/consensus_model_final.pt", map_location="cpu")["model"]
b = torch.load("$WORK_DIR/runs/consensus_b/consensus_model_final.pt", map_location="cpu")["model"]
print(max((a[k] - b[k]).abs().max().item() for k in a))   # ~0.0 once seeded, nonzero before
PY
```

Run this **before** adding `set_seed()` too - the same command prints a clearly nonzero number, which is the whole point.

**4. Optional - measure the determinism flags.** Add the Step 2 block plus `CUBLAS_WORKSPACE_CONFIG` and time an epoch with and without. On this MLP you should see no meaningful difference; the exercise is worth repeating on your own model, where it may look very different.

---

(job-metadata)=
## 6. Recording job metadata into results

You now control the inputs. The last piece is making each *output* carry the record of how it was produced - so a results directory found a year later explains itself without the shell history that produced it.

### What to record

| Field | Why you'll want it |
|---|---|
| `slurm_job_id`, `array_task_id` | The key that ties results back to `sacct` and the `.out`/`.err` logs |
| `git_commit`, `git_branch`, `git_dirty` | Which code ran - and whether there were uncommitted changes |
| `hostname`, `nodelist`, `gpu_name`, `driver_version` | Hardware, for when results differ across nodes |
| `env_name`, `env_hash`, `modules` | The software stack conda + `module` actually provided |
| `config_path`, `config_used.yaml`, `seed` | The knobs ([§3](#config-files)) and the randomness ([§5](#deterministic-operations)) |
| `input_paths` + hashes, `manifest_rows` | The data ([§4](#data-manifests)) |
| `started_at`, `finished_at`, `restart_count` | Wall time, and whether the job was requeued mid-run |

> 🧰 - `git_dirty` is the one people skip and later regret. A commit SHA is only meaningful if the working tree was clean when the job started - otherwise it names code that never actually ran.

### Writing it from the batch script

This works for any language, so it's the version worth copying. Drop it into your `.sbatch` **before** the Python step:

```bash
RUN_DIR="$WORK_DIR/runs/consensus"
mkdir -p "$RUN_DIR"

cat > "$RUN_DIR/run_metadata.json" <<EOF
{
  "slurm_job_id":   "${SLURM_JOB_ID:-}",
  "array_task_id":  "${SLURM_ARRAY_TASK_ID:-}",
  "restart_count":  "${SLURM_RESTART_COUNT:-0}",
  "partition":      "${SLURM_JOB_PARTITION:-}",
  "nodelist":       "${SLURM_JOB_NODELIST:-}",
  "hostname":       "$(hostname)",
  "cpus_per_task":  "${SLURM_CPUS_PER_TASK:-}",
  "gpu":            "$(nvidia-smi --query-gpu=name,driver_version --format=csv,noheader 2>/dev/null | head -1)",
  "git_commit":     "$(git rev-parse HEAD 2>/dev/null || echo unknown)",
  "git_branch":     "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)",
  "git_dirty":      $( [ -n "$(git status --porcelain 2>/dev/null)" ] && echo true || echo false ),
  "env_name":       "${ENV_NAME:-}",
  "env_hash":       "$(sha256sum environment.yml 2>/dev/null | cut -c1-16)",
  "config":         "${EXPERIMENT_CONFIG:-}",
  "started_at":     "$(date -Is)"
}
EOF

# The fuller software + module record, as plain text alongside it
module list           2> "$RUN_DIR/modules.txt"
conda list --explicit  > "$RUN_DIR/env_explicit.txt"
```

> 🧰 - `module list` writes to **stderr**, not stdout - hence the `2>`. A `>` redirect there silently produces an empty file.

### Or from Python

If you'd rather keep it with the code that writes the results, the same record fits in a short helper. This slots naturally next to `save_config()` in `src/config.py`:

```python
import json, os, socket, subprocess, datetime
from pathlib import Path


def _git(*args: str) -> str | None:
    """Run a git command, returning None outside a repo (never fail the job for metadata)."""
    try:
        return subprocess.check_output(["git", *args], text=True,
                                       stderr=subprocess.DEVNULL).strip()
    except Exception:
        return None


def save_run_metadata(path: str | Path, **extra) -> None:
    """Write a self-describing provenance record next to a run's results."""
    status = _git("status", "--porcelain")     # "" = clean tree, None = git unavailable
    meta = {
        "slurm_job_id":  os.environ.get("SLURM_JOB_ID"),
        "array_task_id": os.environ.get("SLURM_ARRAY_TASK_ID"),
        "restart_count": os.environ.get("SLURM_RESTART_COUNT", "0"),
        "nodelist":      os.environ.get("SLURM_JOB_NODELIST"),
        "hostname":      socket.gethostname(),
        "git_commit":    _git("rev-parse", "HEAD"),
        "git_branch":    _git("rev-parse", "--abbrev-ref", "HEAD"),
        "git_dirty":     None if status is None else bool(status),
        "started_at":    datetime.datetime.now().astimezone().isoformat(),
        **extra,                      # e.g. seed=..., manifest=..., input_hashes=...
    }
    Path(path).write_text(json.dumps(meta, indent=2))
```

> 🧰 - Note the three-state `git_dirty`. `bool(_git(...))` would look tidier, but it collapses "git wasn't available" into `False` - i.e. it reports a clean tree when it actually knows nothing. `null` is the honest answer, and it's the difference between metadata you can trust and metadata that quietly lies.

Called from `main()` right after `save_config()`:

```python
save_config(cfg, out / "config_used.yaml")
save_run_metadata(out / "run_metadata.json", config=cfg, manifest=args.manifest)
```

> 🧰 - Note the broad `except Exception` in `_git`. Provenance capture must never be the thing that kills a six-hour training job - if `git` isn't on the node's `PATH`, record `null` and carry on.

### What a self-describing run directory looks like

```text
runs/consensus/
├── config_used.yaml            # §3 - the fully-resolved knobs (defaults + YAML + CLI)
├── run_metadata.json           # §6 - job id, git SHA, node, GPU, seed, timestamps
├── modules.txt                 # §2 - the cluster modules that were loaded
├── env_explicit.txt            # §2 - the exact conda packages present
├── input_hashes.txt            # §4 - sha256 of each input file
├── consensus_last.pt           # §7 - rolling checkpoint (resume point)
└── consensus_model_final.pt    #      the artifact, with config + feature names inside
```

Everything except the last two lines is a few hundred bytes. That's the whole cost.

### Stamping provenance into the data itself

A sidecar file can get separated from the data it describes. Where the format has somewhere to put metadata, put it there too:

- **netCDF** - Set global attributes. This is the convention in the SWOT/Confluence world, and `history` is a CF standard:

  ```python
  ds.history     = f"{datetime.date.today()}: created by train_consensus.py"
  ds.source      = "workshop-hpc-2026-sep"
  ds.git_commit  = git_commit
  ds.slurm_job_id = os.environ.get("SLURM_JOB_ID", "")
  ```

- **Parquet** - Key/value metadata in the file footer, via `pyarrow`.
- **CSV** - No metadata slot at all. Use a sidecar (`discharge.csv` + `discharge.metadata.json`) and keep them in the same directory.

### Resource usage, after the fact

`sacct` is the record of what the job actually *used* - but querying it from inside the running job reports a job still in progress. Collect it afterwards ([Lesson 3](./workshop-hpc-l3.md)):

```bash
sacct -j <JOBID> -P --format=JobID,JobName,State,Elapsed,TotalCPU,MaxRSS,ReqMem,ExitCode \
    > runs/consensus/sacct.txt
```

`-P` gives pipe-delimited output that parses cleanly. Recent Slurm versions also support `sacct -j <JOBID> --json`, which returns the full record as JSON - check with `sacct --help` on your cluster.

### 👉 Try it: capture your run's provenance

**1. Add the metadata block.** Paste the bash block above into [`slurm/02_train.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/02_train.sbatch), after `source config/paths.sh` and before the first `python` call.

**2. Submit it:**

```bash
cd $HOME/workshop-hpc-2026-sep
sbatch slurm/02_train.sbatch
```

**3. When it finishes, read the record back:**

```bash
source config/paths.sh
cat "$WORK_DIR/runs/consensus/run_metadata.json"
ls   "$WORK_DIR/runs/consensus/"          # config_used.yaml, run_metadata.json, modules.txt, ...
```

**4. Break it on purpose.** Make an uncommitted edit to `src/train_consensus.py`, resubmit, and confirm `git_dirty` flips to `true`. That flag is what tells future-you the SHA can't be trusted.

---

(advanced-checkpointing)=
## 7. Checkpointing: beyond the basics

[Lesson 3](./workshop-hpc-l3.md#recover-from-interruptions) built the working pattern: `--requeue` plus `--signal=B:USR2@120`, a trap that relays the signal to the training process, an atomic save at the next safe step boundary, and `scontrol requeue` to resume from `consensus_last.pt`. That machinery is what survives the `--time` wall, preemption, and node failure alike.

This section covers what to put *in* the checkpoint, how often to write one, and what exists beyond in-code checkpointing.

### What belongs in a checkpoint

A checkpoint has to contain everything needed to make the next step identical to the step that would have run. Missing pieces don't crash - they quietly change your results after a requeue.

| Contents | Why | In the workshop's checkpoint? |
|---|---|---|
| Model `state_dict` | The weights | ✅ |
| Optimizer `state_dict` | Adam's momentum/variance - drop it and training visibly stumbles on resume | ✅ |
| Epoch / step + `epoch_completed` | Where to resume from | ✅ |
| Feature names | So prediction reads the right columns | ✅ |
| LR scheduler state | Otherwise the schedule silently restarts | n/a (no scheduler) |
| AMP `GradScaler` state | Mixed-precision loss scale | n/a (no AMP) |
| **RNG states** | So shuffling and dropout continue the same stream after a resume | ❌ - see below |
| Resolved config | Makes the checkpoint self-describing on its own | ✅ (in the final model) |

That last gap is the one that closes the loop with [§5](#deterministic-operations): a seeded run that gets requeued **re-seeds from the same value and replays the same shuffle order**, which is not the same as continuing. If you care about reproducibility across interruptions, carry the RNG state:

```python
def snapshot(epoch, step, done):
    return {
        "model": model.state_dict(), "opt": opt.state_dict(),
        "epoch": epoch, "step": step, "epoch_completed": done,
        "feature_names": names,
        "rng": {                                        # <-- continue the stream, don't restart it
            "python": random.getstate(),
            "numpy":  np.random.get_state(),
            "torch":  torch.get_rng_state(),
            "cuda":   torch.cuda.get_rng_state_all() if torch.cuda.is_available() else None,
        },
    }
```

Restore them in `load_checkpoint()`, *after* `set_seed()` has run, so the restored stream wins:

```python
if (rng := state.get("rng")):
    random.setstate(rng["python"])
    np.random.set_state(rng["numpy"])
    torch.set_rng_state(rng["torch"])
    if rng["cuda"] is not None and torch.cuda.is_available():
        torch.cuda.set_rng_state_all(rng["cuda"])
```

> 🧰 - Even with RNG state saved, resuming *mid-epoch* exactly requires the `DataLoader` sampler's position too, which PyTorch does not checkpoint for you. This is why the workshop resumes at **epoch boundaries** (`epoch_completed`) - it's the pragmatic answer, and it costs at most one partial epoch of redone work.

### How often to checkpoint

Checkpointing too rarely means redoing work; too often means the job spends its time writing to shared storage instead of computing.

When interruptions are **random** (preemption, node failure), the classic answer is the Young/Daly formula:

```text
optimal interval ≈ sqrt( 2 × checkpoint_cost × mean_time_between_interruptions )
```

A 30-second checkpoint on a cluster that interrupts you roughly every 12 hours gives `sqrt(2 × 30 × 43200) ≈ 1610 s`, so **about every 27 minutes**. The formula is a first-order approximation - it tells you the right order of magnitude, and that the answer is "minutes to tens of minutes", not "every step".

When the interruption is **not** random - RCC has `PreemptMode = OFF`, so the only interruption is the known `--time` wall - the reasoning is simpler: checkpoint often enough that the last save is close to the wall, and rely on the `--signal` handler for the final one.

Then two sanity checks, whichever regime you're in:

- **Keep the write under ~5% of runtime.** If a checkpoint takes 30 s, don't write one more often than every ~10 minutes.
- **Time the write, don't assume it.** A large model on a busy parallel filesystem can take far longer than it does on your laptop.

### Retention: don't keep everything, don't keep only one

| Kind | Path | Purpose |
|---|---|---|
| **Rolling** | `consensus_last.pt` | The resume point. Overwritten - atomically. |
| **Best** | `consensus_best.pt` | Saved when the validation metric improves. The artifact you'd publish. |
| **Periodic** | `consensus_epoch_100.pt` | Every N epochs, so you can inspect the trajectory or roll back. |

The workshop keeps only the rolling one, which is the right minimum. Adding "best" is usually the highest-value second checkpoint.

> 🧰 - Only the rolling checkpoint may be overwritten, and it must be written **atomically** (temp file + `os.replace`, as in Lesson 3). A `SIGKILL` during a non-atomic overwrite destroys the *only* resume point you had.

### Requeue hygiene

A few things bite specifically on the *second* run of a requeued job:

- **`#SBATCH --open-mode=append`** - By default a requeued job can truncate its `--output`/`--error` files, erasing the log of everything before the interruption. Append mode keeps the whole history in one file.
- **Cap the restarts** - `SLURM_RESTART_COUNT` guards against a crash-loop that requeues forever ([Lesson 3](./workshop-hpc-l3.md#recover-from-interruptions) shows the check).
- **Make output writes idempotent** - Anything that *appends* to a results file will double up after a resume. Write to a per-attempt path, or truncate-and-rewrite, rather than appending.
- **Checkpoint the whole pipeline stage, not just training** - A dependency chain ([Lesson 4](./workshop-hpc-l4.md)) resumes at whichever stage failed. A stage that can detect its own completed output and skip is effectively checkpointed for free.
- **Job arrays need per-task checkpoint paths** - `ckpt_dir/task_${SLURM_ARRAY_TASK_ID}/last.pt`. Ten array tasks sharing one `last.pt` will corrupt each other's resume point.
- **Write checkpoints to node-local disk, copy the keepers out** - Frequent large writes to `/scratch` are exactly the I/O pattern [Lesson 2](./workshop-hpc-l2.md#data-best-practices) warns about. Keep the rolling checkpoint on `$SLURM_TMPDIR` and `rsync` the ones you want to keep to durable storage.

  > 🧰 - With one exception: node-local disk is wiped when the job ends, so a checkpoint that only ever lives there **cannot be resumed from after a requeue** - the job comes back on a different node. Copy the rolling checkpoint out before the job exits, or keep it on shared storage in the first place.

### Options beyond writing your own

In-code checkpointing (what Lesson 3 built) is the most portable and the most controllable, because your program decides what a consistent state is. It's not the only option:

| Approach | What it does | Worth knowing because |
|---|---|---|
| **Framework built-ins** - [PyTorch Lightning](https://lightning.ai/docs/pytorch/stable/common/checkpointing.html), [submitit](https://github.com/facebookincubator/submitit), DeepSpeed | Handle the save/resume/requeue loop for you, including SLURM signal handling | If you're already using one, don't hand-roll this. Note Lightning claims `SIGUSR1` - which is why the workshop uses `SIGUSR2` |
| **[DMTCP](https://doc.zih.tu-dresden.de/jobs_and_resources/checkpoint_restart/#using-dmtcp-manually)** | Transparent, system-level checkpointing of an *unmodified* process | The escape hatch for code you can't modify (closed-source or legacy simulation binaries). Its GPU/CUDA support is limited, so it's a poor fit for most deep learning |
| **[CRIU](https://docs.nersc.gov/development/checkpoint-restart/containers/)** | Checkpoint/restore in userspace, typically for containers | Same idea as DMTCP at the container level; useful for containerized workloads |
| **Application-level restart files** | Many simulation codes already write their own | Check before building anything - the feature often already exists |

> 🧰 - Transparent checkpointing sounds strictly better than doing it yourself, and it isn't. A whole-process image is large, slow to write, and tied to the machine and library versions it was captured on. A checkpoint you write yourself contains only the state that matters, is a fraction of the size, and can often be loaded on completely different hardware.

---

## 8. Recommendations

Pulling the lesson together - the habits, roughly in order of value per minute spent:

1. **Pin the environment and commit the spec.** Minor-pinned `environment.yml` for daily work, a generated lock file for anything you publish.
2. **Put every knob in a committed config file**, with defaults in code and CLI flags as one-off overrides. A new experiment is a new committed YAML.
3. **Write the resolved config into the run's output directory.** One line, and results stop being anonymous.
4. **Give every run its own output directory** keyed by date or job id, and never overwrite one.
5. **Record what produced the data**, not just the data - a manifest of the rows consumed and hashes of the input files.
6. **Seed everything and record the seed.** Cheap, and it's the difference between "I can rerun this" and "I can't."
7. **Set a tolerance instead of chasing bitwise equality**, and turn that tolerance into an actual test against a stored reference.
8. **Stamp job metadata into results** - job id, git SHA *and* dirty flag, node, GPU, timestamps.
9. **Checkpoint on an interval, at safe boundaries, atomically** - and put the RNG state in the checkpoint if your results need to survive a requeue unchanged.
10. **Layer on tracking tools as the project grows.** Git always; DVC or pointer files for large data; MLflow or W&B once you're comparing runs. The [Model, Data & Code Tracking guide](https://chicago-aiscience.github.io/index-1/) covers the progression.

A useful framing for the whole lesson: **everything above is something you'd otherwise reconstruct from memory.** The work is small and one-time; the alternative is answering "what did I run?" with a guess.

> 🧰 - Want to work through what this looks like for *your* project - which knobs belong in a config, what to hash, where a container is worth it? Happy to hold a follow-up clinic.

## ✅ Verification Checkpoint

- You can name the levels of reproducibility and say which one your work actually needs.
- You know the difference between a pinned `environment.yml` and a generated lock file, and what neither of them captures.
- You can explain the `DEFAULTS < config file < CLI flag` precedence and why `default=None` in `argparse` is what makes it work.
- You added a seed to the workshop config and saw two runs produce identical weights.
- You know why deterministic kernels cost performance, and can state a tolerance for your own results instead.
- You stamped `run_metadata.json` into a run directory and confirmed the `git_dirty` flag catches uncommitted code.
- You can say what belongs in a checkpoint, how often to write one, and why the RNG state matters after a requeue.

# Lesson Conclusion

Reproducibility on a cluster isn't one tool - it's pinning the environment, committing the config, recording the data, seeding the randomness, and stamping the job's own metadata into its results. Each piece is small. Together they're the difference between a results directory that explains itself and one that doesn't.

That also closes the series. You've gone from logging in and submitting a first job, through placing data across cluster storage, monitoring and debugging jobs, and wiring stages into parallel workflows - to runs that survive interruption and can be defended a year later.

Next steps: the [Model, Data & Code Tracking guide](https://chicago-aiscience.github.io/index-1/) goes deeper on DVC, MLflow, and W&B, and the [References](./references.md) page collects the documentation and papers behind each lesson.
