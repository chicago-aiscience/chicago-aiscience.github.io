# %% [markdown]
# # Experiment: <short descriptive title>
#
# **Date:** 2026-04-15
# **Author:** <your name>
# **Notebook file:** `2026-04-15-<topic>.ipynb`
# **Reference codebase:** [chicago-aiscience/workshop-sst](https://github.com/chicago-aiscience/workshop-sst)
#
# ---
#
# ## Question(s)
#
# > State the question this notebook is trying to answer, *before* you start.
# >
# > *Does increasing the number of lag features (3 → 6) improve the Random Forest's
# > ability to predict the Niño 3.4 index from SST?*
#
# ## Summary of conclusions
#
# > Fill this in **after** running the experiments.
# >
# > *Example: On the sample dataset, n_lags=3 and n_lags=6 produced nearly identical
# > test R² (~0.975) — the extra lags neither helped nor hurt meaningfully.*
#
# ## Parameters
#
# | Parameter | Value |
# |---|---|
# | Random seed | 42 |
# | Train/test split | 0.8 / 0.2 (chronological) |
# | Model | `RandomForestRegressor` (sklearn, via `sst.ml`) |
# | Feature column | `sst_c_roll_12` |
# | Target column | `nino34_roll_12` |
# | `n_lags` | 3 (baseline), 6 (variant) |
#
# ## Data
#
# - **Source:** `data/sst_sample.csv`, `data/nino34_sample.csv`
# - **Version / commit:** record the DVC pointer or git commit hash here

# %% [markdown]
# ## Setup
#
# Pin every source of randomness and collect parameters in one place.
# If you change a parameter, change it *here* — don't sprinkle literals
# through the notebook.

# %%
import random
from pathlib import Path

import numpy as np

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

PARAMS = {
    "seed": SEED,
    "test_size": 0.2,
    "feature_col": "sst_c_roll_12",
    "target_col": "nino34_roll_12",
    "n_lags_baseline": 3,
    "n_lags_variant": 6,
    "sst_path": Path("data/sst_sample.csv"),
    "enso_path": Path("data/nino34_sample.csv"),
}
PARAMS

# %% [markdown]
# ## Data

# %%
from sst.io import load_sst, load_enso
from sst.transform import tidy, join_on_month

sst_df = tidy(load_sst(PARAMS["sst_path"]), date_col="date", value_col="sst_c")
enso_df = tidy(load_enso(PARAMS["enso_path"]), date_col="date", value_col="nino34")
joined = join_on_month(sst_df, enso_df)

print(f"Joined shape: {joined.shape}")
print(f"Date range:   {joined['date'].min().date()} → {joined['date'].max().date()}")
joined.head()

# %% [markdown]
# ## Experiment 1 — Baseline (n_lags = 3)
#
# **Hypothesis:** Three months of lag features should capture most of the
# short-term autocorrelation in the Niño 3.4 index. This is the workshop default.

# %%
from sst.ml import predict_enso_from_sst

baseline = predict_enso_from_sst(
    joined,
    target_col=PARAMS["target_col"],
    feature_col=PARAMS["feature_col"],
    test_size=PARAMS["test_size"],
    n_lags=PARAMS["n_lags_baseline"],
    random_state=PARAMS["seed"],
)

print(f"Baseline (n_lags={PARAMS['n_lags_baseline']})")
print(f"  R²:   {baseline['r2_score']:.4f}")
print(f"  RMSE: {baseline['rmse']:.4f}")
print("\nTop features:")
baseline["feature_importance"].head()

# %% [markdown]
# ### What surprised me
#
# > One or two sentences: what worked, what didn't, what you'd try next.

# %% [markdown]
# ## Experiment 2 — More lags (n_lags = 6)
#
# **Hypothesis:** Six months of lags should capture seasonal structure that
# 3 months misses. On a small sample dataset this might overfit instead.

# %%
variant = predict_enso_from_sst(
    joined,
    target_col=PARAMS["target_col"],
    feature_col=PARAMS["feature_col"],
    test_size=PARAMS["test_size"],
    n_lags=PARAMS["n_lags_variant"],
    random_state=PARAMS["seed"],
)

print(f"Variant (n_lags={PARAMS['n_lags_variant']})")
print(f"  R²:   {variant['r2_score']:.4f}")
print(f"  RMSE: {variant['rmse']:.4f}")
print("\nTop features:")
variant["feature_importance"].head()

# %% [markdown]
# ### What surprised me
#
# > One or two sentences: what worked, what didn't, what you'd try next.

# %% [markdown]
# ## Comparison
#
# Print the metrics (searchable) **and** plot predictions vs. actual (scannable).
# Keep both inline — don't write the figure out to `figures/`.

# %%
import matplotlib.pyplot as plt

results = {
    f"Baseline (n_lags={PARAMS['n_lags_baseline']})": baseline,
    f"Variant  (n_lags={PARAMS['n_lags_variant']})": variant,
}

for name, r in results.items():
    print(f"{name}: R²={r['r2_score']:.4f}  RMSE={r['rmse']:.4f}")

fig, axes = plt.subplots(1, 2, figsize=(11, 4), sharey=True)
for ax, (name, r) in zip(axes, results.items()):
    preds = r["predictions"]
    ax.plot(preds["date"], preds["actual"], label="Actual", linewidth=2)
    ax.plot(preds["date"], preds["predicted"], label="Predicted", linestyle="--")
    ax.set_title(f"{name}\nR²={r['r2_score']:.3f}")
    ax.set_xlabel("Date")
    ax.legend()
axes[0].set_ylabel("Niño 3.4 (12-mo rolling)")
fig.autofmt_xdate()
plt.tight_layout()
plt.show()

# %% [markdown]
# ## Conclusions
#
# > Mirror the **Summary of conclusions** at the top, but with more detail.
# > What did you learn? What would you do next? What would you do differently?

# %% [markdown]
# ---
# ## Appendix: new experiments go below this line
#
# Append new experiments as `## Experiment 3 — ...` with the same
# hypothesis → code → "what surprised me" pattern. Don't overwrite cells above.
