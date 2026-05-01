---
title: Jupyter notebooks
---

# Jupyter notebooks as trackers

A Jupyter notebook is a perfectly good experiment tracker for early-stage exploration which can include a handful of model variants, a single dataset, and results that you don't need to track long term. You don't need to start with more advanced experiment tracking like MLflow or Weights & Biases.

## When a notebook is enough

Reach for a notebook (and skip the heavier tools) when:

- You're iterating solo and the audience is mostly future-you.
- The dataset is stable across runs (.e.g., same files, same content, same ordering).
- You're comparing on the order of 5–10 variants, not hundreds.
- You're willing to re-run from scratch if you ever need to reproduce a number.

If two of those stop being true, graduate to [MLflow](./mlflow.md) or [Weights & Biases](./wandb.md).

## What to record inline

Treat the notebook like a lab notebook. Alongside the code, capture the things you'd otherwise forget:

- **Parameters:** every value you varied (learning rate, seed, train/val split, feature set). Put them in a single cell at the top so they're easy to scan.
- **Metrics:** print them, don't just plot them. A printed number is searchable; a plot is not.
- **Plots:** keep them in the notebook output, not saved off to a `figures/` folder you'll lose track of.
- **What surprised you:** a markdown cell after each experiment with one or two sentences on what worked, what didn't, and what you'd try next. This is the part that's hardest to reconstruct later.
- **Record the question.** Record the question(s) you are trying to answer at the top of the notebook. What were you trying to find out?
- **Record a summary of conslusions.** It may also be helpful to place a short conclusion summary at the top of the notebook so you don't have to scroll through the entire notebook to understand the experiment results.

## Practical hygiene

A few habits that make notebooks much more reliable as a record:

- **Commit them to Git.** Use [`nbstripout`](https://github.com/kynan/nbstripout) if cell outputs make `git` diffs noisy, but keep outputs in the committed copy when the plots and printed metrics *are* the record.
- **Restart and run all before you trust a result.** Out-of-order cell execution is the single biggest source of "I can't reproduce my own number from yesterday." Make a habit of restarting the kernel and running top-to-bottom before you record a final number.
- **Name notebooks by date and topic.** `2026-04-15-baseline-vs-augmented.ipynb` ages better than `experiment3-final-v2.ipynb`.
- **Set random seeds explicitly.** `numpy`, `torch`, and any data-shuffling step. Without this, "stable data across runs" stops being true.
- **One question per notebook.** When a notebook starts answering three questions, split it.
- **Chronological append.** New experiments go at the bottom (or in a new notebook). Don't overwrite previous experiments cells so you can track the history of your work.

## Where notebooks fall short

Worth knowing the limits, so you can spot when it's time to switch:

- **Cross-run comparison is manual.** There's no built-in "show me all runs sorted by validation accuracy"; you will need to scroll through notebooks.
- **Kernel state can hide bugs.** A cell that works because of a variable defined three notebooks ago will silently break for anyone else.
- **Sharing is awkward.** A teammate needs the data, the environment, and the notebook but even then, kernel state may differ.
- **Diffs are noisy.** Even with `nbstripout`, reviewing notebook changes in a PR is harder than reviewing a `.py` file.

If you find yourself building scripts to parse metrics out of old notebooks, or copying parameters between notebooks by hand, that's the signal to move to [MLflow](./mlflow.md) (solo / local) or [Weights & Biases](./wandb.md) (team / cloud).

## Starter template

The template below wires in every habit on this page: top-of-notebook question and conclusions block, a single `PARAMS` dict, explicit seeds, "what surprised me" cells, and an append-only structure for new experiments. Copy it into a new `.ipynb` file to get started, or {download}`download the notebook <./experiment-template.ipynb>`.

The example uses the [workshop-sst](https://github.com/chicago-aiscience/workshop-sst) pipeline (`sst.io`, `sst.transform`, `sst.ml`), so run it from a clone of that repo with the `sst` package installed and `data/sst_sample.csv` and `data/nino34_sample.csv` present.

```{literalinclude} ./experiment-template.py
:language: python
```