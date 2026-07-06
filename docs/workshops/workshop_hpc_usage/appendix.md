# Appendix

<a id="ssh-github"></a>
## Configuring SSH authentication with GitHub (on the cluster)

To `git clone`, `pull`, and `push` the workshop repository (and your own repos) **from the cluster**, GitHub needs to recognize the machine you're on. The cleanest way is an SSH key generated on the cluster and registered with your GitHub account. Once set up, Git operations to GitHub work without passwords or tokens.

> 🧰 — Don't confuse the two SSH keys in play:
> 1. **Laptop → cluster** — lets you log in to the cluster (covered in §3; DSI requires this).
> 2. **Cluster → GitHub** — what this appendix sets up, so the cluster can talk to GitHub.
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

> 🧰 — The agent lives only for your current session. If a later session prompts for the key, just re-run these two lines.

### 4. Copy your public key

Print the **public** key and copy the entire line (it begins with `ssh-ed25519`):

```bash
cat ~/.ssh/id_ed25519.pub
```

> ⚠️ — Only ever share the `.pub` (public) key. Never copy or send `id_ed25519` (the private key).

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

(That message is expected — GitHub doesn't give a shell.)

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

- **`Permission denied (publickey)`** — the key isn't loaded or isn't on GitHub. Re-run `ssh-add ~/.ssh/id_ed25519` (Step 3) and confirm the public key is listed under GitHub → Settings → SSH and GPG keys.
- **`Host key verification failed`** — you declined the fingerprint prompt in Step 6; run `ssh -T git@github.com` again and type `yes`.
- **Still prompted for a username/password on `git push`** — that repo's remote is still HTTPS; switch it with the `git remote set-url` command in Step 7.
- **Windows users** — generate the key inside **WSL**, not PowerShell; they keep separate SSH configurations. (This applies when setting up the laptop→cluster key, not on the cluster itself.)