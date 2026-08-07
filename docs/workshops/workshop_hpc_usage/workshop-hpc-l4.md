# Lesson 4: Building Workflows

## Objectives

Turn a multi-step pipeline into parallel job arrays chained by SLURM dependencies.

- **Batch vs. interactive** - Review which kind of job each stage of a workflow should use.
- **Workflows and pipelines** - Common workflows and data pipelines, including the types of parallel jobs (and where AI fits in).
- **Job arrays** - Parallelize independent work across array tasks.
- **Job dependencies** - Manage multi-stage workflows so Slurm releases each stage in order.
- **Recommendations** - Habits that make workflows easier to build, parallelize, and reproduce.

---

## 1. Batch vs. interactive jobs (a quick reminder)

Back in [Lesson 1](./workshop-hpc-l1.md#slurm-jobs) we introduced the two ways to run work on the cluster. Now that we are building *workflows* (several jobs wired together) it's worth being deliberate about which one each stage should use.

| | **Interactive** (`srun --pty`) | **Batch** (`sbatch`) |
|---|---|---|
| How you start it | Drops you into a shell on a compute node | Submits a script to the queue and returns |
| You have to stay logged in | Yes - the session ends when you disconnect | No - it runs unattended |
| Best for | Developing, debugging, short experiments, smoke tests | Production runs, long jobs, anything parallel |
| Scales to many jobs? | No | Yes - this is where job arrays and dependencies live |

The pattern we lean on for the rest of this lesson: **develop and smoke-test a single step interactively, then submit the real thing as a batch job.** Once you have several batch stages, wire them together into a workflow.

> 🧰 - A good habit before committing a big batch run: prove the wiring works on a small slice on an interactive node (e.g. `--basins 232270 --epochs 1`), exactly as we did in [Lesson 1.7](./workshop-hpc-l1.md#running-interactive-job).

---

## 2. Common workflows and data pipelines

Before reaching for parallelism, it helps to understand the *shape* of your work. Most scientific pipelines break down into three kinds of stage (**input**, **processing**, and **output**) and a good first move is to keep them modular:

- **Modularize the stages** - Keep reading input, processing, and writing output as separate stages. Then you can change *how* data is read or written without touching the science in the middle.
- **Map the data flow first** - Understand your job type and data flow **before** deciding how (or whether) to parallelize. Map out which stages are sequential and which are independent.
- **Expose a chunk argument** - To parallelize, you often add a thin wrapper so a stage can run on one file or one chunk of the input (e.g. an `--index` or `--input-file` argument). That is exactly what a job array needs (§3).

### Types of parallel jobs

There is more than one kind of parallelism, and picking the right one depends on how your tasks need to talk to each other.

| Strategy | What it is | Slurm knobs | When to use it |
|---|---|---|---|
| **Embarrassingly parallel** | Fully independent tasks that never need to communicate | `--array` (job arrays) | Same algorithm over many files/chunks, or a parameter sweep |
| **Shared-memory** (multiprocessing / OpenMP) | Multiple threads/processes sharing one machine's memory | `--cpus-per-task=N`, `--mem` (single node) | Python `multiprocessing`, R `parallel`, OpenMP codes |
| **Message passing** (MPI) | Processes that communicate, possibly across nodes | `--ntasks=N`, `--nodes=N` + `srun`/`mpirun` | Tightly-coupled simulations that span nodes |
| **GPU computing** | Thousands of GPU cores handle the parallelism internally | `--gres=gpu:N` | Matrix/vector-heavy numerical work, deep learning |

A few notes:

- **Embarrassingly parallel** - Ideal for job arrays, as each task is a duplicate of the same script run with a different input or parameter. This is what we focus on in §3.
- **Shared-memory** - Parallelism (e.g. Python's `multiprocessing`, R's `parallel`) that communicates through memory, so **all work must stay on a single node**; request cores with `--cpus-per-task`.
- **MPI** - Passes data between processes that may live on different nodes. It requires careful code authoring and is beyond this lesson; flag it if you'd like a more advanced session.
- **GPU computing** - Feels like parallelism the GPU largely optimizes for you, but you still control what lives in host (CPU) memory (`--mem`) vs. device (GPU) memory, and where your data is placed. Most ML libraries handle the kernels for you. (See [Lesson 3](./workshop-hpc-l3.md#srun) for monitoring GPU usage with `nvidia-smi`.)

### Will parallelizing even help?

Referenced in [University of Sheffield HPC Documentation](https://docs.hpc.shef.ac.uk/en/latest/parallel/index.html#gsc.tab=0):

Parallelism takes thought and time to implement, so it's worth asking whether you'll actually see a speedup:

- **[Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law)** - For a *fixed* problem size, your maximum speedup is capped by the part of the program that must run serially. If 10% of your runtime is inherently sequential, no amount of parallelism gets you past that sequential processing.
- **[Gustafson's law](https://en.wikipedia.org/wiki/Gustafson%27s_law)** - If your problem *grows* with the resources available, larger problems benefit more from parallelization.

The practical takeaway: parallelize the part that dominates your runtime and is genuinely independent, and don't expect parallelism to optimize a workload that is mostly serial.

### Workload characteristics

Another useful lens ([from AWS's write-up on workload-aware computing](https://aws.amazon.com/blogs/hpc/a-scientific-approach-to-workload-aware-computing-on-aws/)) is how tightly your tasks are coupled:

- **Tightly-coupled** - Heavy process-to-process communication (classic MPI simulations).
- **Loosely-coupled** - Minimal communication between processes (a great fit for job arrays).
- **Mixed** - For example, a compute-heavy simulation followed by a separate analysis stage.
- **Variable** - The scale of the work changes over the run.

### Common pipeline shapes

In practice most workflows are some combination of:

- **Embarrassingly parallel chunks** - Split the input spatially or temporally and process each piece independently.
- **Multi-stage pipelines** - A mix of parallel stages and sequential stages (this is our workshop example - see §4).
- **Sequential execution** - Stages that must run in order because of a tight dependency, or because the data isn't parallelizable.
- **Data aggregation** - Many parallel chunks feeding successively larger roll-ups.
- **Distributed across nodes** - Work spread across multiple machines.

### Where AI fits in (HPC + AI)

Increasingly, workflows fold an AI model *into* the pipeline - for prediction, for steering a simulation, or for analysis. [Recent surveys](https://arxiv.org/html/2406.14315v2) describe three patterns of integration:

- **AI-in-HPC** - An AI model *replaces* a component (or the whole) of a traditional simulation.
- **AI-out-HPC** - An AI system sits outside the simulation loop but *steers* it, deciding what to run next.
- **AI-about-HPC** - AI runs concurrently and coupled to the main tasks: analysis/training codes consume simulation output to produce further insights.

These show up as recurring **execution motifs** - dynamic orchestration, multistage pipelines, inverse design, digital replicas, distributed models, adaptive training - each with its own interaction and coupling patterns.

> 🧰 - Our workshop pipeline is itself a small AI-coupled, multistage workflow: train the consensus model, run prediction to produce per-reach discharge, aggregate the results, then benchmark against the gauge (observation).
>
> The trained model is a stage *inside* the data pipeline - an **AI-in-HPC** pattern, where the learned model stands in for a component of the traditional consensus calculation.

The main challenges when coupling AI and HPC are worth keeping in mind: the two halves are often written in different languages, dynamic insight from an AI model has to feed back into an otherwise static workflow, and data-transfer patterns between stages can dominate performance.

---

## 3. Parallelizing with job arrays

A **job array** submits many copies of the *same* batch script from a single submission - each copy is a **task**, and each task gets a unique index.

It's the Slurm-native way to run embarrassingly parallel work: the same algorithm over different input files, different chunks of data, or different parameters.

You turn a batch script into an array with one line:

```bash
#SBATCH --array=0-4        # launch 5 tasks, indexed 0,1,2,3,4
```

Each task runs the whole script, but with a different value of `$SLURM_ARRAY_TASK_ID`.

You use that index to pick *this* task's input or parameters → index into a file, locate a numbered input, or read a row from a config file.

### The variables Slurm gives each task

| Variable | Filename token | Meaning |
|---|---|---|
| `$SLURM_ARRAY_JOB_ID` | `%A` | The **parent** job id, shared by every task |
| `$SLURM_ARRAY_TASK_ID` | `%a` | This task's index (the value from `--array`) |
| `$SLURM_ARRAY_TASK_COUNT` | | Total number of tasks in the array |
| `$SLURM_ARRAY_TASK_MIN` / `MAX` | | Lowest / highest index in the array |

When you submit an array you get back the parent id (`$SLURM_ARRAY_JOB_ID`); each task is then identified as `<parent>_<taskid>`. Use `%A` and `%a` in your log paths so tasks don't overwrite each other's output:

```bash
#SBATCH --output=logs/sweep_%A_%a.out    # e.g. logs/sweep_51500000_3.out
#SBATCH --error=logs/sweep_%A_%a.err
```

### Throttling concurrency

An array can launch a *lot* of jobs at once. Cap how many run simultaneously with `%`:

```bash
#SBATCH --array=0-99%10    # 100 tasks, but at most 10 running at a time
```

This matters because hundreds of tasks hitting the file system - or a shared conda environment (thousands of small files) - at the same instant can overwhelm shared storage. Before firing off a big array:

- **Know your data footprint** - Understand how much input and output data each task touches.
- **Know your storage limits** - Understand your storage's parallel-read capacity (see [Lesson 2](./workshop-hpc-l2.md#data-best-practices) on organizing data and the many-small-files problem).
- **Use unique output paths** - Make sure each task writes to a **unique** output path so tasks never clobber each other.

> 🧰 - Aim for array tasks that each run for **at least ~30 minutes**. Anything much shorter and per-task scheduling overhead starts to dominate the runtime.
>
> If your tasks are tiny, process the input in **chunks** so each task does more work, or loop over several items sequentially inside one task.

### Running example: a parameter sweep

A natural job-array use case is a **hyperparameter sweep** where you run the same training step several times with different settings and compare.

The runs are fully independent, and the task index selects which parameter combination to use.

The pattern below is illustrative - the repo ships the *prediction* array as its concrete example; you can adapt this sweep for tuning.

A clean way to do it is to keep the parameter grid in a file and let each task read its own row. Create `config/sweep.csv`:

```text
lr,batch_size
1e-3,4
1e-4,4
1e-4,8
5e-5,8
```

Then the array script reads the row matching `$SLURM_ARRAY_TASK_ID`:

```bash
#!/usr/bin/env bash
#
# ...The usual SBATCH arguments...
#
#SBATCH --output=logs/sweep_%A_%a.out    # %A = parent id, %a = task id
#SBATCH --error=logs/sweep_%A_%a.err

# ...Module set up...

# Pick THIS task's row from the sweep grid.
# +2 skips the header line and converts the 0-based task id to sed's 1-based line number.
CONFIG=config/sweep.csv
line=$(sed -n "$((SLURM_ARRAY_TASK_ID + 2))p" "$CONFIG")  # SLURM_ARRAY_TASK_ID indexes into configuration data
lr=$(echo "$line" | cut -d, -f1)
bs=$(echo "$line" | cut -d, -f2)

# Each task writes to its OWN output directory, keyed by task id + params.
out="$WORK_DIR/runs/sweep/task_${SLURM_ARRAY_TASK_ID}_lr${lr}_bs${bs}"

echo "[task $SLURM_ARRAY_TASK_ID] lr=$lr batch_size=$bs -> $out"

python src/train_consensus.py \
    --config "$EXPERIMENT_CONFIG" \
    --manifest "$WORK_DIR/data/manifest_train.csv" \
    --out "$out" \
    --lr "$lr" --batch-size "$bs"
```

What makes this work as an array:

- **`--array=0-3`** - Launches one task per row of the sweep grid; `%2` keeps at most two GPUs busy at once.
- **`$SLURM_ARRAY_TASK_ID`** - Selects the row, so **one script** covers the whole sweep.
- **Unique output directories** - Each task's `out` directory is unique, so the four runs never overwrite each other and you can compare them afterward.

> 🧰 - This assumes your training script accepts the parameters you're sweeping (here, an `--lr` flag).
>
> Wiring a hyperparameter through to your own code is the small "wrapper" work mentioned in §2 - expose the knob as a CLI argument, then the array just varies it.

The same mechanism handles the other classic array patterns, too:

- **One task per input file** - Index a list of files by `$SLURM_ARRAY_TASK_ID`.
- **Case-based selection** - Use a `bash` `case` statement, or read a config file as we did above.
- **Data-parallel sharding** - In our workshop pipeline, the prediction stage ([`slurm/04_predict_array.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/04_predict_array.sbatch)) uses an array this way as it fans discharge prediction out across shards of the reaches, with each task processing its own slice.

### 👉 Try it: submit the prediction array

The workshop's concrete data-parallel array is the prediction stage. It needs a trained model first (from Lesson 1's `02_train.sbatch`), then fans prediction across the reaches:

```bash
cd $HOME/workshop-hpc-2026-sep
mkdir -p logs
sbatch slurm/04_predict_array.sbatch     # -> Submitted batch job 51500000
```

Watch all ten tasks (they share the parent id, with `_0`..`_9` suffixes):

```bash
squeue -u $USER                          # tasks show as 51500000_0, _1, ...
```

_Output:_

```bash
             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)
           1329780   general     bash ntebaldi  R      32:20      1 g002
         1329834_0   general consensu ntebaldi  R       0:03      1 g006
         1329834_1   general consensu ntebaldi  R       0:03      1 h002
         1329834_2   general consensu ntebaldi  R       0:03      1 h002
         1329834_3   general consensu ntebaldi  R       0:03      1 h002
         1329834_4   general consensu ntebaldi  R       0:03      1 p001
         1329834_5   general consensu ntebaldi  R       0:03      1 p001
         1329834_6   general consensu ntebaldi  R       0:03      1 p001
         1329834_7   general consensu ntebaldi  R       0:03      1 i001-ds
         1329834_8   general consensu ntebaldi  R       0:03      1 j005-ds
         1329834_9   general consensu ntebaldi  R       0:03      1 j005-ds
```

When they finish, each task's shard sits in `runs/predictions/predictions_XXX.csv`, ready to aggregate.

> 🧰 - Cancel a single task with `scancel 1329780_2`, or the whole array with `scancel 1329780`.

---

## 4. Managing job dependencies and multi-stage workflows

Real pipelines have stages that must run **in order**: preprocess → train → infer → analyze.

Rather than babysitting the queue - waiting for one job to finish before submitting the next - or writing a script that polls job states, you can submit everything at once and let Slurm release each stage when its prerequisites are met.

That's what **job dependencies** are for.

You express a dependency with `--dependency` (or `-d`):

```bash
sbatch --dependency=<type>:<job_id> next_stage.sbatch
```

### Dependency types

| Type | The dependent job starts… |
|---|---|
| `after` | after the listed job(s) **start** |
| `afterok` | only after the listed job **succeeds** (exit code 0) |
| `afternotok` | only if the listed job **fails** |
| `afterany` | after the listed job **finishes**, regardless of exit status |
| `singleton` | after all previous jobs with the **same name and user** have ended |

`afterok` is the workhorse - it builds a chain that stops if any stage fails, so you never run analysis on a training job that crashed.

> 🧰 - `singleton` is handy for cleanup or "only one at a time" stages - e.g. a final job that moves results out of node-local/scratch storage after everything else with that name has ended.

### A simple chain

Capture each job's id with `--parsable` and feed it to the next stage:

```bash
preprocess=$(sbatch --parsable preprocess.sbatch)

train=$(sbatch --parsable --dependency=afterok:$preprocess train.sbatch)

sbatch --dependency=afterok:$train evaluate.sbatch
```

You submit all three immediately:

- **Slurm gates each stage** - It holds `train` until `preprocess` succeeds, and `evaluate` until `train` succeeds.
- **Waiting stages show why** - The later stages sit in `PD` with reason `Dependency` - see the [pending-job reasons table in Lesson 3](./workshop-hpc-l3.md#failed-jobs) for `Dependency` vs. `DependencyNeverSatisfied`.

> 🧰 If an upstream job fails, its `afterok` dependents will **never** run and show the reason `DependencyNeverSatisfied`.
>
> They won't clear on their own - cancel them with `scancel`, fix the upstream job, and resubmit.

### The workshop pipeline

Our example is a three-stage workflow that mixes a sequential stage, a parallel array, and a final sequential stage:

```{mermaid}
flowchart LR
    T["<b>Train</b><br/>single GPU job<br/>02_train.sbatch"] -->|afterok| P["<b>Predict</b><br/>job array (fans across reaches)<br/>04_predict_array.sbatch"]
    P -->|afterok| A["<b>Aggregate + Benchmark</b><br/>single job<br/>05_aggregate_dep.sbatch"]
```

1. **Train** - Train the consensus model as a single GPU job: [`slurm/02_train.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/02_train.sbatch).
2. **Predict** - Estimate discharge for all reaches, fanned out as a **job array**: [`slurm/04_predict_array.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/04_predict_array.sbatch).
3. **Aggregate + benchmark** - Gather the per-shard predictions, score against the gauge, and plot: [`slurm/05_aggregate_dep.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/05_aggregate_dep.sbatch).

Each stage depends on the one before it:

- Prediction should start **only if** training succeeds.
- Aggregate/benchmark should start **only if** every prediction array task succeeds.

An `afterok` dependency handles both - and when the dependency is on an *array* job, Slurm waits for **all** of its tasks to succeed.

### 👉 Try it: submit the whole workflow at once

Copying job ids between three `sbatch` calls by hand gets old quickly, so the repo ships a launcher that does it for you: [`slurm/05_run_workflow.sh`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/05_run_workflow.sh).

```bash
cd $HOME/workshop-hpc-2026-sep
bash slurm/05_run_workflow.sh
```

_Output:_

```bash
stage 1  train      -> job 51500440
stage 2  predict    -> job 51500441  (held until 51500440 succeeds)
stage 3  aggregate  -> job 51500442  (held until 51500441 succeeds)

watch:  squeue -u $USER
cancel: scancel 51500440 51500441 51500442
```

> 🧰 - **This script is safe to run on the login node**, unlike the work it launches.
>
> Everything else in this series runs through `sbatch` or `srun` precisely to keep computation off the login nodes.
>
> This script is the exception because it *does no computation*: it calls `sbatch` three times and exits in well under a second. The training, prediction, and aggregation all run on compute nodes under Slurm's control.
>
> That is the general rule for login nodes - submitting, querying, and editing are fine; anything that actually consumes CPU, GPU, or memory is not.

**What the script does.** Three `sbatch` calls, each feeding its job id to the next stage:

```bash
train_id=$(sbatch --parsable slurm/02_train.sbatch)                                       # stage 1

predict_id=$(sbatch --parsable --dependency=afterok:$train_id slurm/04_predict_array.sbatch)   # stage 2 (array)

sbatch --parsable --dependency=afterok:$predict_id slurm/05_aggregate_dep.sbatch          # stage 3
```

Plus two pieces of housekeeping that are easy to forget when you type the commands yourself:

- **It submits from the repository root.** `sbatch` records the directory you submit from as the job's working directory.
- Every `--output` path and `source config/paths.sh` line in those scripts is relative to that root. The script resolves the root from its own location, so it works from anywhere.
- **It creates `logs/` first.** Slurm rejects a submission outright if the `--output` directory doesn't exist.

You submit all three in one go; Slurm releases them in order. Watch the chain with:

```bash
squeue -u $USER
```

You'll see stage 1 running while stages 2 and 3 sit in `PD` with reason `Dependency`. As each stage succeeds, the next is released. The final results land in `$WORK_DIR/runs/` - the scored `scored.csv` and the figures under `runs/eval/`.

> 🧰 - `--parsable` makes `sbatch` print just the numeric job id (instead of "Submitted batch job 12345"), so you can capture it into a shell variable and pass it straight to the next `--dependency`.
>
> This is also why the script can print a ready-made `scancel` line: if a stage fails, its dependents don't clear on their own - they sit in `PD` with reason `DependencyNeverSatisfied` until you cancel them.

---

## 5. Recommendations for workflow management

Pulling the lesson together, a few habits make workflows easier to build, parallelize, and reproduce:

1. **Modularize input, processing, and output** - Keep the science separate from the I/O so you can re-point inputs or add a parallel wrapper without rewriting the core algorithm.
2. **Map your stages and dependencies first** - Sketch which stages are sequential and which are independent *before* choosing a parallel strategy. Confirm the work is actually parallelizable (§2) and that you'll see a speedup (Amdahl/Gustafson).
3. **Match the parallel strategy to the coupling** - Embarrassingly parallel → job arrays; shared-memory → cores on one node; cross-node communication → MPI; heavy numerics → GPU.
4. **Right-size your arrays** - Keep tasks at ~30+ minutes each, throttle concurrency with `%`, and give every task a unique output path.
5. **Wire stages with `afterok` dependencies** - Use dependencies instead of waiting/polling: submit the whole pipeline at once and let Slurm orchestrate it.
6. **Keep runs reproducible** - Give each run its own output directory and record the parameters that produced it (see [Lesson 2](./workshop-hpc-l2.md#track-experiments-configs-and-results) on tracking experiments, configs, and results).

**Workflow Managers**

As pipelines grow, hand-wiring `sbatch --dependency` chains gets unwieldy.

Dedicated **workflow managers** - Snakemake, Nextflow, and similar tools - let you declare stages and their dependencies once and submit to Slurm for you, with restart-on-failure and caching built in.

They're worth adopting when your workflow has many stages or you find yourself re-running only the parts that changed.

> 🧰 - Interested in defining a parallelized workflow for *your* research? I'm happy to hold a follow-up clinic to help map your pipeline's stages and dependencies and pick a parallelization strategy.

## ✅ Verification Checkpoint

- You can explain when to reach for an interactive job vs. a batch job in a workflow.
- You can name the main types of parallel jobs and match each to a Slurm strategy.
- You submitted a **job array** and saw each task write to its own output directory.
- You wired a **multi-stage workflow** with `afterok` dependencies and watched Slurm release each stage in order.
- The full pipeline produced `$WORK_DIR/runs/scored.csv` and the figures in `$WORK_DIR/runs/eval/`.

# Lesson Conclusion

You've gone from running one job to orchestrating many - fanning work out with job arrays and chaining stages together with dependencies. That's the core of building real HPC workflows.

Next, in **[Lesson 5: Reproducibility and Checkpointing](./workshop-hpc-l5.md)**, we'll pin environments, record manifests and job metadata into results, and checkpoint jobs so your workflows are both repeatable and interruption-proof.

This is considered a bonus lesson as it covers material that makes your code reproducible on the cluster and less on the details of executing on the cluster.
