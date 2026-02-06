# Data Transfer

You may need to move data to/from HPC; use the right tool for the size and type of transfer.

**Rule of thumb**
- Small or occasional transfers: **scp** / **sftp**
- Large transfers or repeated syncs: **rsync**
- Very large datasets or unreliable networks: **Globus**
- Convenient “network drive” access (RCC only): **Samba** (campus network/VPN required)

---

## `scp` (Secure Copy)

Use `scp` to copy files over SSH. Good for small-to-moderate transfers.

**Copy a local file to RCC (Midway3 example)**

```bash
scp path/to/local_file.txt <CNetID>@midway3.rcc.uchicago.edu:/home/<CNetID>/
```

**Copy a directory recursively to RCC**

```bash
scp -r path/to/local_folder <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/
```

**Copy a file from RCC to your laptop**

```bash
scp <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/results.csv .
```

:::{tip}
- Use scratch/project for big data, not `$HOME`
- If transferring many files, consider `rsync` or Globus
:::
---

## `sftp` (Secure File Transfer Protocol)

`sftp` is like an interactive file browser over SSH.

### Start an sftp session

```bash
sftp <CNetID>@midway3.rcc.uchicago.edu
```

Useful commands inside `sftp`:
```text
ls            # list remote files
lls           # list local files
cd DIR        # change remote directory
lcd DIR       # change local directory
get FILE      # download from remote
put FILE      # upload to remote
get -r DIR    # download directory
put -r DIR    # upload directory
bye           # exit
```

**Examples:**

Download a directory from remote to local:
```bash
sftp> cd /project/myproject
sftp> lcd ~/Downloads
sftp> get -r results
# Downloads the 'results' directory to ~/Downloads/results
```

Upload a directory from local to remote:
```bash
sftp> cd /project/myproject
sftp> lcd ~/Documents/mycode
sftp> put -r src
# Uploads the 'src' directory to /project/myproject/src
```

Tip: GUI clients like **FileZilla** also speak SFTP if you prefer point-and-click.

---

## `rsync` (fast syncing over SSH)

`rsync` is usually the best choice when:
- you are syncing directories repeatedly
- you have large trees of files
- you want resumable transfers

**Sync local → RCC**

```bash
rsync -avz --progress -e ssh local_folder/ <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/project_folder/
```

**Sync RCC → local**

```bash
rsync -avz --progress -e ssh <CNetID>@midway3.rcc.uchicago.edu:/scratch/midways3/<CNetID>/project_folder/ local_folder/
```

Common options:
- `-a` archive mode (preserves timestamps/permissions)
- `-v` verbose
- `-z` compress in transit
- `--progress` show progress
- `--delete` (careful!) make destination match source by deleting extra files

References:
- RCC rsync examples (in SSH docs): https://docs.rcc.uchicago.edu/ssh/main/
- DSI rsync/scp guide: https://cluster-policy.ds.uchicago.edu/advanced-topics/rsync-scp/

---

## Globus (recommended for big transfers)

Globus is the best choice for:
- very large datasets
- moving data between institutional systems (RCC ↔ lab server ↔ cloud VM endpoints, etc.)

RCC Globus docs:
- Transfer files with Globus: https://docs.rcc.uchicago.edu/globus/transfer-files/
- Access files / make your computer an endpoint: https://docs.rcc.uchicago.edu/globus/access-files/

How it works (conceptually):
- Globus uses “**Collections**” (endpoints) as sources/destinations
- RCC hosts managed collections for Midway2/Midway3
- You can install **Globus Connect Personal** to make your laptop a collection

:::{tip}
Use Globus for multi-GB or TB-scale transfers instead of scp/Samba.
:::

---

## Common mistakes (and how to avoid them)

- **Forgetting quotes around paths with spaces**
  ```bash
  scp "My Data/file.txt" midway3:/scratch/midways3/$USER/
  ```

- **Using the wrong trailing slash in rsync**
  - `src/ dest/` → copies *contents* of `src` into `dest`
  - `src dest/` → copies the *directory* `src` into `dest`
  ```bash
  # Copy contents (usually what you want)
  rsync -av src/ midway3:/scratch/midways3/$USER/project/

  # Copy the directory itself
  rsync -av src midway3:/scratch/midways3/$USER/project/
  ```

- **Accidentally copying large data into `$HOME`**
  - `$HOME` has a small quota and is not designed for job data
  - Use `/scratch` (RCC/DSI) or `/project` (DSI) instead

- **Trying to use scp for very large transfers**
  - scp does not resume well after interruptions
  - Use **rsync** or **Globus** for large datasets

---

## Optional: simplify commands with SSH config

You can define short host aliases in `~/.ssh/config` to avoid typing long hostnames.

Example `~/.ssh/config`:

```text
# RCC
Host midway3
    HostName midway3.rcc.uchicago.edu
    User YOUR_CNETID

# DSI
Host fe.ds*
  HostName fe01.ds.uchicago.edu
  IdentityFile PATH_TO_PRIVATE_KEY
  ForwardAgent yes
  User YOUR_CNETID

Host *.ds !fe.ds
  HostName %h.uchicago.edu
  IdentityFile PATH_TO_PRIVATE_KEY
  ForwardAgent yes
  User YOUR_CNETID
  ProxyJump fe.ds
```

After this, you can shorten commands:

```bash
# Instead of <CNetID>@midway3.rcc.uchicago.edu
ssh midway3

rsync -av data/ midway3:/scratch/midways3/$USER/data/

scp results.csv dsi:/scratch/$USER/
```

:::{tip}
You can add multiple `Host` entries (e.g., `midway3-gpu`, `midway3-login`) if useful.
:::


# `sshfs` (Local File SystemMount)

`sshfs` lets you mount a directory on an RCC system as a local folder on your computer using SSH. This allows you to browse, copy, and edit files without repeatedly running `scp` or `rsync`.

:::{warning}
Homebrew’s `sshfs` formula on macOS is effectively broken because macOS removed kernel-level FUSE support, and the formula hasn’t been updated to work around that. There are ways to install `sshfs` on macOS but it is unclear how well supported they are and will not be included here.
:::

## When to Use `sshfs`
- Browsing output files or logs
- Transferring small to moderate amounts of data
- Editing small text files interactively

**Not recommended** for large data transfers or performance‑intensive I/O.

## Requirements (Windows and Linux only)
- SSH access to RCC login nodes
- `sshfs` installed locally
  - Linux: system package manager
  - Windows: via WSL or FUSE-based tools

## Basic Usage

### Create a local mount point
```bash
mkdir ~/rcc_home
```

### Mount your RCC home directory
```bash
sshfs <CNetID>@midway3.rcc.uchicago.edu:/home/<CNetID> ~/rcc_home
```

Authenticate with your password and Duo when prompted.

### Unmount when finished
- Linux:
  ```bash
  fusermount -u ~/rcc_home
  ```

## Performance and Best Practices
- `sshfs` is much slower than native filesystem access
- Connect only to **login nodes**
- Avoid large directory trees and many small file operations
- Always unmount before closing your laptop or changing networks
- Use `rsync`, `scp`, or Globus for large transfers

:::{tip}
Use sshfs for convenience, not for throughput.
:::

## Summary
`sshfs` is a convenient tool for lightweight, interactive access to RCC files. Use it for convenience, not throughput.
