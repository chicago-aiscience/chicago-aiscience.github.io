# Appendix

(install-git-on-windows-macos-and-linux)=
## Install Git on Windows, macOS, and Linux

This workshop requires Git to be installed on your local machine. Follow the instructions below for your operating system.

---

### A. Installing Git on **Windows**

#### Option 1: Install Git for Windows

1. Open a web browser and go to:
   https://git-scm.com/download/win

2. The installer (`Git-<version>-64-bit.exe`) should download automatically.
   If not, click **“Click here to download manually.”**

3. Run the installer and follow the setup wizard.
   - You can accept the **default options** for almost all steps.
   - When asked about the default editor, you may choose:
     - **Nano** (simplest), or
     - **VS Code** (recommended if you already use it).

4. When installation is complete, open **Git Bash** (installed with Git).

5. Verify the installation by running:
   ```bash
   git --version
   ```
   You should see a version number (e.g., `git version 2.44.0`).

---

#### Optional: Install WSL (Windows Subsystem for Linux)

**WSL** provides a full Linux environment on Windows and is an excellent alternative to Git Bash, especially if you're comfortable with Linux commands or plan to do more development work.

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

5. **Configure Git** (see [Post-installation](#d-post-installation-all-platforms) section below)

**Accessing your Windows files from WSL:**
- Windows drives are mounted at `/mnt/` (e.g., `C:\` is `/mnt/c/`)
- Your Windows user directory: `/mnt/c/Users/YourUsername/`
- You can navigate between Windows and Linux file systems seamlessly

**Opening WSL:**
- Type `wsl` in Windows Start menu, or
- Type `ubuntu` (or your distribution name) in Start menu, or
- Open from VS Code: File → Open Folder → Select a folder → Choose "Open in WSL"

##### Notes for Windows users
- **Git Bash** provides a Unix-like terminal and works well for this workshop.
- **WSL** (optional) provides a full Linux environment and is recommended if you prefer Linux commands or plan to do more development work.
- Both options work equally well for this workshop—choose based on your preference.
- Git will also be available from PowerShell and Command Prompt after installing Git for Windows.

---

### B. Installing Git on **macOS**

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

### C. Installing Git on **Linux**

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
  - On Windows, ensure you are using **Git Bash** or **WSL**.
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

(create-a-github-personal-access-token)=
## Create a GitHub Personal Access Token

This appendix walks through creating a token and storing it in your repository so GitHub Actions can authenticate when it needs to push commits/tags or create releases.

GitHub supports **fine-grained** tokens (recommended) and **classic** tokens.

---

### Option 1 (recommended): Fine-grained personal access token

1. Go to GitHub → **Settings**
2. Navigate to **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
3. Click **Generate new token**
4. Set:
   - **Token name**: something recognizable (e.g., `workshop-actions-release`)
   - **Expiration**: choose an expiration that covers the workshop (e.g., 7–30 days)
   - **Resource owner**: your GitHub account
   - **Repository access**: select **Only select repositories** and choose the workshop repo (or the repo you will use)
5. Under **Repository permissions**, set:
   - **Actions** → **Read and write** (Under "Access" next to the permission)
   - **Contents** → **Read and write** (Under "Access" next to the permission)
6. Click **Generate token**
7. Copy the token immediately and store it somewhere secure (you won’t be able to view it again).

---

### Option 2: Classic personal access token

1. Go to GitHub → **Settings**
2. Navigate to **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Set an **expiration**
5. Select scopes:
   - **`repo`** (required for committing/pushing, tags, and releases in private repos; also works for public repos)
   - **`workflow`** (required to **add/update workflow files** under `.github/workflows/`)
6. Click **Generate token**
7. Copy the token immediately and store it somewhere secure.

🧰 **When do you need the `workflow` scope?**

Only if the workflow (or a script run by the workflow) will **create or modify files inside `.github/workflows/`**. For this workshop’s core release flow (bump version, push tag, create release), `repo` is typically sufficient.

> Security note: Use the minimum permissions needed and set an expiration. Treat your PAT like a password.

References:
- Managing personal access tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
