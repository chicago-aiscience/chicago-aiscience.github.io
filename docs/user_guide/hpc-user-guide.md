# HPC User Guide

This site is a guide for UChicago Schmidt Fellows using University HPC resources. It covers:

- **RCC (Research Computing Center)** clusters (campus-wide)
- **DSI (Data Science Institute)** cluster (DSI-affiliated)


## Which cluster should I use?

**RCC docs:** https://docs.rcc.uchicago.edu

**DSI docs:** https://cluster-policy.ds.uchicago.edu

| Feature | RCC | DSI |
|------|----|----|
| Primary audience | Campus-wide research | DSI-affiliated research |
| Scheduler | SLURM | SLURM |
| GPUs | Yes (Schmidt + others) | Limited / varies |
| Containers | Singularity supported | Singularity/Podman allowed but unsupported |
| Max job time | 36 hours | 12 hours |
| Best for | Large-scale, long-running jobs | Moderate-scale, fast iteration |

## Quickstart checklist

### Accounts
- [ ] Request RCC account (via PI)
- [ ] Confirm access to Schmidt partitions (e.g., `schmidt-gpu`)
- [ ] If eligible, request DSI account (email techstaff@cs.uchicago.edu)

### First login
- [ ] SSH into RCC login node
- [ ] SSH into DSI login node (if obtained account)
- [ ] Open Open OnDemand and confirm you can browse files
- [ ] Verify `$HOME` and scratch directories exist

### Basics
- [ ] Read RCC [“Common Mistakes” page](https://docs.rcc.uchicago.edu/101/mistakes/)
- [ ] Run `sinfo -a` and `squeue` to see the cluster state. See ["Cluster Commands"](commands.md)
- [ ] Submit a **short interactive job** (`srun`). See ["Cluster Commands"](commands.md)

### Storage guidelines
- [ ] Keep code in `$HOME`
- [ ] Use scratch for job outputs
- [ ] Confirm you understand which directories are purged

### Environment setup
- [ ] Load required modules
- [ ] Create a virtual environment in project or scratch space
- [ ] Test your environment in an interactive job

### Batch jobs
- [ ] Copy and edit `gpu.sbatch` or `array.sbatch`
- [ ] Reduce time/memory to the minimum needed
- [ ] Submit with `sbatch`
- [ ] Inspect `.out` and `.err` files

### Scaling up
- [ ] Try a job array if running many similar tasks
- [ ] If using MPI, test on **small node counts first**
- [ ] Monitor jobs with `squeue -u $USER`

### Ongoing best practices
- [ ] Clean scratch regularly
- [ ] Keep job scripts under version control
- [ ] Save job IDs for reproducibility
- [ ] Contact RCC/DSI support **early** if something is unclear

### When to ask for help
Ask for help **before** running large jobs if:
- Your job fails immediately
- You are unsure which partition to use
- You need longer wall time or more resources