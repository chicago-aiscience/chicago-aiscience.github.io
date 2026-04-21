---
title: DVC
---

# DVC

## What it is

DVC (Data Version Control) versions large files — datasets and model artifacts — outside of Git. A small content-hash pointer file (`.dvc`) is committed to the repo, and the actual bytes live in a separate remote: a local path, a shared drive, or a cloud bucket (S3, GCS, Azure).

## Why use it

Git cannot hold files larger than 100 MB. DVC solves this by putting only the pointer in Git while storing the data elsewhere. Because the pointer contains an MD5 of the file's contents, you can verify and restore any previous version exactly — and, just as importantly, you can log that MD5 into an experiment tracker to tie a run to the exact bytes it trained on.

DVC shines in **operational workflows**: you run experiments often, data is actively changing across runs, and you need to know precisely which version produced which model. For stable, one-shot datasets it is usually overkill — Git alone is fine.

## When to use it

- Data or model files exceed GitHub's 100 MB per-file limit.
- You need to know exactly which data produced which model.
- You are running experiments repeatedly against changing datasets.
- You need to share large files with collaborators without requiring individual cloud storage accounts.

## How to use it

### Install

```bash
uv tool install dvc
```

### Initialize inside a Git repository

```bash
dvc init
git commit -m "Initialize DVC"
```

### Track a data file

```bash
dvc add data/sst_sample.csv
# Creates data/sst_sample.csv.dvc and updates .gitignore
git add data/sst_sample.csv.dvc data/.gitignore
git commit -m "Track SST data v1"
```

The `.dvc` pointer committed to Git looks like this:

```yaml
outs:
- md5: d08ae445bfa70901879bfe45ae78de40
  size: 2160
  path: sst_sample.csv
```

### Track a model artifact

```bash
dvc add runs/sst_enso/model.joblib
git add runs/sst_enso/model.joblib.dvc
git commit -m "Version trained model"
dvc push
```

:::{note} What to version, what to skip
Track the model file you actually produce — e.g. `.joblib`. Do **not** track the `.pkl` file that MLflow writes into its own internal model registry; that is MLflow's bookkeeping, not a reproducibility artifact.
:::

### Configure a remote and push

```bash
# Local path (e.g., a shared drive or scratch directory)
dvc remote add -d localremote /path/to/storage

# Or S3
dvc remote add -d s3remote s3://your-bucket/dvc-store

dvc push
```

:::{tip}
Use `--local` when adding a path you do not want committed to the shared config:
`dvc remote add --local -d localremote /private/path`
The `--local` flag writes to `.dvc/config.local`, which is gitignored by default.
:::

### Restore a specific version

```bash
git checkout <commit-hash>
dvc pull
```

`git checkout` moves the `.dvc` pointer files back to that commit's state; `dvc pull` then fetches the bytes they point to from the remote.

### Check status

```bash
dvc status                     # files changed since last dvc add
dvc data status                # detailed view of tracked file states
dvc list . --dvc-only          # list DVC-tracked files; works on a GH URL too
```

The `dvc list` form is handy when a collaborator wants to see what a repo has tracked without cloning:

```bash
dvc list https://github.com/chicago-aiscience/workshop-sst --dvc-only
```

## Pros and cons

| Pros | Cons |
|---|---|
| Exact data and model lineage via content hashes | Adds `dvc add` / `dvc push` / `dvc pull` to every workflow |
| Works with any remote storage backend | Remote must be accessible to all collaborators |
| `.dvc` pointer files integrate naturally with Git | Not needed for stable, small datasets |
| MD5 hashes can be logged to MLflow or W&B for cross-tool linking | — |

## Reference

- [DVC documentation](https://dvc.org/doc)
- [DVC remote storage](https://dvc.org/doc/user-guide/data-management/remote-storage)
- [DVC with Git](https://dvc.org/doc/user-guide/basic-concepts)
- Next: combine DVC with an experiment tracker in [MLflow + DVC](./mlflow-dvc.md).
