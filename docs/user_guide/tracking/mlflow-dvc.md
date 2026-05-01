---
title: MLflow + DVC
---

# MLflow + DVC

## What it is

Three tools, three roles, one anchor:

- **DVC** versions the large binary files; the data going in and the model coming out.
- **MLflow** tracks what happened inside the training run: parameters, metrics, artifacts.
- **Git** ties them together. Every run is pinned to a commit that holds both the code and the `.dvc` pointer files for the data and model at that point in time.

The same pattern works with W&B as the tracker; nothing here is MLflow-specific except the client commands for reading the run back.

## Why use it

Neither tool on its own gives full reproducibility. MLflow records what happened in a run but not which exact bytes of data fed it. DVC versions the files but has no concept of a training run.

Together with the git commit as the linking key. Every experiment becomes reproducible: from a commit, you can restore the data, restore the model, and pull up the full run record.

If you run experiments often, swap datasets between runs, or need to come back months later and re-run exactly what produced a given number, you want both tools on.

## When to use it

- Data changes across experiments and you need to track which version produced which result.
- You need to reproduce a past result from weeks or months ago.
- You run experiments repeatedly in an operational or iterative workflow.

## What each tool tracks

| | DVC | MLflow |
|---|---|---|
| Input data | `.dvc` pointer (MD5 hash) | `dvc_data_md5` tag |
| Hyperparameters | — | logged per run |
| Metrics | — | logged per run, comparable across runs |
| Output model | `.dvc` pointer (MD5 hash) | `dvc_model_md5` tag + Model Registry |
| Plots / predictions | — | stored as artifacts |

The MD5 hashes logged to MLflow are what make reproduction possible — given any past run, you can look up the exact data and model that produced it.

## One-time setup

```bash
# Configure a DVC remote
dvc remote add -d myremote /path/to/shared/storage   # or s3://bucket/path

# Auto-stage .dvc files after dvc add
dvc config core.autostage true

git commit -m "Configure DVC remote"
```

## Workflow per experiment

```bash
# 1. Update your data if needed and version it
dvc add data/sst_sample.csv
git commit -m "Update SST training data v2"
dvc push                  # upload the new bytes to the remote

# 2. Train — MLflow records params, metrics, and the DVC hashes
python scripts/train_sst_mlflow.py --run-name "experiment_v2"

# 3. Version the produced model
dvc add runs/sst_enso/model.joblib
git commit -m "Train model on SST v2 data"
dvc push
```

The final git commit is the single snapshot that captures the code, the data pointer, and the model pointer for this experiment. The training script records that commit SHA as an MLflow tag (`workshop-sst/scripts/train_sst_mlflow.py:167`), so the MLflow UI shows exactly which commit produced each run.

[Train SST MLflow script link](https://github.com/chicago-aiscience/workshop-sst/blob/main/scripts/train_sst_mlflow.py)

## Reproducing a past experiment

### 1. Retrieve the DVC hashes from the MLflow run

```python
from mlflow.tracking import MlflowClient

client = MlflowClient(tracking_uri="file:runs/sst_enso/mlruns")

runs = client.search_runs(
    experiment_ids=["955874916381101783"],
    filter_string="tags.mlflow.runName = 'experiment_v2'",
)
run = runs[0]

data_md5 = run.data.tags["dvc_data_md5"]
model_md5 = run.data.tags["dvc_model_md5"]
print(data_md5, model_md5)
```

### 2. Restore the files from those hashes

DVC's cache lives at `.dvc/cache/files/md5/XX/YYY…`, where `XX` is the first two characters of the MD5 and `YYY…` is the rest. Point each `.dvc` pointer back at the historical hash and let `dvc checkout` pull the corresponding bytes out of cache:

```python
import subprocess
import yaml
from pathlib import Path

def restore_dvc_file(md5: str, dvc_pointer_path: Path) -> None:
    """Update a .dvc pointer to a specific hash and restore the file."""
    with open(dvc_pointer_path) as f:
        dvc_info = yaml.safe_load(f)
    dvc_info["outs"][0]["md5"] = md5
    with open(dvc_pointer_path, "w") as f:
        yaml.dump(dvc_info, f)
    subprocess.run(["dvc", "checkout", str(dvc_pointer_path)], check=True)

restore_dvc_file(data_md5, Path("data/sst_sample.csv.dvc"))
restore_dvc_file(model_md5, Path("runs/sst_enso/model.joblib.dvc"))
```

### 3. Fetch from the remote if the cache is cold

If the bytes for a hash are not in the local cache, pull them from the DVC remote first:

```bash
dvc fetch data/sst_sample.csv.dvc
dvc fetch runs/sst_enso/model.joblib.dvc
# or
dvc pull data/sst_sample.csv.dvc
dvc pull runs/sst_enso/model.joblib.dvc
```

:::{tip} Do it on a branch
`restore_dvc_file` rewrites the `.dvc` pointer on disk. If you only want to inspect an old run — not move HEAD back to it — work on a throwaway branch so your main pointers are not disturbed:

```bash
git checkout -b reproduce/experiment_v2
# run the restore script here
```
:::

## Swapping in W&B

Everything above applies with W&B as the tracker: log the DVC MD5s as `wandb.config` entries (the `workshop-sst` W&B script already does), and the reproduction flow is identical — fetch the hashes from the run via `wandb.Api().run(...)` instead of `MlflowClient`, then pass them through the same `restore_dvc_file` helper.

[Link to script](https://github.com/chicago-aiscience/workshop-sst/blob/main/scripts/train_sst_wandb.py)

## Pros and cons

| Pros | Cons |
|---|---|
| Full data and model lineage per run | Most steps per workflow of any option in this section |
| Every run is reproducible from a git commit | DVC remote must be accessible to all collaborators |
| MD5 hashes link tracker runs to exact file versions | Overkill for stable datasets or one-off experiments |
| Same pattern works with MLflow or W&B | — |

## Reference

- [MLflow documentation](https://mlflow.org/docs/latest/index.html)
- [DVC documentation](https://dvc.org/doc)
- [`workshop-sst` reference implementation](https://github.com/chicago-aiscience/workshop-sst)
- Once you have a model you trust, hand it to users with [model serving](./serving.md).
