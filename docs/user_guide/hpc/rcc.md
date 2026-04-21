# RCC Cluster

Primary documentation: https://docs.rcc.uchicago.edu

Common pitfalls (worth reading early): https://docs.rcc.uchicago.edu/101/mistakes/

## Accounts

Reference: https://docs.rcc.uchicago.edu/101/accounts/

- Request a general RCC account
- Associate the account with a **PI**. For access to the Schmidt nodes, use `pi-dfreedman`

## Connecting

Reference: https://docs.rcc.uchicago.edu/101/connecting/

- SSH: https://docs.rcc.uchicago.edu/ssh/main/
- Open OnDemand: https://docs.rcc.uchicago.edu/open_ondemand/open_ondemand/
- VS Code: https://docs.rcc.uchicago.edu/software/apps-and-envs/scode/main/

## Software

- Software catalog: https://docs.rcc.uchicago.edu/software/
- Compilers: https://docs.rcc.uchicago.edu/software/compilers/

## Storage

Docs: https://docs.rcc.uchicago.edu/storage/main/

- Home: `/home/$USER` (~30 GB)
  - Configuration + small scripts
  - Private and cluster-specific
- Scratch: `/scratch/midways3/$USER` (~100 GB)
  - Temporary job data and active processing
- Node-local scratch, found at these environment variables: `$TMPDIR` / `$SLURM_TMPDIR`
  - Typically `/tmp/jobs/${SLURM_JOB_ID}`
  - **Deleted when the job ends** — copy results out
- Check quota:
    ```bash
    quota -u $USER
    ```

**Copying data**

- `scp` / `sftp`
- `rsync`
- Samba
- Globus (recommended for large data)
- See: [Data Transfer tools and tutorials](data-transfer.md)

## Running jobs

Key points:
- Login nodes are for editing and submitting jobs, **not** compute
- Jobs on compute nodes generally **do not have internet access**
- Common Schmidt partition: `schmidt-gpu`
- Max wall time is often **36 hours** (longer by request)
- Partitions: https://docs.rcc.uchicago.edu/partitions/
- Containers (Singularity): https://docs.rcc.uchicago.edu/software/apps-and-envs/singularity/

## Allocations

Reference: https://rcc.uchicago.edu/accounts-allocations/request-allocation

Allocations cover:
- Service Units (compute)
- Storage

## Support

- Walk-in Lab (Regenstein): Monday–Friday, 9am–5pm
- Phone: 773-702-3374
- Email: info@rcc.uchicago.edu

---
