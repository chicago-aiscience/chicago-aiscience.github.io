# Appendix

(install-git-on-windows-macos-and-linux)=
## Install Git on Windows, macOS, and Linux

This workshop requires Git to be installed on your local machine. Follow the instructions below for your operating system.

---

### Windows (WSL)

**WSL** provides a full Linux environment on Windows and is recommended for this workshop.

**Prerequisites:**
- Windows 10 version 2004 or higher, or Windows 11
- Administrator access

**Installation steps:**

1. **Install WSL:**
   - Open PowerShell or Command Prompt **as Administrator**
   - Run:
     ```powershell
     wsl --install
     ```
   - Restart your computer when prompted

```{tip}
If you are having difficulty installing WSL please see the [complete Windows documentation](https://learn.microsoft.com/en-us/windows/wsl/install)
```

2. **After restart, set up your Linux distribution:**
   - A terminal window will open automatically
   - Create a username and password when prompted
   - This will be your Linux user account (separate from your Windows account)

3. **Install Git in WSL:**
   - Open your WSL terminal (Ubuntu, or your chosen distribution)
   - Update package lists:
     ```bash
     sudo apt update
     ```
   - Install Git:
     ```bash
     sudo apt install git
     ```

4. **Verify the installation:**
   ```bash
   git --version
   ```
   You should see a version number (e.g., `git version 2.43.0`).

5. **Configure Git** (see [Post-installation](#post-installation-all-platforms) section below)

**Accessing your Windows files from WSL:**
- Windows drives are mounted at `/mnt/` (e.g., `C:\` is `/mnt/c/`)
- Your Windows user directory: `/mnt/c/Users/YourUsername/`
- You can navigate between Windows and Linux file systems from within WSL

**Opening WSL:**
- Type `wsl` in Windows Start menu, or
- Type `ubuntu` (or your distribution name) in Start menu, or
- Open from VS Code: File → Open Folder → Select a folder → Choose "Open in WSL"

---

### macOS

#### Option 1: Install via Xcode Command Line Tools (simplest)

1. Open **Terminal** (Applications → Utilities → Terminal).

2. Run:
   ```bash
   git --version
   ```

3. If Git is not installed, macOS will prompt you to install the **Command Line Developer Tools**.
   - Click **Install** and follow the prompts.

4. After installation completes, verify:
   ```bash
   git --version
   ```

#### Option 2: Install using Homebrew (recommended for developers)

If you already use Homebrew:

1. Install Git:
   ```bash
   brew install git
   ```

2. Verify the installation:
   ```bash
   git --version
   ```

---

### Linux

#### Option 1: Installing Git on **Ubuntu / Debian**

1.  Open a terminal.

2.  Update your package index:

    ``` bash
    sudo apt update
    ```

3.  Install Git:

    ``` bash
    sudo apt install git
    ```

4.  Verify the installation:

    ``` bash
    git --version
    ```

    You should see a version number (for example, `git version 2.43.0`).

---

#### Option 2: Installing Git on **Fedora / RHEL / Rocky / AlmaLinux**

1.  Open a terminal.

2.  Install Git:

    ``` bash
    sudo dnf install git
    ```

3.  Verify the installation:

    ``` bash
    git --version
    ```

---

#### Option 3: Installing Git on **Arch Linux / Manjaro**

1.  Open a terminal.

2.  Install Git:

    ``` bash
    sudo pacman -S git
    ```

3.  Verify the installation:

    ``` bash
    git --version
    ```

---

#### Option 4: Installing Git on **openSUSE**

1.  Open a terminal.

2.  Install Git:

    ``` bash
    sudo zypper install git
    ```

3.  Verify the installation:

    ``` bash
    git --version
    ```

---

(post-installation-all-platforms)=
### D. Post-installation (All Platforms)

After installing Git, configure your name and email (required for commits):

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

You can confirm your settings with:
```bash
git config --global --list
```

---

### E. Troubleshooting

- If `git --version` does not work:
  - Restart your terminal and try again.
  - On Windows, ensure you are using **WSL**.
  - If using WSL, make sure you're running commands in the WSL terminal, not PowerShell or Command Prompt.
- If problems persist, see:
  https://git-scm.com/book/en/v2/Getting-Started-Installing-Git

**WSL-specific troubleshooting:**
- If `wsl --install` fails, you may need to enable WSL features manually:
  1. Open "Turn Windows features on or off"
  2. Enable "Windows Subsystem for Linux" and "Virtual Machine Platform"
  3. Restart and try `wsl --install` again
- If you can't access Windows files from WSL, check that you're using the correct path format (`/mnt/c/` instead of `C:\`)
- For more WSL help, see: https://learn.microsoft.com/en-us/windows/wsl/

---

(configure-ssh-authentication-github)=
## Configure SSH Authentication with GitHub

This section shows how to create and configure an SSH key so you can push commits from your local machine to GitHub.

---

### Step 1. Install and/or enable SSH on your laptop

#### Windows (WSL)

WSL provides a Linux-like environment that was installed in the section ["Installing Git on **Windows**"](./workshop-github-actions-appendix.md#windows-wsl)

**Open your WSL distro (e.g., Ubuntu)**, then:

```bash
sudo apt update
sudo apt install git openssh-client
```

#### macOS

Most macOS systems include Git and SSH via Apple’s command line tools.

Verify:

```bash
git --version
ssh -V
```

If needed:

```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install git openssh-client
```

### Step. 2 Generate an SSH key

#### Create the key

In a terminal, run the following command to create the key:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- Press **Enter** to accept the default file location
- Optionally set a passphrase

```{important} SSH keys on Windows
Because we are running Git inside WSL, generate your SSH keys **inside WSL**.

Windows and WSL have separate SSH environments, so keys created in PowerShell won’t automatically be available inside WSL.

To launch WSL:

- Type `wsl` in Windows Start menu, or
- Type `ubuntu` (or your distribution name) in Start menu
```

#### Set the key's permissions

Set secure file permissions on your private key. SSH requires strict permissions on your key files and .ssh directory. Run the following commands:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

What these do:
- `700 ~/.ssh` → Only you can access your SSH directory
- `600 id_ed25519` → Private key is readable only by you
- `644 id_ed25519.pub` → Public key can be read but not modified by others

:::{warning}
If permissions are too open, SSH will refuse to use the key and display an error such as:

```bash
WARNING: UNPROTECTED PRIVATE KEY FILE!
Setting these permissions ensures SSH works correctly and securely.
```

:::

### Step. 3 Start the SSH agent and add your key

Run the following commands to start the SSH agent process and then add your key to the process so you can authenticate with SSH.

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Step. 4 Add your public key to GitHub

Copy your public key content by running the following command:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the key content from the output of the command, it should look something like:

`ssh-ed25519 AAAAAAAAAAfsjkldfaieaflkfnc4598035jnsdfksdlcnswef03248slffjklsfjklsd90 your_email@example.com`


Then in GitHub:

1. Go to **GitHub → Settings**
2. Click **SSH and GPG keys**
3. Click **New SSH key**
4. Paste the key
5. Click **Add SSH key**

### Step. 5 Test your SSH connection

```bash
ssh -T git@github.com
```

Expected output looks like:

```
Hi USERNAME! You've successfully authenticated...
```

```{tip}
- First-time SSH connection prompts you to trust GitHub’s host key: type **yes**
```

### Step. 6 Make sure your repo remote uses SSH (optional)

When cloning, use the SSH URL:

```bash
git clone git@github.com:USERNAME/REPO.git
```

If you already cloned with HTTPS, switch the `origin` remote:

```bash
git remote -v
git remote set-url origin git@github.com:USERNAME/REPO.git
git remote -v
```
