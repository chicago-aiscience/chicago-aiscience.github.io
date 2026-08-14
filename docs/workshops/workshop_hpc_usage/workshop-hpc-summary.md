# Lessons Summary

**Lesson 1: Getting Started**
You built a mental model for what an HPC cluster is made of - login nodes, a scheduler, compute nodes, and shared storage.

- You logged in over SSH
- Loaded cluster modules
- Created a conda environment your jobs could use
- Then submitted your first interactive job with `srun --pty` and your first batch job with `sbatch`

**Lesson 2: Data Management**
You moved data on and off the cluster with `rsync`, `scp`, and `sftp`.

You learned which storage each kind of file belongs in:

- Home for code and configs
- Scratch for working data
- Long-term storage for datasets you need to keep
- Node-local storage for the fast temporary I/O a running job needs

The organizing question throughout was how long the data needs to live.

**Lesson 3: Errors and Monitoring**
You saw which commands to use to watch jobs while they ran with `squeue`, `scontrol`, and `nvidia-smi`.

- You learned how to read their metrics after the fact with `sacct`
- You reviewed exit codes, job state codes, and pending reason codes to work out why a job failed or never started
- You saw how to separate `.out` from `.err` so the logs could answer that question
- Finally you saw how a long job survives interruption - trapping `SIGUSR2` and `SIGTERM`, checkpointing inside the grace window, and requeuing

**Lesson 4: Building Workflows**
You turned a multi-step pipeline into a workflow.

- Job arrays fanned prediction out across the reaches from a single `--array` directive
- `afterok` dependencies chained train → predict → aggregate so Slurm released each stage only once the previous one succeeded.
- You also learned to ask whether parallelism will help at all before paying for it

**Lesson 5 (Bonus): Reproducibility**
You pinned the environment, moved settings into a committed config file with CLI overrides, recorded a manifest of exactly which inputs a run consumed.

- You also saw how to seed the randomness you can control and set a tolerance for what you can't
- And learned to stamp the job id and git SHA into the results

Together these lessons take one project - the SWOT Confluence river-discharge model - from a first login all the way to a parallel, multi-stage workflow that survives preemption and can still be explained a year later.

The goal is a set of patterns you can carry to your own work, not a list of SLURM flags to memorize.

## Key takeaways

- Login nodes are for submitting, querying, and editing. Anything that actually consumes CPU, GPU, or memory belongs in a job on a compute node.
- The scheduler gives you what you ask for, so ask accurately: request too little and the job is killed, too much and it waits longer in the queue for resources it never uses.
- Match storage to the lifetime of the data, and keep code, environments, and data in separate places.
- A job you didn't monitor is a job you can't debug. `squeue` while it runs, `sacct` once it's done, and logs split into `.out` and `.err`.
- Three places tell you why a job failed: the **exit code**, the **state code**, and - for jobs that never started - the **pending reason**.
- Job arrays are for independent work; dependencies are for ordered stages. `afterok` builds a chain that stops rather than running analysis on a training job that crashed.
- Interruption is normal, not exceptional. Time limits and preemption are part of shared infrastructure, so long jobs should checkpoint on a schedule and requeue themselves.
- Reproducibility is not one tool - it's pinning the environment, committing the config, recording the inputs, seeding the randomness, and stamping the job's own metadata into its results.

## References

Both reference lists for this series live in the [Appendix](./appendix.md):

- **[Resources linked to in the workshop](./appendix.md#resources-linked-to-in-the-workshop)** - Every external link that appears in the lesson content, grouped by lesson and annotated with what it covers. Use this when you remember a link from a lesson and want to find it again.
- **[References and further reading](./appendix.md#references-and-further-reading)** - The background sources behind the series - SLURM and center documentation, papers on parallelism, checkpointing, and scientific workflows - grouped by topic. Use this to go deeper on something a lesson only introduced.

## Where to go next

- **[Model, Data & Code Tracking guide](https://chicago-aiscience.github.io/index-1/)** - The companion UChicago AI + Science guide, which goes deeper on Git, DVC, MLflow, and W&B than Lesson 5 could.
- **[Workshop repository](https://github.com/chicago-aiscience/workshop-hpc-2026-sep)** - Every batch script, config, and source file used in the series, ready to adapt to your own project.
- **[HPC User Guide](../../user_guide/hpc/hpc-user-guide.md)** - The quick-reference version of this material for day-to-day use, including the RCC and DSI specifics.
