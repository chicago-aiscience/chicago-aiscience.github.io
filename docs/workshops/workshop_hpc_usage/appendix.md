# Appendix

(ssh-github)=
## Configuring SSH authentication with GitHub (on the cluster)

To `git clone`, `pull`, and `push` the workshop repository (and your own repos) **from the cluster**, GitHub needs to recognize the machine you're on. The cleanest way is an SSH key generated on the cluster and registered with your GitHub account. Once set up, Git operations to GitHub work without passwords or tokens.

> 🧰 - Don't confuse the two SSH keys in play:
> 1. **Laptop → cluster** - lets you log in to the cluster (covered in §3; DSI requires this).
> 2. **Cluster → GitHub** - what this appendix sets up, so the cluster can talk to GitHub.
>
> They are separate keys with separate purposes. The steps below are run **while logged into the cluster**.

### 1. Generate a key on the cluster

Log into the cluster, then create an `ed25519` key (use the email tied to your GitHub account):

```bash
ssh-keygen -t ed25519 -C "your_github_email@example.com"
```

Press Enter to accept the default location (`~/.ssh/id_ed25519`). You may set a passphrase for extra security, or leave it empty for convenience.

### 2. Set correct permissions

SSH refuses to use keys with loose permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### 3. Start the SSH agent and add the key

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

> 🧰 - The agent lives only for your current session. If a later session prompts for the key, just re-run these two lines.

### 4. Copy your public key

Print the **public** key and copy the entire line (it begins with `ssh-ed25519`):

```bash
cat ~/.ssh/id_ed25519.pub
```

> ⚠️ - Only ever share the `.pub` (public) key. Never copy or send `id_ed25519` (the private key).

### 5. Add the key to GitHub

1. Go to **GitHub → Settings** (top-right profile menu).
2. Select **SSH and GPG keys**.
3. Click **New SSH key**.
4. Give it a recognizable **Title** (e.g. `UChicago cluster`) so you can revoke it later.
5. Paste the public key into **Key**.
6. Click **Add SSH key**.

### 6. Test the connection

```bash
ssh -T git@github.com
```

The first time, accept the host fingerprint by typing `yes`. Success looks like:

```
Hi <your-username>! You've successfully authenticated, but GitHub does not provide shell access.
```

(That message is expected - GitHub doesn't give a shell.)

### 7. Clone (or switch) using the SSH URL

Clone with the **SSH** form of the URL:

```bash
git clone git@github.com:chicago-aiscience/workshop-hpc-2026-sep.git
```

If you already cloned over HTTPS and want to switch that repo to SSH:

```bash
cd workshop-hpc-2026-sep
git remote set-url origin git@github.com:chicago-aiscience/workshop-hpc-2026-sep.git
git remote -v      # confirm it now shows git@github.com:...
```

### Troubleshooting

- **`Permission denied (publickey)`** - The key isn't loaded or isn't on GitHub. Re-run `ssh-add ~/.ssh/id_ed25519` (Step 3) and confirm the public key is listed under GitHub → Settings → SSH and GPG keys.
- **`Host key verification failed`** - You declined the fingerprint prompt in Step 6; run `ssh -T git@github.com` again and type `yes`.
- **Still prompted for a username/password on `git push`** - That repo's remote is still HTTPS; switch it with the `git remote set-url` command in Step 7.
- **Windows users** - Generate the key inside **WSL**, not PowerShell; they keep separate SSH configurations. (This applies when setting up the laptop→cluster key, not on the cluster itself.)

## References and further reading

The resources below informed the workshop and are good next reads if you want to go deeper. Each entry says what the resource covers and where in the series it applies. (The official RCC, DSI, and SLURM documentation is also linked inline throughout the lessons.)

### SLURM and job management

- **[Slurm Fundamentals: Job Scheduling on HPC Clusters](https://www.abhik.ai/concepts/gpu-computing/slurm-fundamentals)** (Abhik Sarkar). An accessible primer on how SLURM schedules work on a cluster. Good background for the scheduler, partitions, and jobs material in *Lesson 1*.
- **[Job Management](https://hpc.nmsu.edu/discovery/slurm/job-management/)** (NMSU HPC). A concise reference for submitting, monitoring, and controlling SLURM jobs. Complements the monitoring commands in *Lesson 3*.
- **[Basics of Running Jobs](https://docs.nersc.gov/jobs/)** (NERSC). A large HPC center's guide to batch and interactive jobs, giving broader context for *Lessons 1 and 3*.

### Errors, exit codes, and troubleshooting

- **[Slurm Job Exit Codes](https://slurm.schedmd.com/job_exit_code.html)** (SchedMD). The official reference for the `N:M` exit-code format. Underpins the exit-code table in *Lesson 3*.
- **[Slurm Troubleshooting Guide](https://slurm.schedmd.com/troubleshoot.html)** (SchedMD). The official checklist for diagnosing failing and pending jobs (*Lesson 3*).
- **[Slurm Errors FAQ](https://hpcc.umd.edu/faq/slurm/)** (University of Maryland). A plain-language catalog of common SLURM errors and their fixes. Cited directly in *Lesson 3*.
- **[Troubleshooting Failed HPCC Jobs](https://icer.msu.edu/for-hpc-users/topic-of-the-month/troubleshooting-failed-hpcc-jobs)** (ICER, Michigan State). Worked examples of debugging failed jobs such as out-of-memory and timeouts. Reinforces the debugging workflow in *Lesson 3*.

### Storage, scheduling policy, and checkpointing

- **[UChicago DSI Cluster Scheduling Policy](https://cluster-policy.ds.uchicago.edu/policies/scheduling/)** (DSI). The DSI cluster's own scheduling and preemption rules. The local reference behind the preemption and requeue discussion in *Lesson 3*.
- **[Checkpoint/Restart](https://doc.zih.tu-dresden.de/jobs_and_resources/checkpoint_restart/#using-dmtcp-manually)** (ZIH HPC Compendium, TU Dresden). How to checkpoint and restart jobs, including DMTCP. Background for the checkpoint and requeue pattern in *Lesson 3*.
- **[Containerized Checkpoint/Restart](https://docs.nersc.gov/development/checkpoint-restart/containers/)** (NERSC). Checkpointing for containerized workloads, an alternative to the in-code checkpointing shown in *Lesson 3*.

### Parallelism and scientific workflows

- **[Parallel Computing](https://docs.hpc.shef.ac.uk/en/latest/parallel/index.html)** (Sheffield HPC). An overview of parallel job types and of Amdahl's and Gustafson's laws. Cited in the "will parallelizing help?" discussion in *Lesson 4*.
- **[Evaluating Parameter Sweep Workflows in High Performance Computing](https://www.researchgate.net/publication/235005635_Evaluating_Parameter_Sweep_Workflows_in_High_Performance_Computing)**. A study of parameter-sweep workflows, the classic job-array use case in *Lesson 4*.
- **[Scalable Workflows and Reproducible Data Analysis for Genomics](https://pmc.ncbi.nlm.nih.gov/articles/PMC7613310/)** (PMC). A real-world, multi-stage, reproducible workflow example that motivates the pipeline-and-dependency approach in *Lesson 4*.
- **[Many-Task Computing and Blue Waters](https://arxiv.org/abs/1202.3943)** (Katz et al.). A foundational discussion of many-task, embarrassingly parallel computing on HPC. Context for the job arrays in *Lesson 4*.
- **[Community Roadmap and Challenges in Scientific Workflows](https://arxiv.org/abs/2410.14943)** (arXiv:2410.14943). A community survey of open challenges in scientific workflows, mapping the wider landscape around *Lesson 4*.
- **[Workflows Community Initiative](https://workflows.community/)**. A hub for workflow tools, standards, and community resources. Relevant to the workflow-manager section of *Lesson 4*.
- **[Snakemake](https://snakemake.github.io/)**. A widely used workflow manager for declaring stages and dependencies. The tool recommended in *Lesson 4* as pipelines outgrow hand-wired dependency chains.
- **[Performance Analysis for Complex Scientific Workflows](https://www.cs.uoregon.edu/Reports/AREA-202512-Lisan.pdf)** (Aliza Lisan, University of Oregon). A survey of performance-analysis and visualization tools for multi-task, AI-integrated workflows. Extends the monitoring ideas in *Lesson 3* and the workflow ideas in *Lesson 4*.

### Reproducibility, determinism, and provenance

- **[Reproducibility](https://pytorch.org/docs/stable/notes/randomness.html)** (PyTorch). The official notes on seeding, `use_deterministic_algorithms`, cuDNN flags, and `DataLoader` worker seeding. The basis for the determinism section of *Lesson 5*.
- **[Managing environments](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)** (conda). Exporting, locking, and rebuilding environments - the `--no-builds`, `--from-history`, and `--explicit` distinctions used in *Lesson 5*.
- **[conda-lock](https://conda.github.io/conda-lock/)**. Generates true multi-platform lock files from an `environment.yml`. The next step past a hand-pinned spec in *Lesson 5*.
- **[Apptainer User Guide](https://apptainer.org/docs/user/main/)**. Containers on HPC, including `--nv` for GPU access. Background for the "strongest pin" option in *Lesson 5*.
- **[Ten Simple Rules for Reproducible Computational Research](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003285)** (Sandve et al., PLOS Comput Biol). The short, widely cited statement of why recording provenance matters. Frames *Lesson 5*.
- **[A higher order estimate of the optimum checkpoint interval for restart dumps](https://doi.org/10.1016/j.future.2004.11.016)** (Daly, *Future Generation Computer Systems* 22(3), 2006). The origin of the Young/Daly formula behind the checkpoint-interval guidance in *Lesson 5*. See also [Checkpointing à la Young/Daly: An Overview](https://doi.org/10.1145/3549206.3549328) for a readable summary.
- **[Model, Data & Code Tracking guide](https://chicago-aiscience.github.io/index-1/)** (UChicago AI + Science). The companion guide on Git, DVC, pointer files, MLflow, and W&B. Referenced throughout *Lessons 2 and 5*.

### AI + HPC and workload-aware computing

- **[AI-coupled HPC Workflow Applications, Middleware and Performance](https://arxiv.org/html/2406.14315v2)** (arXiv:2406.14315). A survey of AI-in-HPC, AI-out-HPC, and AI-about-HPC integration patterns. The source for the "where AI fits in" section of *Lesson 4*.
- **[A Scientific Approach to Workload-Aware Computing on AWS](https://aws.amazon.com/blogs/hpc/a-scientific-approach-to-workload-aware-computing-on-aws/)** (AWS HPC Blog). A framework for classifying workloads as tightly or loosely coupled, mixed, or variable. Cited in the workload-characteristics section of *Lesson 4*.
- **[Optimizing Compute-Intensive Tasks on AWS](https://aws.amazon.com/blogs/hpc/optimizing-compute-intensive-tasks-on-aws/)** (AWS HPC Blog). Practical guidance on right-sizing compute-heavy jobs. Complements the resource and parallelism choices in *Lesson 4*.
- **[Optimal Price-Performance for HPC Workloads](https://d1.awsstatic.com/HPC2019/Optimal-Price-Performance-for-HPC-Workloads-Aug2019.pdf)** (AWS, 2019). Cost and performance trade-offs when sizing HPC workloads. Supplementary reading for *Lesson 4*.

## Resources linked to in the workshop

Every external link that appears in the lesson content, grouped by where it is used. A handful of these also appear under *References and further reading* above - that section is for background reading, this one is a lookup for "what was that link in Lesson 3?".

### Used throughout the series

- **[Workshop repository](https://github.com/chicago-aiscience/workshop-hpc-2026-sep)** - The repo every lesson works from; holds the environment file, configs, `src/` code, and all SLURM batch scripts.
- **[Workshop input data](https://drive.google.com/drive/folders/1kGueYViLp8cWjQhKCXsUP2wbJIt1BrBd?usp=share_link)** (Google Drive). The two-basin subset of the SWOT Confluence products (~tens of MB) that attendees download and copy to the cluster.
- **[Model, Data & Code Tracking guide](https://chicago-aiscience.github.io/index-1/)** (UChicago AI + Science). The companion guide on Git, DVC, MLflow, and W&B, pointed to from *Lessons 2 and 5*.
- **[SLURM](https://slurm.schedmd.com)** (SchedMD). The scheduler's official documentation home, the source for every command reference in the series.

### Lesson 0: HPC Introduction

- **[SWOT Confluence](https://github.com/SWOT-Confluence)** (GitHub organization). The upstream river-discharge project the workshop example is derived from.
- **[PO.DAAC](https://podaac.jpl.nasa.gov/)** (NASA JPL). The data center that distributes the SWOT Confluence products used as input.
- **[Windows WSL setup](https://chicago-aiscience.github.io/workshop-github-actions-appendix/#windows-wsl)** (this site). Prerequisite instructions for Windows attendees, carried over from the GitHub Actions workshop.
- **Repository tour** - The four directories walked through in the setup section: [`environment.yml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/environment.yml), [`config/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/config), [`src/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/src), and [`slurm/`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/tree/dev/slurm).

### Lesson 1: Getting Started

**Accounts**

- **[RCC general user accounts](https://docs.rcc.uchicago.edu/accounts/#general-user-accounts)** (RCC). How to request an RCC account and associate it with a PI.
- **[RCC user guide](https://chicago-aiscience.github.io/rcc/)** (this site). Our own summary of getting started on RCC.
- **[DSI cluster accounts](https://cluster-policy.ds.uchicago.edu/quickstart/accounts/)** (DSI). Eligibility rules and the request process for the DSI cluster.
- **[DSI user guide](https://chicago-aiscience.github.io/dsi/)** (this site). Our own summary of getting started on the DSI cluster.

**Logging in**

- **[RCC connection overview](https://docs.rcc.uchicago.edu/connection/main/)** (RCC). The index of every supported way to reach the RCC cluster.
- **[RCC SSH](https://docs.rcc.uchicago.edu/connection/ssh/main/)** (RCC). Terminal access, including the Duo two-factor step.
- **[RCC Open OnDemand](https://docs.rcc.uchicago.edu/connection/open_ondemand/open_ondemand/)** (RCC). Browser-based access, useful for interactive sessions.
- **[RCC VS Code](https://docs.rcc.uchicago.edu/software/apps-and-envs/scode/main/)** (RCC). Running a VS Code editor session against the cluster.
- **[DSI SSH and GitHub tutorial](https://clinic.ds.uchicago.edu/tutorials/ssh_github_cluster.html)** (DSI Clinic). The DSI equivalent of the SSH setup, and the basis for the SSH appendix above.
- **[DSI login nodes](https://cluster-policy.ds.uchicago.edu/using-the-cluster/login-nodes/)** (DSI). What login nodes are for, and what you should not run on them.
- **[VS Code Remote - SSH](https://code.visualstudio.com/docs/remote/ssh)** (Microsoft). The extension that gives you an editor and terminal on a remote host.

**Scheduler and partitions**

- **[SLURM overview](https://slurm.schedmd.com/overview.html)** (SchedMD). What SLURM is and the pieces it is built from.
- **[SLURM architecture](https://slurm.schedmd.com/quickstart.html#arch)** (SchedMD). The controller/daemon diagram behind the scheduler explanation.
- **[RCC partitions](https://docs.rcc.uchicago.edu/slurm/partitions/)** (RCC). The list of partitions, their hardware, and their limits - where to look before choosing `--partition`.
- **Repository files** - [`config/setup_env.sh`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/config/setup_env.sh), [`environment.yml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/environment.yml), and [`slurm/02_train.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/02_train.sbatch) - the environment setup and the first batch script submitted.

### Lesson 2: Data Management

- **[RCC storage](https://docs.rcc.uchicago.edu/storage/main/)** (RCC). Home, project, and scratch spaces with their quotas and purge policies.
- **[DSI storage overview](https://cluster-policy.ds.uchicago.edu/using-the-cluster/storage-overview/)** (DSI). The equivalent storage map for the DSI cluster.
- **[DSI node-local storage](https://cluster-policy.ds.uchicago.edu/using-the-cluster/node-local-storage/)** (DSI). Why per-node scratch is fast and how to stage data into it.
- **[RCC rsync examples](https://docs.rcc.uchicago.edu/ssh/main/)** (RCC). Transfer commands for moving data to and from RCC.
- **[DSI rsync/scp guide](https://cluster-policy.ds.uchicago.edu/advanced-topics/rsync-scp/)** (DSI). The same for the DSI cluster.
- **Repository file** - [`slurm/06_nodelocal_predict.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/06_nodelocal_predict.sbatch) - the worked example of staging inputs to node-local storage.

### Lesson 3: Errors and Monitoring

**SLURM command references** (all SchedMD)

- **[`sinfo`](https://slurm.schedmd.com/sinfo.html)** - Node and partition state; see also the [format specifiers](https://slurm.schedmd.com/sinfo.html#OPT_format) used to build the custom views.
- **[`sacctmgr`](https://slurm.schedmd.com/sacctmgr.html)** - Accounting database, used here to list the associations that control partition access.
- **[`squeue`](https://slurm.schedmd.com/squeue.html)** - The pending and running queue; also its [format specifiers](https://slurm.schedmd.com/squeue.html#OPT_format), [job state codes](https://slurm.schedmd.com/squeue.html#SECTION_JOB-STATE-CODES), and [job reason codes](https://slurm.schedmd.com/squeue.html#SECTION_JOB-REASON-CODES).
- **[`scontrol`](https://slurm.schedmd.com/scontrol.html)** - Full detail on a single job, and the place to read partition settings such as `GraceTime`.
- **[`scancel`](https://slurm.schedmd.com/scancel.html)** - Cancelling jobs and sending arbitrary signals to them.
- **[`sprio`](https://slurm.schedmd.com/sprio.html)** - The priority breakdown for pending jobs; the weighting is explained in the [Multifactor Priority docs](https://slurm.schedmd.com/priority_multifactor.html).
- **[`srun`](https://slurm.schedmd.com/srun.html)** - Launching job steps, including attaching to a running allocation.
- **[`sacct`](https://slurm.schedmd.com/sacct.html)** - Post-hoc accounting metrics; the [options reference](https://slurm.schedmd.com/sacct.html#SECTION_OPTIONS) covers the `--format` field widths used in the examples.

**Monitoring and profiling**

- **[`nvidia-smi`](https://docs.nvidia.com/deploy/nvidia-smi/index.html)** (NVIDIA). The GPU utilization and memory tool used to watch a job while it runs.
- **[PyTorch profiler API](https://pytorch.org/docs/stable/profiler.html)** (PyTorch). The full reference for `torch.profiler` arguments.
- **[PyTorch profiler recipe](https://pytorch.org/tutorials/recipes/recipes/profiler_recipe.html)** (PyTorch). The recommended starting point; walks through the exact `with profile(...)` pattern in the lesson.
- **[TensorBoard profiler plugin](https://pytorch.org/tutorials/intermediate/tensorboard_profiler_tutorial.html)** (PyTorch). Visual trace viewing with a GPU utilization and kernel breakdown.
- **[Perfetto UI](https://ui.perfetto.dev)** - Browser trace viewer for the `trace.json` that `export_chrome_trace` writes.

**Errors and interruptions**

- **[FAQ: Slurm Errors](https://hpcc.umd.edu/faq/slurm/)** (University of Maryland). Plain-language explanations of the error messages in the common-issues table.
- **[DSI batch jobs](https://cluster-policy.ds.uchicago.edu/using-the-cluster/batch-jobs/)** (DSI). The local rules for preemption and requeue behind the checkpointing section.
- **Repository files** - [`slurm/03_checkpoint.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/03_checkpoint.sbatch) and [`src/train_consensus.py`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/src/train_consensus.py) - the full signal-handling wrapper and the training code it protects.

### Lesson 4: Building Workflows

- **[Parallel Computing](https://docs.hpc.shef.ac.uk/en/latest/parallel/index.html#gsc.tab=0)** (Sheffield HPC). The overview of parallel job types behind the "will parallelizing help?" discussion.
- **[Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law)** (Wikipedia). Why the serial fraction caps your speedup at a fixed problem size.
- **[Gustafson's law](https://en.wikipedia.org/wiki/Gustafson%27s_law)** (Wikipedia). The counterpoint: speedup scales when the problem grows with the core count.
- **[A Scientific Approach to Workload-Aware Computing on AWS](https://aws.amazon.com/blogs/hpc/a-scientific-approach-to-workload-aware-computing-on-aws/)** (AWS HPC Blog). The tightly/loosely coupled classification used to characterize workloads.
- **[AI-coupled HPC Workflow Applications, Middleware and Performance](https://arxiv.org/html/2406.14315v2)** (arXiv:2406.14315). The survey cited for where AI fits into HPC workflows.
- **Repository files** - [`slurm/02_train.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/02_train.sbatch), [`slurm/04_predict_array.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/04_predict_array.sbatch), and [`slurm/05_aggregate_dep.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/05_aggregate_dep.sbatch) - the train → array → aggregate chain built in this lesson, plus [`slurm/05_run_workflow.sh`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/05_run_workflow.sh), the login-node launcher that submits all three with their dependencies wired up.

### Lesson 5: Reproducibility and Checkpointing

- **[pip-tools](https://pip-tools.readthedocs.io/)** - `pip-compile --generate-hashes`, the pip-side equivalent of a locked environment.
- **[PyTorch Lightning checkpointing](https://lightning.ai/docs/pytorch/stable/common/checkpointing.html)** (Lightning AI). Framework-managed checkpointing, an alternative to the hand-rolled version in the lesson.
- **[submitit](https://github.com/facebookincubator/submitit)** (Meta). A Python interface for submitting and requeuing SLURM jobs, with signal handling built in.
- **[DMTCP](https://doc.zih.tu-dresden.de/jobs_and_resources/checkpoint_restart/#using-dmtcp-manually)** (TU Dresden). Transparent, process-level checkpointing that needs no changes to your code.
- **[CRIU / containerized checkpointing](https://docs.nersc.gov/development/checkpoint-restart/containers/)** (NERSC). Checkpoint and restore for containerized workloads.
- **Repository files** - [`environment.yml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/environment.yml), [`src/config.py`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/src/config.py), [`config/experiments/baseline.yaml`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/config/experiments/baseline.yaml), [`config/paths.sh`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/config/paths.sh), [`src/build_manifest.py`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/src/build_manifest.py), and [`slurm/02_train.sbatch`](https://github.com/chicago-aiscience/workshop-hpc-2026-sep/blob/dev/slurm/02_train.sbatch) - the config, path, and manifest machinery that makes a run reproducible.

