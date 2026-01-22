# Data Transfer

You may need to move data to/from HPC; use the right tool for the size and type of transfer.

**Rule of thumb**
- Small or occasional transfers: **scp** / **sftp**
- Large transfers or repeated syncs: **rsync**
- Very large datasets or unreliable networks: **Globus**
- Convenient “network drive” access (RCC only): **Samba** (campus network/VPN required)

---

## scp (Secure Copy)

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

## sftp (Secure File Transfer Protocol)

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

Tip: GUI clients like **FileZilla** also speak SFTP if you prefer point-and-click.

---

## rsync (fast syncing over SSH)

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

## Samba (RCC): Map RCC storage as a network drive (Windows)

RCC provides Samba access to mount your **home** and **project** directories as a network drive.

RCC Samba guide (authoritative):
- https://docs.rcc.uchicago.edu/samba/

Important notes:
- Works **only on campus network** or via **UChicago VPN**
- Use **Globus** for large transfers (Samba can be slow and impacts others)

**Windows 10/11: Map a network drive**

1. Connect to the **UChicago VPN** if off campus
2. Open **File Explorer**
3. Right-click **This PC** → **Map network drive**
4. Choose a drive letter (e.g., `R:`)
5. Enter the network path shown in RCC’s Samba guide (example format):
   - `\\<samba-server>\<share>`
6. Check **Reconnect at sign-in** (optional)
7. When prompted, authenticate with your UChicago credentials as instructed by RCC

If you’re unfamiliar with the Windows mapping UI, UChicago IT has a general walkthrough: https://uchicago.service-now.com/it?id=kb_article_view&sysparm_article=KB00015585

---

## Globus (recommended for big transfers)

Globus is the best choice for:
- very large datasets
- transfers that need to resume automatically
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
Host midway3
    HostName midway3.rcc.uchicago.edu
    User YOUR_CNETID

Host dsi
    HostName login.ds.uchicago.edu
    User YOUR_CNETID
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
