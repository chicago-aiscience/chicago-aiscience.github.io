---
title: Git & GitHub
---

# Git & GitHub

## What it is

Git tracks code changes as a series of commits. GitHub stores the repository remotely and adds collaboration features: pull requests, issues, Actions, and access control. For small data files and model artifacts (under 100 MB per file), Git can also serve as the versioning layer end-to-end — no extra tooling required.

## Why use it

Every experiment is ultimately anchored to a git commit. That commit hash is the linking key the rest of this stack relies on: MLflow logs it as a tag, W&B stores it in run config, and DVC pointer files only make sense in the context of the commit they were frozen in. Without a clean commit history, the other tools on these pages have nothing reliable to point at.

## When to use it

- Always — this is the baseline every other tool builds on.
- As the *sole* tracking mechanism when your data and model files stay under [GitHub's 100 MB per-file limit](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
- When you need a tagged, stable experiment state that collaborators can check out directly.

## How to use it

### Tag a commit with an experiment label

```bash
git tag experiment-baseline
git push origin experiment-baseline
```

### Capture the commit SHA in your training script

Log the commit into your run record so the tracker and the code are linked:

```python
import subprocess

git_commit = subprocess.check_output(
    ["git", "rev-parse", "HEAD"], text=True
).strip()
git_branch = subprocess.check_output(
    ["git", "rev-parse", "--abbrev-ref", "HEAD"], text=True
).strip()
```

This is the pattern used in `workshop-sst/scripts/train_sst_mlflow.py` and `train_sst_wandb.py` — both log `git_commit` and `git_branch` as run tags so you can jump from the tracker UI back to the exact code.

### Commit small models directly

If a trained model file is well under 100 MB, committing it straight to the repo is the simplest possible way to share it with collaborators — no registry, no remote, no extra tooling. Once the file grows past that limit, move it to [DVC](./dvc.md).

### Keep large files and secrets out of the repo

Add these to `.gitignore`:

```
# Large binary files
*.joblib
*.pkl
*.pt
*.h5
data/*.csv

# Experiment outputs
runs/
wandb/
mlruns/

# Secrets
.env
*.key
```

### Commit pointer files for anything that cannot live in Git

When a file is too large for Git but you do not want the overhead of DVC, a plain YAML **pointer file** is a good middle ground. The pointer is tiny, commits cleanly, and carries everything someone needs to fetch the real asset and verify they got the right bytes:

- a `path` — where the asset belongs in the repo
- an `md5` (or `sha256`) — for integrity checking after download
- a `source` URL — often a GitHub Release asset, an S3 object, or a Zenodo DOI
- a `git_commit` — the commit that produced or froze the asset
- free-form fields (`description`, `config`, `metrics`, etc.) for context

Because the pointer is committed, checking out any past commit gives you an exact, verifiable recipe for reconstructing that experiment's inputs and outputs — without a DVC remote or LFS account.

#### Example: data pointer

Naming convention: `<asset>.pointer.yaml` next to where the asset belongs.

```yaml
# data/nino34_sample.csv.pointer.yaml
path: data/nino34_sample.csv
md5: af5118ccfd637b0b90349921e7146663
size: 2095
source: https://github.com/chicago-aiscience/workshop-sst/releases/download/v0.6.2/nino34_sample.csv
description: Monthly-mean Nino 3.4 index observations, ENSO indicator sample (2000-2023).
git_commit: 72bca4468f63daf10834181fca7599d134523857
```

#### Example: model pointer

```yaml
# runs/sst_enso/model.joblib.pointer.yaml
path: runs/sst_enso/model.joblib
md5: 9f1c3d2e4a5b6c7d8e9f0a1b2c3d4e5f
size: 482113
source: https://github.com/chicago-aiscience/workshop-sst/releases/download/v0.6.2/model.joblib
description: Random forest SST-ENSO predictor trained on nino34_sample v0.6.2.
git_commit: 72bca4468f63daf10834181fca7599d134523857
trained_from:
  data: data/nino34_sample.csv.pointer.yaml
  config: configs/train_baseline.yaml
metrics:
  r2: 0.81
  rmse: 0.42
```

The `trained_from` block links the model back to the specific data and config pointers it was trained against — so one commit can anchor the whole chain.

#### Example: config pointer

Training configs are small enough to commit directly, but a pointer is useful when the config lives in another repo or an experiment-management system:

```yaml
# configs/train_baseline.yaml.pointer.yaml
path: configs/train_baseline.yaml
md5: 1a2b3c4d5e6f7890abcdef1234567890
size: 612
source: https://github.com/chicago-aiscience/workshop-sst/releases/download/v0.6.2/train_baseline.yaml
description: Baseline training config — 12 lags, 20% test split, seed 42.
git_commit: 72bca4468f63daf10834181fca7599d134523857
```

#### Example: generic artifact pointer (figures, tables, reports)

The same pattern works for any output you want to version without checking in the binary:

```yaml
# reports/figures/skill_vs_lead.png.pointer.yaml
path: reports/figures/skill_vs_lead.png
md5: abcdef0123456789abcdef0123456789
size: 184220
source: https://github.com/chicago-aiscience/workshop-sst/releases/download/v0.6.2/skill_vs_lead.png
description: Skill-vs-lead-time figure for the baseline model.
git_commit: 72bca4468f63daf10834181fca7599d134523857
generated_by: scripts/plot_skill.py
```

#### Fetching from a pointer

A short helper reads the pointer, downloads the asset, and verifies the MD5 before letting anything else use it. `workshop-sst/scripts/fetch_from_pointer.py` is a working reference:

```bash
python scripts/fetch_from_pointer.py data/nino34_sample.csv.pointer.yaml
python scripts/fetch_from_pointer.py runs/sst_enso/model.joblib.pointer.yaml --out-dir /tmp/models
```

The script skips the download when the file is already present and its hash matches, and aborts on mismatch — so it is safe to call every time a training script starts.

:::{tip} When to prefer pointer files over DVC
Pointer files are ideal when your assets have a stable public or shared URL (GitHub Releases, Zenodo, an S3 bucket you already maintain). DVC is the better fit when assets change frequently and you want automatic hashing on every `dvc add`. Both approaches give you the same reproducibility guarantee; pointers trade automation for simplicity.
:::

### Use GitHub releases for model snapshots

When a model is stable enough to share, attach the artifact to a GitHub release:

```bash
gh release create v1.0.0 model.joblib \
  --title "Model v1.0.0" \
  --notes "Baseline SST-ENSO model"
```

Collaborators can then download a specific version without needing DVC configured locally.

## Pros and cons

| Pros | Cons |
|---|---|
| No setup — already in use | 100 MB per-file limit |
| Full code history for free | No metric comparison UI |
| Universally understood workflow | Large binary history bloats the repo permanently |
| Commit SHA is the universal linking key for every other tool | No artifact storage beyond raw file blobs |

## Reference

- [Git documentation](https://git-scm.com/doc)
- [GitHub documentation](https://docs.github.com)
- [GitHub file size limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- Next in this section: [DVC](./dvc.md) for large files, or [MLflow](./mlflow.md) / [W&B](./wandb.md) for experiment comparison.
