# DSI Cluster

Primary documentation: https://cluster-policy.ds.uchicago.edu

FAQ: https://cluster-policy.ds.uchicago.edu/faq/faq/

## Accounts

Reference: https://cluster-policy.ds.uchicago.edu/quickstart/accounts/

Eligibility examples:
- DSI-related grant
- DSI member or affiliated faculty
- Student with written approval from a DSI faculty mentor

Account requests:
- Email: techstaff@cs.uchicago.edu

## Connecting

SSH guide: https://clinic.ds.uchicago.edu/tutorials/ssh_github_cluster.html

## Software

Software environments: https://cluster-policy.ds.uchicago.edu/using-the-cluster/environments/

Containers:
- Docker **not allowed**
- Singularity/Podman may be used but are **not tested or supported** by DSI compute staff

## Storage

Reference: - https://cluster-policy.ds.uchicago.edu/using-the-cluster/storage-overview/

Shared storage overview:
- Home: `/home` (50 GB)
  - Personal configuration files; not for job data
- Project: `/project` (500 GB default; up to 10 TB)
  - Shared group data; general-purpose performance
- Scratch: `/scratch` and `/scratch2` (50 GB each)
  - Temporary job data; clean regularly
- Node-local storage:
  - https://cluster-policy.ds.uchicago.edu/using-the-cluster/node-local-storage/
  - Created at `/local/scratch/<CNetID>_<JOBID>`
  - Must be requested in session/job
  - Deleted after job completes (or fails)
- Check your [quota](https://cluster-policy.ds.uchicago.edu/using-the-cluster/checking-usage/)
  ```bash
  dsiquota
  ```

:::{tip}
Best practices:
- Store code in home
- Keep data in project
- Use scratch for jobs
- Check usage and clean up regularly
:::

**Copying data**

- `scp` / `rsync`: https://cluster-policy.ds.uchicago.edu/advanced-topics/rsync-scp/
- See: [Data Transfer tools and tutorials](data-transfer.md)

## Running jobs

- Login nodes are for editing and submitting jobs, **not** compute
- Job time limit: **12 hours**
- Job concurrency limit: **8**

## Allocations

Storage allocation policy: https://cluster-policy.ds.uchicago.edu/policies/general/#storage-allocation-policy

## Support

- Cluster status: https://cluster-policy.ds.uchicago.edu/using-the-cluster/cluster-status/
- Check usage: https://cluster-policy.ds.uchicago.edu/using-the-cluster/checking-usage/
- FAQ: https://cluster-policy.ds.uchicago.edu/faq/faq/
- Support page: https://cluster-policy.ds.uchicago.edu/contact/
- Email: techstaff@cs.uchicago.edu
