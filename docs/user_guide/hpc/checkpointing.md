# Checkpointing on HPC Clusters

Training jobs on shared clusters can be interrupted at any time because they hit the wall-time limit (RCC: 36h, DSI: 12h). Checkpointing saves your training state so that when a job restarts, it picks up where it left off rather than starting over.

## How SLURM preemption works

When SLURM needs to kill your job, it can be configured to send a warning signal first. Adding this line to your batch script tells SLURM to send `SIGUSR2` to your process 60 seconds before the kill:

```bash
#SBATCH --signal=USR2@60
```

That 60-second window is your opportunity to save a checkpoint and requeue the job before SLURM terminates it.

## The pattern

The approach used by training frameworks has three components:

**1. A preemption flag**

A mutable container (a `dict`) that lives at module scope so a signal handler can modify it:

```python
preemption_flag = dict(flag=False)
```

A plain `bool` variable won't work here — assignment inside a nested function creates a new local variable rather than modifying the outer one. A `dict` is mutable, so `preemption_flag["flag"] = True` modifies the existing object.

**2. A signal handler registered before the training loop**

```python
import signal

def set_preemption_flag(signum, frame):
    print(f"Signal {signum} received — will checkpoint and requeue.")
    preemption_flag["flag"] = True

signal.signal(signal.SIGUSR2, set_preemption_flag)
```

This must be called before the training loop starts. When SLURM sends `SIGUSR2`, Python interrupts the current instruction, runs `set_preemption_flag`, then resumes — so the flag is set without crashing the process.

**3. A check at the end of each training step**

```python
if preemption_flag["flag"]:
    save_checkpoint(step)
    requeue()
```

Checking at the step boundary (not mid-step) means you always save a clean, consistent state.

## Small example

The following self-contained script trains a small linear model and implements the full pattern:

```{literalinclude} scripts/checkpoint/checkpointing_example.py
:language: python
```

## How the example works

*(See # comment to the right of each component in the script above)*

1. **Flag dict** - `preemption_flag` is a `dict` at module scope so the signal handler can mutate it. The signal handler itself is intentionally minimal: it just sets the flag and returns immediately, keeping signal-handler execution time short.

2. **Signal registration** - `signal.signal(SIGUSR2, set_preemption_flag)` is called once before the loop. Python's signal handling is cooperative: the handler runs between bytecode instructions, so registering before the loop ensures no signal is missed.

3. **Resuming at startup** — loading the checkpoint is unconditional: if the file exists, resume from it. This is idempotent, running the script fresh on a clean directory behaves normally, and every subsequent restart continues from the last saved step.

4. **Periodic saves** — `SAVE_EVERY = 10` guards against unexpected hardware failures that don't send a signal (e.g., a node going down). Tune this based on how long a save takes vs. how much work you can afford to redo.

5. **Preemption check at step boundary** — checking the flag after `optimizer.step()` ensures the checkpoint captures a consistent state (parameters and optimizer state updated together for the same step).

6. **`scontrol requeue`** — this tells SLURM to re-add the job to the queue with the same job ID and resource request. When the job starts again, it hits the checkpoint-resume logic at startup and continues from where it left off. `sys.exit(0)` then cleanly terminates the current run.

## Batch script configuration

```{literalinclude} scripts/checkpoint/checkpointing_example.sbatch
:language: bash
```

:::{tip}
Test the signal handling locally before submitting to the cluster:

```bash
# In one terminal, start the script
python checkpointing_example.py &

# In another terminal, send the signal
kill -USR2 %1
```

You should see the checkpoint-and-requeue message. On a local machine `SLURM_JOB_ID` won't be set, so `requeue()` will skip the `scontrol` call and just exit.
:::

:::{note}
**For multi-GPU / distributed jobs:** only rank 0 should call `scontrol requeue`. All ranks should save their own shard of the checkpoint (model parameters, optimizer state) before rank 0 issues the requeue. Use a barrier to ensure all ranks finish saving before rank 0 exits.
:::
