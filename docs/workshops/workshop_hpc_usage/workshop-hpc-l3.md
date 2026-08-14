# Lesson 3: Errors and Monitoring

## Objectives

Watch jobs and GPU usage while the jobs run, read metrics and logs to diagnose failures, and recover from interruptions.

- **Monitoring jobs** - Watch and interact with jobs using `squeue`, `scontrol`, and `scancel`.
- **Resource monitoring** - Different commands one can run to view CPU/GPU/memory usage.
- **Gathering metrics** - Read a job's metrics after it has run with `sacct`.
- **Error recovery** - How to log output vs. errors, and how to debug failed jobs.
- **Recovering from interruptions** - Handling preemption, with an intro to checkpointing.

---

## 1. Command to view cluster details

### `sinfo`

Slurm documentation link: https://slurm.schedmd.com/sinfo.html

`sinfo` shows information about Slurm nodes and partitions.

**View all partitions:**

```bash
sinfo -a
```

*Output:*

```bash
PARTITION          AVAIL  TIMELIMIT  NODES  STATE NODELIST
test                  up   infinite     33 drain* beagle3-0025,climate-[001-007,010-011,013,015,017,022,024-025,027-030,033,037,039-040,043,045,047],midway3-[0031-0035,0063]
test                  up   infinite     23  down* climate-[008-009,012,014,016,018-021,023,026,031-032,034-036,038,041-042,044,046,048],midway3-0296
test                  up   infinite      1   comp midway3-0093
test                  up   infinite      3  drain midway3-[0064-0066]
```

**View node and GPU information:**

This is a lot of columns for one screen, so it's split into two calls: one for partition status, one for resources/limits.

*Partition Status*

```bash
# Status: partition, partition state, priority, number of nodes, node state, list of nodes
sinfo -o "%.10P %.6a %.10p %.10D %.12T %N"
```

*Output:*

```bash
PARTITION  AVAIL  PRIO_TIER      NODES        STATE NODELIST
  caslake*     up          1          1     drained* midway3-0063
  caslake*     up          1          1   completing midway3-0093
```

| What | Specifier |
|---|---|
| Partition name | `%P` |
| Partition state | `%a` |
| Scheduling priority | `%p` |
| Number of nodes | `%D` |
| State (long form) | `%T` |
| Node list | `%N` |

> 🧰 - Note `%N` is left without a fixed width on purpose - sizing it (e.g. `%20N`) will truncate the node list if it's longer than that width.

*Resources/Limits*

```bash
# Resources & limits: hardware specs, GRES (e.g. GPUs), and job caps per partition
sinfo -o "%.10P %.6c %.10m %.8d %.20G %.20b %.12l %.8s"
```

*Output:*

```bash
 PARTITION   CPUS     MEMORY TMP_DISK                 GRES      ACTIVE_FEATURES    TIMELIMIT JOB_SIZE
  caslake*     48     184320        0               (null)      gold-6248r,192g     infinite 1-infini
       gpu     48     184320        0                gpu:4 gold-6248r,192g,v100     infinite 1-infini
```

| What | Specifier |
|---|---|
| Partition name | `%P` |
| CPUs per node | `%c` |
| Memory per node | `%m` |
| Temp disk per node | `%d` |
| Generic resources (e.g. GPUs) | `%G` |
| Node's active features | `%b` |
| Max time for any job | `%l` |
| Max job size | `%s` |

[Documented options link](https://slurm.schedmd.com/sinfo.html#OPT_format)

---

### `sacctmgr`

Slurm documentation link: https://slurm.schedmd.com/sacctmgr.html

**View partitions a user can access (Slurm accounting):**

```bash
sacctmgr show associations where user=$USER
```

>🧰 - Note this may not always show what partitions you have access to as it is dependent on how accounts + partitions are set up on the cluster.

---

## 2. How to monitor jobs

There are several [Slurm](./workshop-hpc-l1.md#slurm-scheduler) commands that can be used to monitor and interact with running jobs.

### `squeue`

Slurm documentation: https://slurm.schedmd.com/squeue.html

**View your running jobs:**

```bash
squeue -u $USER
```

*Output:*

```bash
             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)
          51492795 schmidt-g consensu ntebaldi PD       0:00      1 (None)
```

**View your running jobs with custom options:**

```bash
squeue -u $USER -o "%.18i %.20j %.12T %.12r %.8p %.10M %.6D %.4C %.10m %.10b %N"
```

*Output:*

```bash
             JOBID                 NAME        STATE       REASON PRIORITY       TIME  NODES CPUS MIN_MEMORY TRES_PER_N NODELIST
          51493154      consensus-train      RUNNING       Prolog 0.000027       0:02      1    8        32G      gpu:1 midway3-0558
```

| What | Specifier |
|---|---|
| Job ID | `%i` |
| Job name | `%j` |
| Job state (long) | `%T` |
| Reason | `%r` |
| Priority | `%p` |
| Time elapsed | `%M` |
| Num nodes | `%D` |
| Num CPUs | `%C` |
| Min memory requested | `%m` |
| GPU request | `%b` |
| Node list | `%N` |

[Documented options link](https://slurm.schedmd.com/squeue.html#OPT_format)

**Check the estimated start time of a job:**

```bash
squeue -u $USER --start
```

*Output:*

```bash
             JOBID PARTITION     NAME     USER ST          START_TIME  NODES SCHEDNODES           NODELIST(REASON)
          51505275 schmidt-g consensu ntebaldi PD                 N/A      1 (null)               (None)
```

---

### `scontrol`

Slurm documentation link: https://slurm.schedmd.com/scontrol.html

`scontrol` views or modifies Slurm configuration and state. Most of its subcommands need elevated permissions you won't have, but it still shows helpful job details.

**View job details:**

```bash
scontrol show job <ENTER_SLURM_JOB_ID>
```

*Output:*

```bash
JobId=51493230 JobName=consensus-train
   UserId=ntebaldi(1305796003) GroupId=ntebaldi(1305796003) MCS_label=N/A
   Priority=119976 Nice=0 Account=pi-dfreedman QOS=schmidt
   JobState=COMPLETED Reason=None Dependency=(null)
   Requeue=1 Restarts=0 BatchFlag=1 Reboot=0 ExitCode=0:0
   RunTime=00:00:08 TimeLimit=02:00:00 TimeMin=N/A
   SubmitTime=2026-07-07T09:18:54 EligibleTime=2026-07-07T09:18:54
   AccrueTime=2026-07-07T09:18:54
   StartTime=2026-07-07T09:19:09 EndTime=2026-07-07T09:19:17 Deadline=N/A
   SuspendTime=None SecsPreSuspend=0 LastSchedEval=2026-07-07T09:19:09
   Partition=schmidt-gpu AllocNode:Sid=beagle3-tbd1:470851
   ReqNodeList=(null) ExcNodeList=(null)
   NodeList=midway3-0558
   BatchHost=midway3-0558
   NumNodes=1 NumCPUs=8 NumTasks=1 CPUs/Task=8 ReqB:S:C:T=0:0:*:*
   TRES=cpu=8,mem=32G,node=1,billing=8,gres/gpu=1
   Socks/Node=* NtasksPerN:B:S:C=0:0:*:1 CoreSpec=*
   MinCPUsNode=8 MinMemoryNode=32G MinTmpDiskNode=0
   Features=(null) DelayBoot=00:00:00
   OverSubscribe=OK Contiguous=0 Licenses=(null) Network=(null)
   Command=/home/ntebaldi/workshop-hpc-2026-sep/slurm/02_train.sbatch
   WorkDir=/home/ntebaldi/workshop-hpc-2026-sep
   StdErr=/home/ntebaldi/workshop-hpc-2026-sep/logs/train_51493230.err
   StdIn=/dev/null
   StdOut=/home/ntebaldi/workshop-hpc-2026-sep/logs/train_51493230.out
   Power=
   TresPerNode=gpu:1
   NtasksPerTRES:0
```

---

### `scancel`

Slurm documentation link: https://slurm.schedmd.com/scancel.html

**Cancel a running job:**

```bash
scancel <ENTER_SLURM_JOB_ID>
```

>🧰 - Note that your job may not be cancelled immediately as a signal is sent to cancel the job.

---

### `sprio`

Slurm documentation link: https://slurm.schedmd.com/sprio.html

**View a job's scheduling priority for PENDING jobs:**

```bash
sprio -u $USER
```

*Output:*

```bash
          JOBID PARTITION     USER   PRIORITY       SITE        AGE  FAIRSHARE    JOBSIZE  PARTITION        QOS
       51496621 schmidt-g ntebaldi     119976          0          0      19967          9     100000          0
```

Every column to the right of `USER` is a **weighted contribution to the total priority**, and they add up to `PRIORITY`:

```text
SITE + AGE + FAIRSHARE + JOBSIZE + PARTITION + QOS
  0  +  0  +  19967    +    9    +  100000   +  0   = 119976
```

| Column | What it means |
|---|---|
| `PRIORITY` | The composite score SLURM uses to order pending jobs (higher starts sooner). It is the sum of the weighted factors to its right. |
| `AGE` | Grows the longer a job has waited in the queue, up to a cap. |
| `FAIRSHARE` | Rewards accounts that have used *less* than their granted share of the cluster recently and penalizes ones that have used more. A **high** value means you have been under-using your share, so your jobs are boosted; a **low** value means heavy recent use by you (or your PI account), so your jobs wait longer. |
| `JOBSIZE` | Based on how much the job requests (nodes/CPUs) relative to the partition. Depending on cluster config it can favor larger or smaller jobs. Here it is tiny, so job size barely affects this job. |
| `PARTITION` | A per-partition priority tier (it dominates this example at `100000`). |
| `QOS` | The quality-of-service boost. |
| `SITE` | A manual administrator adjustment. |

>🧰 - `sprio` only prints pending jobs. The factor values are already **weighted**, and the exact weights and behavior are set per cluster, see the [SLURM Multifactor Priority docs](https://slurm.schedmd.com/priority_multifactor.html).

---

(srun)=
### `srun`

Slurm documentation link: https://slurm.schedmd.com/srun.html

`srun` runs a parallel job on the cluster. Here we'll use it to attach a shell to a running job and check GPU usage with `nvidia-smi`.

[`nvidia-smi` documentation](https://docs.nvidia.com/deploy/nvidia-smi/index.html)

**Get GPU usage for a running job:**

```bash
srun --jobid=<JOBID> --overlap --pty nvidia-smi
```

**Track GPU usage for a running job:**

```bash
srun --jobid=<JOBID> --overlap --pty nvidia-smi -l 1
```

>🧰 - `ctrl-c` will cancel the job polling.

*Output:*

```bash
Tue Jul  7 15:37:00 2026
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.216.03             Driver Version: 535.216.03   CUDA Version: 12.2     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA A100-SXM4-80GB          On  | 00000000:17:00.0 Off |                    0 |
| N/A   49C    P0             260W / 500W |   4276MiB / 81920MiB |     88%      Default |
|                                         |                      |             Disabled |
+-----------------------------------------+----------------------+----------------------+

+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|    0   N/A  N/A    752986      C   python                                     4266MiB |
+---------------------------------------------------------------------------------------+
```

**Header**

| Field | Meaning |
|---|---|
| Driver Version: 535.216.03 | NVIDIA driver version installed on the node |
| CUDA Version: 12.2 | Max CUDA version the driver supports (not necessarily what your job is using) |

**GPU table**

| Field | Value | Meaning |
|---|---|---|
| GPU | `0` | GPU index on this node (0-indexed) |
| Name | `A100-SXM4-80GB` | GPU model - 80GB A100, SXM4 form factor |
| Persistence-M | `On` | Persistence mode - driver stays loaded between jobs instead of reinitializing, reduces startup latency |
| Bus-Id | `00000000:17:00.0` | PCIe bus address of the GPU |
| Disp.A | `Off` | Display attached - `Off` since this is a headless compute node, not driving a monitor |
| Volatile Uncorr. ECC | `0` | Count of uncorrectable memory errors since last reset - `0` is healthy; nonzero could mean flaky hardware |
| Fan | `N/A` | Fan speed - often `N/A` on datacenter GPUs, which are cooled by the chassis, not an onboard fan |
| Temp | `49C` | Current GPU temperature - comfortable, nowhere near thermal throttling (usually ~85-90C+) |
| Perf | `P0` | Performance state - `P0` is max performance (states range P0–P12, P0 = highest clocks/power) |
| Pwr:Usage/Cap | `260W / 500W` | Currently drawing 260W out of a 500W power limit |
| Memory-Usage | `4276MiB / 81920MiB` | Only ~4.3GB of the 80GB card's memory is in use |
| GPU-Util | `88%` | GPU compute is 88% busy over the last sampling interval - solid utilization |
| Compute M. | `Default` | Compute mode - `Default` allows multiple processes to share the GPU (vs. `Exclusive Process`) |
| MIG M. | `Disabled` | Multi-Instance GPU is off - the GPU isn't split into smaller isolated slices |

**Processes table**

| Field | Value | Meaning |
|---|---|---|
| PID | `752986` | The process using the GPU |
| Type | `C` | Compute process (as opposed to `G` for graphics) |
| Process name | `python` | Your training script |
| GPU Memory Usage | `4266MiB` | This process is responsible for essentially all the GPU memory in use |

> 🧰 - GPU-Util here is illustrative. The consensus MLP in `train_consensus.py` is small, so a real run uses only a fraction of an 80GB card.
>
> Batch size comes from the experiment config (`batch_size: 256`); there's a lot of headroom to increase it (or run multiple jobs/streams on the same GPU) before hitting a memory ceiling.

---

## 3. Gathering job metrics

### `sacct`

Slurm documentation link: https://slurm.schedmd.com/sacct.html

**View job metrics for a date range:**

```bash
sacct -u $USER --partition=schmidt-gpu --starttime=2026-06-01 --endtime=2026-07-07 \
	--format=User,Account,Partition,ReqCPUS,AllocCPUS,ReqMem,MaxRSS,ElapsedRaw,Timelimit,AllocNodes,NodeList,ReqTRES%-42,AllocTRES%-42 \
	--state=CD,F,TO,CA,OOM
```

*Output:*

```bash
     User    Account  Partition  ReqCPUS  AllocCPUS     ReqMem     MaxRSS ElapsedRaw  Timelimit AllocNodes        NodeList ReqTRES                                    AllocTRES
--------- ---------- ---------- -------- ---------- ---------- ---------- ---------- ---------- ---------- --------------- ------------------------------------------ ------------------------------------------
 ntebaldi pi-dfreed+ schmidt-g+        2          2        4Gn                    85   01:00:00          1    midway3-0426 billing=2,cpu=2,gres/gpu=1,mem=4G,node=1   billing=2,cpu=2,gres/gpu=1,mem=4G,node=1
          pi-dfreed+                   2          2        4Gn      1940K         85                     1    midway3-0426                                            billing=2,cpu=2,gres/gpu=1,mem=4G,node=1
          pi-dfreed+                   2          2        4Gn      4304K         82                     1    midway3-0426                                            cpu=2,gres/gpu=1,mem=4G,node=1
 ntebaldi pi-dfreed+ schmidt-g+        2          2        4Gn                  2450   01:00:00          1    midway3-0426 billing=2,cpu=2,gres/gpu=1,mem=4G,node=1   billing=2,cpu=2,gres/gpu=1,mem=4G,node=1
          pi-dfreed+                   2          2        4Gn      1948K       2450                     1    midway3-0426                                            billing=2,cpu=2,gres/gpu=1,mem=4G,node=1
          pi-dfreed+                   2          2        4Gn    411044K       2449                     1    midway3-0426                                            cpu=2,gres/gpu=1,mem=4G,node=1
```

`%-42` sets the column to 42 characters wide and left-justifies it, so the TRES strings print in full instead of being cut off at `billing=2+`. The GPU count is the `gres/gpu=` entry - requested on the job's summary row, allocated on the summary and step rows. The same `%-N` trick widens any other truncated column (`Account%-16`, `Partition%-12`).

| Field | Meaning |
|---|---|
| `User` | Username who submitted the job |
| `Account` | Slurm accounting account the job was charged to |
| `Partition` | Partition the job ran on |
| `ReqCPUS` | Number of CPUs requested |
| `AllocCPU` → `AllocCPUS` | Number of CPUs actually allocated |
| `ReqMem` | Memory requested (suffix `c` = per-CPU, `n` = per-node, e.g. `4Gn`) |
| `MaxRSS` | Peak resident memory actually used by any task |
| `ElapsedRaw` | Total wall-clock runtime, in raw seconds |
| `TimeLimit` → `Timelimit` | Requested time limit for the job |
| `AllocNodes` | Number of nodes allocated |
| `NodeList` | Names of the nodes the job ran on |
| `ReqTRES` | Trackable resources requested (cpu, mem, gres/gpu, node, billing, etc.) |
| `AllocTRES` | Trackable resources actually allocated |

| `--state` code | Meaning |
|---|---|
| `CD` | `COMPLETED` - job finished normally |
| `F` | `FAILED` - job exited with a non-zero code |
| `TO` | `TIMEOUT` - job hit its time limit and was killed |
| `CA` | `CANCELLED` - job was cancelled by the user or an admin |
| `OOM` | `OUT_OF_MEMORY` - job was killed after exceeding its memory allocation |

[Documented options link](https://slurm.schedmd.com/sacct.html#SECTION_OPTIONS)

> 🧰 - `MaxRSS` is often blank for jobs that only ran a single batch script without job steps - per-task memory accounting requires either `srun` steps inside the batch script or cgroup-based accounting enabled on the cluster.
>
> This is why some rows above show a value and others don't: each job prints one summary row plus one row per step, and only step rows carry `MaxRSS`.
>
> `ReqTRES` works the other way around - it only appears on the summary row, since a step doesn't request resources, it inherits them from the job's allocation.

**View details on a previously run job:**

```bash
sacct -j <JOBID> --format=JobID,JobName,State,Elapsed,TotalCPU,MaxRSS,ExitCode,ReqTRES%-42,AllocTRES%-42
```

*Output:*

```bash
       JobID    JobName      State    Elapsed   TotalCPU     MaxRSS ExitCode ReqTRES                                    AllocTRES
------------ ---------- ---------- ---------- ---------- ---------- -------- ------------------------------------------ ------------------------------------------
51504040     consensus+  COMPLETED   00:02:43  03:29.733                 0:0 billing=2,cpu=2,gres/gpu=1,mem=4G,node=1   billing=2,cpu=2,gres/gpu=1,mem=4G,node=1
51504040.ba+      batch  COMPLETED   00:02:43  02:59.180   5742136K      0:0                                            cpu=2,gres/gpu=1,mem=4G,node=1
51504040.ex+     extern  COMPLETED   00:02:43  00:00.002      1948K      0:0                                            billing=2,cpu=2,gres/gpu=1,mem=4G,node=1
```

---

### `torch.profiler`

`torch.profiler` is PyTorch's built-in profiler - no extra install needed. It wraps a block of code and records per-operator timing (CPU + CUDA), memory allocation, input shapes, and Python call stacks, then lets you inspect the result as a table, a Chrome trace, or a TensorBoard view.

**Basic usage:**

```python
import torch
from torch.profiler import profile, ProfilerActivity

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    record_shapes=True,
    profile_memory=True,
    with_stack=True,
) as prof:
    model.fit(niter)

print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=20))
prof.export_chrome_trace("trace.json")  # view at chrome://tracing or https://ui.perfetto.dev
```

**Key options:**

- **`activities`** - Which devices to trace (`CPU`, `CUDA`).
- **`record_shapes`** - Logs tensor shapes per op (helps spot unexpectedly small/large ops).
- **`profile_memory`** - Tracks memory allocated/freed per op.
- **`with_stack`** - Captures the Python call stack per op, so you can trace a slow op back to a source line.
- **`schedule` + `on_trace_ready`** - For profiling recurring steps in a training loop (e.g. skip warmup iterations, only capture a window) - commonly paired with TensorBoard's PyTorch profiler plugin.

**Docs:**

- **API reference** - https://pytorch.org/docs/stable/profiler.html
- **Tutorial / recipe** - Recommended starting point; walks through the exact `with profile(...)` pattern above: https://pytorch.org/tutorials/recipes/recipes/profiler_recipe.html
- **TensorBoard integration** - Visual trace viewer with GPU utilization/kernel breakdown: https://pytorch.org/tutorials/intermediate/tensorboard_profiler_tutorial.html

---

## 4. Error recovery + debugging

### Common issues

The monitoring commands above also help you recover from errors. Some common issues:

#### Out of memory issues

Consider the following batch job script:

```bash
#!/usr/bin/env bash
#SBATCH --job-name=consensus-train
#SBATCH --account=pi-dfreedman          # change to an allowed account on the cluster
#SBATCH --partition=schmidt-gpu         # GPU partition for Schmidt fellows
#SBATCH --qos=schmidt
#SBATCH --gres=gpu:1                    # request 1 GPU (adjust as needed)
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=5M                        # memory per CPU core
#SBATCH --time=02:00:00
#SBATCH --output=logs/train_%j.out      # stdout  -> normal log  (Lesson 3)
#SBATCH --error=logs/train_%j.err       # stderr  -> error log

...
```

The memory requested is `5M` (5 megabytes) which is too small for our consensus training example. This would cause an out of memory (OOM) error if you tried to run it.

Make sure to consider the resources you are requesting in the batch script options and that they align with the data footprint of your algorithm.

#### Job timeouts

Most clusters have a max wall time for job execution.

The RCC cluster has a max wall time of 36 hours while the DSI cluster has a max wall time of 12 hours.

If your job does not exit before the max wall time, it will be automatically terminated.

>🧰 - This resource covers other common problems: [FAQ: Slurm Errors](https://hpcc.umd.edu/faq/slurm/). It's specific to the University of Maryland's HPC cluster, but gives a good general sense of the issues that can come up.

### Debugging

#### Pending Jobs

Remember that this command can give you info on a current running job:

```bash
squeue -u $USER
```

The `ST` column contains job state codes. [Link to the full list of job state codes](https://slurm.schedmd.com/squeue.html#SECTION_JOB-STATE-CODES)

Sometimes you will see that the `ST` code is set to `PD` (`PENDING`) and your job might remain in that pending state.

You can locate the reason with this command:

```bash
squeue --me -o "%.10i %.8T %.40R"     # jobid, state, and the reason
```

_Output:_

```text
     JOBID    STATE                         NODELIST(REASON)
  53033019  PENDING                                   (None)
```

Sometimes the reason is not descriptive or hard to parse, so you can pull the reason straight from `scontrol`:

```bash
scontrol show job 12345 | grep -i reason
```

_Output:_

```text
   JobState=PENDING Reason=Nodes_required_for_job_are_DOWN,_DRAINED_or_reserved_for_jobs_in_higher_priority_partitions Dependency=(null)
```

**Other reasons you may encounter:**

| Reason | Meaning | What to do |
|---|---|---|
| `Resources` | Not enough free nodes/GPUs - waiting for the requested resources to free up. | Normal - wait, or reduce the request (fewer GPUs, less `--mem`). |
| `Priority` | Lower priority than other queued jobs, which run ahead of yours. | Normal on a busy cluster - wait; check your score with `sprio -j JOBID`. |
| `ReqNodeNotAvail` | A node the job requires is down, drained, or reserved for maintenance. | `sinfo -N` to find available nodes; if it's a maintenance window, resubmit later. |
| `Dependency` | Waiting on another job you listed in `--dependency`. | Check the parent with `scontrol show job JOBID`; it starts when the parent finishes (see `05_aggregate_dep.sbatch`). |
| `DependencyNeverSatisfied` | The job it depends on failed or was cancelled, so it will *never* run. | Cancel it (`scancel`) and fix the upstream job. |
| `QOSMaxJobsPerUserLimit` | Too many of your jobs are already running under this QOS. | Wait for current jobs to finish, or submit fewer at once. |
| `AssocGrpCpuLimit` | Your account's aggregate CPU limit is exceeded. | Check your limits: `sacctmgr show assoc user=$USER`. |
| `PartitionTimeLimit` | Your `--time` exceeds the partition's max. | Lower `--time` or pick a partition that allows it. |

[Full list of job reason codes](https://slurm.schedmd.com/squeue.html#SECTION_JOB-REASON-CODES)


(failed-jobs)=
#### Failed Jobs

**Exit Codes**

Failed batch jobs can be hard to debug. Three things help: the job's exit reason, its logs, and an interactive session where you can replicate and fix the error.

To view the exit code your job returned when it is failed, you can run this command:

```bash
sacct -j <JOBID> --format=JobID,State,ExitCode,DerivedExitCode,Elapsed
```

_Output:_

```bash
       JobID      State ExitCode DerivedExitCode    Elapsed
------------ ---------- -------- --------------- ----------
50317844_29+  COMPLETED      0:0             0:0   00:00:31
50317844_29+  COMPLETED      0:0                   00:00:31
50317844_29+  COMPLETED      0:0                   00:00:31
```

SLURM reports the exit code as `N:M` where `N` is the process exit code (non-zero → `F`/FAILED), and `M` is the signal number if a signal killed it:

| `ExitCode` | Meaning |
|---|---|
| `0:0` | Clean success. |
| `1:0` | Script exited non-zero - check `.err` for the traceback. |
| `0:15` | Killed by `SIGTERM` (15) - usually SLURM ending it: timeout, preemption, or `scancel`. |
| `0:9` | Killed by `SIGKILL` (9) - hard kill, often the OOM killer. |

`DerivedExitCode` is the highest exit code across the job's steps - check it when the script reports success but a step inside it failed.

**Job Logs**

Another important debugging tool are the log files. Looking at our batch script, we can separate the error and standard out logs to make it easier to parse errors from regular execution output:

```bash
#!/usr/bin/env bash
#SBATCH --job-name=consensus-train
#SBATCH --account=pi-dfreedman          # change to an allowed account on the cluster
#SBATCH --partition=schmidt-gpu         # GPU partition for Schmidt fellows
#SBATCH --qos=schmidt
#SBATCH --gres=gpu:1                    # request 1 GPU (adjust as needed)
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=5M                        # memory per CPU core
#SBATCH --time=02:00:00
#SBATCH --output=logs/train_%j.out      # stdout  -> normal log  (Lesson 3)
#SBATCH --error=logs/train_%j.err       # stderr  -> error log

set -euo pipefail

...
```

>🧰 - `set -euo pipefail` stops the script on any error so there are no silent failures.

`--output` and `--error` point to files that Slurm will send algorithm output to. It can be very helpful to review the both files to trace through the issue that occurred and understand how you might fix it.

**Debugging the actual job issue**

Once you have gathered the exit code and logs, you can launch an interactive job to run your algorithm manually while making changes to the code to troubleshoot and fix the error.

See ["Section 7. Running an interactive job"](#running-interactive-job) for how to launch an interactive job and run your algorithm code.

It can be helpful to add temporary `print` statements around the lines you suspect are the cause of failure. Beyond confirming *which line* was reached, useful things to log include:

- **Variable values** - Is the data what you expected, or did something upstream go wrong?
- **Shapes and dtypes** - `print(x.shape, x.dtype)` for tensors/arrays. Shape and type mismatches are the most common cause of model errors.
- **Device placement** - `print(x.device)` to catch the classic "expected all tensors on the same device" CUDA error (some data on CPU, some on GPU).
- **Collection sizes** - `print(len(dataset))` to catch an empty dataset or a path that matched no files.
- **File paths** - Print the exact path you're about to read/write, and whether it exists (`os.path.exists(p)`). A wrong or missing path is easy to miss.
- **Config / arguments** - Echo the hyperparameters, env vars, and CLI args the job actually received, so you can rule out a bad config.
- **Loss / metric values per step** - Watch for `NaN` or `inf`, which signal exploding gradients or a bad learning rate.
- **A step counter or timestamp** - Print the batch/epoch index (and time) so you can see *how far* it got and whether it's making progress or hung.

Remember these are *temporary* - remove them (or switch to the `logging` module with adjustable levels) once the bug is found.

> 🧰 On the cluster, `stdout` is buffered when Slurm redirects it to your `.out` file - prints may not appear until the job finishes, or may be lost if it crashes.
>
> Force them out with `print(..., flush=True)`, or run Python with `python -u` (unbuffered).
>
> If you use Python's `logging` module, log statements are directed to standard error `stderr`. If you want to log to standard out `stdout` so that the logged statements show up in the `.out` file, set `stream` to `sys.stdout`:
> ```python
> logging.basicConfig(
>        level=logging.INFO,
>        format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
>        datefmt="%Y-%m-%d %H:%M:%S",
>        stream=sys.stdout,          # default is stderr; send logs to stdout (SLURM .out)
>    )
> ```

(recover-from-interruptions)=
## 5. How to recover from interruptions

Long-running jobs get interrupted, and *how* depends on the cluster - so this section sets up a general, portable pattern rather than something specific to one machine.

- **Time limits** - Every cluster enforces a time limit (`--time`), so a job that needs longer than a single allocation must be able to stop and continue.
- **Preemption** - Some clusters pause or kill your running job to free resources for a higher-priority one, while others disable preemption entirely (for example, RCC/midway reports `PreemptMode = OFF`, so jobs there are never preempted).
- **Node failure** - Nodes can also fail.

The same machinery survives all of these: checkpoint as you go, save again on the warning signal, then requeue and resume. The approach is adapted from [this DSI cluster documentation](https://cluster-policy.ds.uchicago.edu/using-the-cluster/batch-jobs/).

The consensus model training is already set up for this: it checkpoints on a regular interval, at each epoch boundary, and when SLURM sends the warning signal (e.g., `SIGUSR2`). The wrapper then requeues the job so it picks up from the last checkpoint instead of starting over.

>🧰 - The DSI strategy requeues a job by exiting with code `99` (DSI wires that to Slurm's `RequeueExit`).
>
> On RCC that is not configured so this workshop requeues with `scontrol requeue` instead, which works on any cluster that allows requeue without relying on an exit-code convention.

### Wrapper script

First, let's review a wrapper that keeps a long-running Python algorithm alive across interruptions (the time-limit wall, and preemption where the cluster enables it).

The wrapper is set up to run the consensus training algorithm but the wrapper can be modified for your own Python scripts (see the tooltip below).

The full wrapper (with inline comments on every line) lives in [the workshop repository](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/03_checkpoint.sbatch). Rather than reproduce all ~190 lines here, the walkthrough below pulls out the pieces that make checkpoint/requeue work - the rest is ordinary resource requests and environment setup.

#### Setting up the signal

_The two `#SBATCH` directives that enable the pattern:_

```bash
#SBATCH --requeue                    # allow SLURM to put the job back in the queue
#SBATCH --signal=B:USR2@120          # warn the batch shell (USR2) 120s before the kill
```

- **`--requeue`** - Lets SLURM put the job back in the queue after preemption, node failure, or an explicit `scontrol requeue`. Without it, none of the resume logic below can run.
- **`--signal=B:USR2@120`** - Asks SLURM to send `SIGUSR2` to the **batch shell** (`B:`) about **120 seconds before** the `--time` wall.
- That budget is your window to checkpoint before the un-catchable `SIGKILL` arrives. `USR2` is a deliberate choice - `USR1` is already claimed by some frameworks (PyTorch Lightning, submitit).

**The signals involved.** `SIG` is just the prefix on every signal constant - the rest is the abbreviation:

| Signal | Stands for | No. | Default action | Catchable |
|---|---|---|---|---|
| `SIGTERM` | **term**inate | 15 | terminate | yes |
| `SIGKILL` | **kill** | 9 | terminate | **no** |
| `SIGCONT` | **cont**inue | 18 | resume if stopped | yes (but always resumes anyway) |
| `SIGSTOP` | **stop** | 19 | stop (suspend) | **no** |
| `SIGUSR1` / `SIGUSR2` | **us**e**r**-defined signal 1 / 2 | 10 / 12 | terminate | yes |
| `SIGINT` | **int**errupt (Ctrl-C) | 2 | terminate | yes |
| `SIGHUP` | **h**ang **up** | 1 | terminate | yes |

> 🧰 - The numbers are the Linux x86-64 values, which is what the cluster runs. They are not portable - macOS numbers `SIGUSR1` as 30, for example - so trap by name (`trap on_term TERM`), never by number.

`SIGUSR1` and `SIGUSR2` have no assigned meaning: the kernel reserves them for applications to define, which is exactly why `--signal=B:USR2@120` works. SLURM sends it, and your trap decides what it means.

**Which signal actually arrives.** `SIGUSR2` is not special to SLURM - it is simply the signal *we requested* via `--signal`.

`--signal` governs only the **time-limit** case. The other ways a job is stopped send different signals, which is why the wrapper traps both `USR2` and `TERM`:

| Scenario | What SLURM sends | Handled by |
|---|---|---|
| `--time` wall approaching | `SIGUSR2`, ~120s early (because we asked for it) | `on_preempt` → checkpoint + requeue |
| Preemption | `SIGCONT` + `SIGTERM`, then `SIGKILL` after the partition's `GraceTime` (a `USR2` warning fires **only** if the cluster is configured to send one) | `on_preempt` where `USR2` is configured (checkpoint + explicit requeue); otherwise `on_term`, and **`--requeue` auto-resumes** the job from the last checkpoint |
| `scancel <jobid>` | `SIGTERM` (or whatever `scancel --signal=` passes) | `on_term` → stop **without** requeue |
| Node failure | nothing reaches your job - SLURM auto-requeues via `--requeue` | resume from last checkpoint |
| Grace window expires | `SIGKILL` (signal 9) | **nothing** - it cannot be trapped or delayed |

> 🧰 Two consequences.
>
> (1) Because `SIGKILL` can never be caught, the `@120` lead time *is* the entire window your program has to save - set it comfortably larger than a checkpoint write.
>
> (2) Because preemption is guaranteed to send `SIGTERM` but only *maybe* `SIGUSR2`, a robust program should treat **either** signal as "checkpoint now".

#### Retries on failure

_Give up instead of requeuing forever if the job keeps dying before it makes progress:_

```bash
MAX_RESTARTS=5
if [[ "${SLURM_RESTART_COUNT:-0}" -gt "$MAX_RESTARTS" ]]; then
    echo "[$(date)] restart count ${SLURM_RESTART_COUNT} exceeds MAX_RESTARTS; giving up."
    exit 1
fi
```

SLURM increments `SLURM_RESTART_COUNT` on each requeue, so this caps a crash-loop that would otherwise resubmit indefinitely.

#### Signal to all child processes

_Relay the warning to the whole training process group, so parallel workers aren't orphaned:_

```bash
signal_child_group() {
    local sig="$1"
    if [[ -n "${child_pid:-}" ]] && kill -0 "$child_pid" 2>/dev/null; then
        kill -s "$sig" -- "-$child_pid" 2>/dev/null || \
            kill -s "$sig" "$child_pid" 2>/dev/null || true
    fi
}
```

The negative PID (`-$child_pid`) targets the entire process **group**, not just the top process, so `DataLoader` / `multiprocessing` workers get the signal too.

This works because Python is launched under `setsid` (below), which makes the child its own group leader.

#### Signal handler

_The heart of the pattern, the `SIGUSR2` handler: checkpoint, wait, then requeue:_

```bash
on_preempt() {
    trap '' USR2 TERM                  # ignore repeat signals while shutting down
    signal_child_group USR2            # tell Python to checkpoint and exit cleanly
    wait "$child_pid" || true          # let it finish saving; the grace window is the hard deadline
    scontrol requeue "$SLURM_JOB_ID"   # put the job back in the queue ourselves
    exit 0
}
trap on_preempt USR2
```

`scontrol requeue` is used here (rather than the DSI `exit 99` convention) because it works on any SLURM cluster that allows requeue.

A companion `on_term` handler, trapped on `TERM`, does the same relay-and-wait but exits `143` **without** requeuing, so a `scancel` really stops the job.

#### Training block

_The one block you edit to reuse the wrapper - launch your program under `setsid`, in the background:_

```bash
launch_training() {                        # marked ">>> EDIT HERE <<<" in the full script
    local resume_from="$1"
    local resume_args=()
    [[ -n "$resume_from" ]] && resume_args=(--resume-from "$resume_from")

    setsid python src/train_consensus.py \
        --config "$EXPERIMENT_CONFIG" \
        --manifest "$WORK_DIR/data/manifest_train.csv" \
        --out "$WORK_DIR/runs/consensus" \
        --ckpt-dir "$CKPT_DIR" \
        "${resume_args[@]}" &
}
```

`setsid` makes the program its own process-group leader (so `signal_child_group` can reach its workers); the trailing `&` backgrounds it so the traps can fire while it runs.

_On (re)start, resume from the rolling checkpoint if a previous run left one; otherwise start fresh:_

```bash
latest_ckpt="$CKPT_DIR/consensus_last.pt"
[[ -f "$latest_ckpt" ]] || latest_ckpt=""   # empty => fresh run

launch_training "$latest_ckpt"
child_pid=$!                                 # PID of the backgrounded setsid process

# Reaching here means training finished on its own (no warning fired) -> no requeue.
wait "$child_pid" || return_code=$?
```

#### Modifying your scripts for the wrapper

**Where to drop in your script.** You only edit one place in the wrapper - the block marked `>>> EDIT HERE: launch YOUR training program <<<`, which defines the `launch_training()` function.

Swap in your script and its arguments there; everything else (the signal traps, `setsid` process-group forwarding, requeue guard, and resume detection) stays exactly as-is.

**Contract + args.** Your code needs to implement the following to work with the script:

1. **Catch `SIGUSR2`, checkpoint, and exit cleanly** - When the cluster's preemption / time-limit warning arrives, the wrapper relays `SIGUSR2` to your program.
    -  Your program must save a checkpoint at a safe point and then exit - the wrapper handles the requeue for you (via `scontrol requeue`), so your program does *not* need any special exit code.
    - Register a handler that just sets a flag, then save at the next safe boundary - not inside the handler itself (a signal can interrupt at any instruction).
2. **Resume from a checkpoint path** - The wrapper passes the previous checkpoint as the first argument to `launch_training` (empty when starting fresh).
    - Your program must accept a "resume from this path" argument and restore its model / optimizer / epoch state from it when given.
3. **Write checkpoints into `CKPT_DIR`** - Save to the directory the wrapper passes in, so the next run can find the rolling checkpoint.
    - Write **atomically** (temp file + rename) so a checkpoint interrupted mid-write is never left corrupt.

The reference implementation (`src/train_consensus.py`) is launched like this:

```bash
python src/train_consensus.py \
    --config "$EXPERIMENT_CONFIG" \
    --manifest "$WORK_DIR/data/manifest_train.csv" \
    --out "$WORK_DIR/runs/consensus" \
    --ckpt-dir "$CKPT_DIR" \
    --resume-from "$latest_ckpt"
```

- **`--config`** - Experiment YAML supplying the model + training knobs (epochs, batch size, lr, hidden width, checkpoint interval).
- **`--manifest`** - Input data (specific to the reference script).
- **`--out`** - Output / results directory.
- **`--ckpt-dir`** - Where checkpoints are written → **contract #3**.
- **`--resume-from`** - Checkpoint to resume from → **contract #2**.

> 🧰 - Only `--resume-from` (contract #2) and `--ckpt-dir` (contract #3) are wired into the wrapper's logic.
>
> The rest are ordinary arguments to the reference script - rename or drop them freely when you plug in your own code, as long as the three contract points still hold.

### Python code

Now let's walk through the consensus training code to understand how the signal is caught and checkpointing is enabled.

The Python script is located in [the workshop repo](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/src/train_consensus.py) and key preemption functionality is included here:

_Variable that controls checkpointing behavior_

```python
# The interval between regular ("interval") checkpoints is a config knob
# (train.checkpoint_interval), resolved in main(); set it to 0 to disable interval
# saves, leaving the epoch-boundary and preemption-signal saves. Override per run
# with --checkpoint-interval.

# Set by the SIGUSR2 handler when SLURM warns of imminent preemption / time-out.
# The training loop watches this flag and checkpoints at the next safe point.
# (We use SIGUSR2 rather than SIGUSR1 because SIGUSR1 is already claimed by some
# frameworks -- e.g. PyTorch Lightning, submitit -- for their own auto-requeue.)
should_checkpoint: bool = False
```

_Functions that support preemption and saving checkpoints in a safe manner to prevent corruption of half-saved checkpoints_

```python
def handle_preempt(signum, frame) -> None:
    """Signal handler for the preemption warning (SIGUSR2).

    Kept deliberately minimal: it only flips a flag. Actually saving here would
    be unsafe -- a signal can interrupt at any instruction, and torch.save / the
    CUDA allocator are not async-signal-safe. The training loop does the save at
    the next step boundary, where model/optimizer state is consistent.
    """
    global should_checkpoint
    logger.info(f"[train] signal {signum} received; checkpointing at next step boundary...")
    should_checkpoint = True


def atomic_torch_save(state: dict, path: Path) -> None:
    """Write a checkpoint atomically so a mid-write kill never corrupts it.

    Saves to a sibling `.tmp` file first, then `os.replace()`s it into place.
    `os.replace` is atomic on the same filesystem, so `path` is always either the
    complete old checkpoint or the complete new one -- never a truncated file if
    SLURM's grace window expires (SIGKILL) during the write.

    Args:
        state: The checkpoint dict to serialize.
        path: Destination `.pt` path (its parent is created if needed).
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    torch.save(state, tmp)
    os.replace(tmp, path)
```

_Training loop with two atomic checkpoint saves: 1. Preemption warning prompts a checkpoint save and 2. Regular interval checkpoint save_

```python
# The checkpoint contents -- feature_names travel too, so prediction reads the
# right columns later.
def snapshot(epoch, step, done):
   return {"model": model.state_dict(), "opt": opt.state_dict(), "epoch": epoch,
           "step": step, "epoch_completed": done, "feature_names": names}

for epoch in range(start_epoch, num_epochs):
   model.train()
   running = 0.0
   for step, (x, y) in enumerate(loader):
      x, y = x.to(device), y.to(device)
      opt.zero_grad()               # clear last step's gradients
      loss = loss_fn(model(x), y)   # predict log-discharge, measure error vs. gauge
      loss.backward()               # backward: compute gradient for every weight
      opt.step()                    # optimizer: nudge every weight to reduce loss
      running += loss.item()        # track loss

      # 1. Preemption warning arrived: save at this safe point and exit
      #    cleanly. The wrapper (which relayed the signal) handles the
      #    requeue -- see slurm/03_checkpoint.sbatch (scontrol requeue).
      if should_checkpoint:
         atomic_torch_save(snapshot(epoch, step, False), ckpt)
         logger.info("[train] checkpoint saved on preemption warning; exiting for requeue.")
         sys.exit(0)

      # 2. Regular interval checkpoint (safety net for a warning-less kill).
      if checkpoint_interval and step > 0 and step % checkpoint_interval == 0:
         atomic_torch_save(snapshot(epoch, step, False), ckpt)
```

_Register signal_

```python
# React to SLURM's preemption/time-limit warning (delivered as SIGUSR2 by the
# wrapper). Registered on the main thread, before training starts.
signal.signal(signal.SIGUSR2, handle_preempt)
```

---

(test-job-interruptions)=
## 👉 6. Test job interruptions

[Section 5](#recover-from-interruptions) explained how the checkpoint/resume wrapper works - now let's run it and interrupt it on purpose to watch it recover.

On RCC preemption is disabled (`PreemptMode = OFF`), so rather than wait to be preempted we send the warning signal ourselves; the job checkpoints, requeues, and resumes exactly as it would when it hits the `--time` wall (or on a cluster that preempts).

This builds on the Lesson 1 setup - make sure you have [cloned the repo, built the environment, and set `config/paths.sh` for RCC](./workshop-hpc-l1.md#running-interactive-job). The script we run is the checkpoint wrapper from Section 5: [slurm/03_checkpoint.sbatch](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/03_checkpoint.sbatch).

### 👉 1. Log into the cluster

```bash
ssh -Y <CNetID>@midway3.rcc.uchicago.edu
```

Enter your `<CNetID>` password and authenticate with Duo.

### 👉 2. Locate the batch script in the workshop repo

```bash
cd $HOME/workshop-hpc-2026-sep     # the repo you cloned in Lesson 1
ls slurm/03_checkpoint.sbatch      # the checkpoint/requeue wrapper from Section 5
mkdir -p logs                      # the job writes to logs/ckpt_%j.out
```

### 👉 3. Submit the job

```bash
sbatch slurm/03_checkpoint.sbatch      # -> Submitted batch job 12345
```

Watch it start and note the job id, then follow the log until you see training steps:

```bash
squeue -u $USER
tail -f logs/ckpt_<JOBID>.out
```

### 👉 4. Send an interrupt signal

Once the job is `R` (running) and a few steps in, send the preemption / time-limit warning yourself:

```bash
scancel --signal=USR2 --batch <JOBID>    # short form: scancel -s USR2 -b 12345
```

The `--batch` (`-b`) flag is essential. Without it, `scancel --signal` targets the job's `srun` steps - and this job launches Python directly (no `srun` step), so the signal would land on nothing.

`--batch` delivers it to the batch script, where the `USR2` trap lives.

>🧰 - As shipped the training knobs come from the experiment config (`epochs: 500`). You may need to modify the `epochs` to run longer if it completes before you send the interrupt signal.

### 👉 5. Watch the job requeue and complete

Follow the same log - the job checkpoints, then requeues itself under the same job id:

```bash
tail -f logs/ckpt_<JOBID>.out
```

You should see, in order: `USR2 received...`, `[train] checkpoint saved on preemption warning...`, and `Requeuing job 12345 via scontrol requeue.`

The job then returns to `PD` and starts again as the **same** job id, logging `Resuming from .../consensus_last.pt` and continuing from the last checkpoint instead of restarting:

```bash
squeue -u $USER
sacct -j <JOBID> --format=JobID,State,ExitCode,Restart%7    # Restart increments to 1
```

When it finishes, the state is `COMPLETED`:

```bash
sacct -j <JOBID> --format=JobID,State,Elapsed,Restart%7
```

## ✅ Verification Checkpoint

- You submitted `03_checkpoint.sbatch` and saw it reach `RUNNING`.
- You sent `SIGUSR2` with `scancel --batch` and saw the job checkpoint at a safe point.
- You watched the same job id requeue (`Restart = 1`) and resume from the checkpoint.
- The job reached `COMPLETED` after resuming - surviving the interruption.

# Lesson Conclusion

You can now watch a job while it runs, read its metrics and logs to diagnose a failure, and recover a long job from an interruption.

Next we'll wire single jobs into workflows - fanning work out with job arrays and chaining stages together with dependencies.
