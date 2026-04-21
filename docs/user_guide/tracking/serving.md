---
title: Model serving
---

# Model serving

## What it is

Once a model is trained and versioned, the last step is putting it somewhere a collaborator or downstream user can actually call it. You have three broad options:

- **Commit the model to Git** if it is small enough — see [Git & GitHub](./git-github.md).
- **Push it through DVC** if it is large — see [DVC](./dvc.md).
- **Package it behind an HTTP API in a Docker container.** That is what this page covers.

The reference implementation is `Dockerfile.serve` in [`chicago-aiscience/workshop-sst`](https://github.com/chicago-aiscience/workshop-sst). It wraps a trained `.joblib` behind a small FastAPI app with `/health`, `/model-info`, and `/predict` endpoints.

## Why use it

A container is the most portable handoff format: anyone with Docker can pull the image and get a working prediction endpoint, with no Python environment, no dependency install, no "does it work on my machine" step. Publishing to [GitHub Container Registry (GHCR)](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) ties the image to the repository and makes it `docker pull`-able by any collaborator with access.

## When to use it

- Collaborators need to run predictions without setting up the full training environment.
- You want a stable, versioned prediction endpoint — either locally, on a cluster, or deployed.
- You want to swap models behind the same API surface (e.g. compare two trained models without rewriting the client).

## How to use it

### Build and run locally

From the project root:

```bash
# Build
docker build -f Dockerfile.serve -t workshop-sst-serve:local .

# Run
docker run -p 8000:8000 workshop-sst-serve:local
```

### Exercise the API

```bash
# Health
curl http://localhost:8000/health

# Model metadata (version, training run, etc.)
curl http://localhost:8000/model-info

# Predict
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"instances": [[0.5, 0.3, 0.2, 0.1, 0.4, 0.3, 0.2]]}'
```

### Pull and run from GHCR

Once the image is published to GHCR, any collaborator can skip the build step:

```bash
docker pull ghcr.io/chicago-aiscience/workshop-sst-serve:latest
docker run -p 8000:8000 ghcr.io/chicago-aiscience/workshop-sst-serve:latest
```

### Swap in a different model without rebuilding

The container reads the model from `/app/model/model.joblib`. Mount your own file over that path and the same image now serves a different model:

```bash
docker run -p 8000:8000 \
  -v /path/to/model.joblib:/app/model/model.joblib:ro \
  ghcr.io/chicago-aiscience/workshop-sst-serve:latest
```

That makes the image a reusable serving shell — one container, any number of models. Pair it with DVC to pull a specific model version by hash, then mount it into the running container.

## Other options

- **HuggingFace** is the right home for models you want to open-source publicly. It gives you hosted inference, a model card, and a familiar download pattern (`huggingface_hub.snapshot_download`). Prefer it over GHCR when the audience is "the public" rather than "a named set of collaborators."
- **A GitHub Release** with the `.joblib` attached is the lightest option when the model is small and the user is willing to bring their own runtime — see [Git & GitHub](./git-github.md#use-github-releases-for-model-snapshots).

## Pros and cons

| Pros | Cons |
|---|---|
| Single-command handoff: `docker run` and you have a prediction API | Consumers need Docker installed |
| Image is self-contained — no Python environment to manage | Container images can be large (hundreds of MB) |
| Mount-based model swap enables one-image-many-models serving | Building and publishing adds a CI step |
| GHCR integrates cleanly with GitHub access control | Private images require authentication to pull |

## Reference

- [Dockerfile documentation](https://docs.docker.com/reference/dockerfile/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [HuggingFace Hub](https://huggingface.co/docs/hub/index)
- [`workshop-sst` Dockerfile.serve](https://github.com/chicago-aiscience/workshop-sst/blob/main/Dockerfile.serve)
