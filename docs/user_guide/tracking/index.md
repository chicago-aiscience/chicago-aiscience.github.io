---
title: Model, Data & Code Tracking
---

# Model, Data & Code Tracking

When you train a model, it is worth pausing to ask whether — six months from now — you could answer:

- Which data was used?
- Which version of the code ran?
- What parameters were set?
- Which artifacts were produced?
- Can I reproduce the results?

Without tracking, those answers live in memory, filenames, or convention, and diverge quickly across experiments and collaborators. The pages in this section describe a progressive stack: start with Git, and layer on additional tools as your experiments grow in scope.

## What to track

| Layer | Tool | When |
|---|---|---|
| **Code** | Git / GitHub | Always |
| **Data** | DVC | Files over 100 MB, or data that changes across runs |
| **Models & experiments** | MLflow or Weights & Biases | When you need to compare runs by parameters and metrics |
| **Serving** | Docker on GHCR, HuggingFace | When you want to hand a working model to collaborators or users |

## Pages in this section

- [Git & GitHub](./git-github.md): the baseline every other tool links against.
- [Notebooks](./notebooks.md): notebooks as the first line for experiment tracking.
- [MLflow](./mlflow.md): local experiment tracker with a UI and model registry.
- [Weights & Biases (W&B)](./wandb.md): cloud experiment tracker; good for distributed teams.
- [DVC](./dvc.md): content-hashed versioning for large data and model files.
- [MLflow + DVC](./mlflow-dvc.md): combined workflow for full run reproducibility. The same pattern works with W&B.
- [Model serving](./serving.md): package a trained model behind an HTTP API with Docker and GHCR.

## Decision tree

The fastest way to pick a stack is to walk through the questions below.

```{image} ../../images/tracking-decision-tree.png
```

:::{tip} Lab notebook practice
For one-off exploration, a Jupyter notebook is a perfectly good tracker — record the parameters you tried, the plots, and any surprises inline. Graduate to MLflow or W&B once you start comparing runs or re-running experiments weeks apart.
:::

## Recommendations by use case

| Use case | Recommended stack |
|---|---|
| Solo researcher, local development | Git (commit small models directly) + MLflow |
| Team collaboration, remote members | W&B (+ DVC if data over 100 MB) |
| Strict data lineage across runs | DVC with MLflow or Weights & Biases (W&B) |
| On-premise / no outbound network | MLflow + DVC with a local or shared-storage remote |
| Sharing a model with collaborators | Docker image on [GHCR](./serving.md) |
| Publishing a model publicly | [HuggingFace](./serving.md#other-options) |

## Reference codebase

Every example on these pages comes from [`chicago-aiscience/workshop-sst`](https://github.com/chicago-aiscience/workshop-sst) — a working SST-to-ENSO prediction model with DVC, MLflow, W&B, and a Docker-served prediction API integrated end-to-end.
