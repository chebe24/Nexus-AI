# SSH Troubleshooting Guide

**Nexus-AI Reference** - Advanced debugging for SSH authentication with GitHub

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Errors](#common-errors)
- [SSH Agent Issues](#ssh-agent-issues)
- [Key Configuration](#key-configuration)
- [Multiple GitHub Accounts](#multiple-github-accounts)
- [Corporate/Proxy Environments](#corporateproxy-environments)

## Quick Diagnostics

Run these commands to diagnose SSH issues:

```bash
# Test GitHub connection with verbose output
ssh -vT git@github.com

# List keys loaded in SSH agent
ssh-add -l

# Check SSH config
cat ~/.ssh/config

# Verify key permissions
ls -la ~/.ssh/
```

## Common Errors

### "Permission denied (publickey)"

**Cause:** GitHub can't find or verify your SSH key.

**Solutions:**

1. **Ensure SSH agent is running:**
   ```bash
   eval "$(ssh-agent -s)"
   ```

2. **Add your key to the agent:**
   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Verify key is added to GitHub:**
   - Go to [GitHub SSH Settings](https://github.com/settings/keys)
   - Compare with: `cat ~/.ssh/id_ed25519.pub`

4. **Check file permissions:**
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/id_ed25519
   chmod 644 ~/.ssh/id_ed25519.pub
   ```

### "Host key verification failed"

**Cause:** GitHub's host key isn't in your known_hosts.

**Solution:**
```bash
# Add GitHub's host key
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

### "Connection timed out"

**Cause:** Firewall blocking port 22.

**Solution:** Use SSH over HTTPS port:

```bash
# Test port 443
ssh -T -p 443 git@ssh.github.com

# If it works, add to ~/.ssh/config:
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
```

### "Agent admitted failure"

**Cause:** SSH agent not properly configured.

**Solution:**
```bash
# Start agent
eval "$(ssh-agent -s)"

# Add identity
ssh-add -K ~/.ssh/id_ed25519  # macOS with keychain
ssh-add ~/.ssh/id_ed25519      # Linux
```

## SSH Agent Issues

### macOS Keychain Integration

Add to `~/.ssh/config`:
```
Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
```

### Linux Persistent Agent

Add to `~/.bashrc` or `~/.zshrc`:
```bash
# Start SSH agent if not running
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/id_ed25519
fi
```

### Windows (Git Bash)

Add to `~/.bashrc`:
```bash
# Auto-start ssh-agent
env=~/.ssh/agent.env

agent_load_env () { test -f "$env" && . "$env" >| /dev/null ; }

agent_start () {
    (umask 077; ssh-agent >| "$env")
    . "$env" >| /dev/null ; 
}

agent_load_env

# agent_run_state: 0=agent running w/ key; 1=agent w/o key; 2=agent not running
agent_run_state=$(ssh-add -l >| /dev/null 2>&1; echo $?)

if [ ! "$SSH_AUTH_SOCK" ] || [ $agent_run_state = 2 ]; then
    agent_start
    ssh-add
elif [ "$SSH_AUTH_SOCK" ] && [ $agent_run_state = 1 ]; then
    ssh-add
fi

unset env
```

## Key Configuration

### Check Which Key Is Used

```bash
# Verbose SSH test shows which key is tried
ssh -vT git@github.com 2>&1 | grep "Offering"
```

### Specify Key in SSH Config

Create/edit `~/.ssh/config`:
```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

### Generate a New Key

```bash
# Ed25519 (recommended for Nexus-AI)
ssh-keygen -t ed25519 -C "chebert4@ebrschools.org"

# RSA (if Ed25519 not supported)
ssh-keygen -t rsa -b 4096 -C "chebert4@ebrschools.org"
```

## Multiple GitHub Accounts

For personal (`cary.hebert@gmail.com`) and work (`chebert4@ebrschools.org`) accounts:

### 1. Generate Separate Keys

```bash
ssh-keygen -t ed25519 -C "cary.hebert@gmail.com" -f ~/.ssh/id_ed25519_personal
ssh-keygen -t ed25519 -C "chebert4@ebrschools.org" -f ~/.ssh/id_ed25519_work
```

### 2. Configure SSH

Edit `~/.ssh/config`:
```
# Personal GitHub (dev account)
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes

# Work GitHub (EBRPSS account)
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

### 3. Use Custom Hosts in Remote URLs

```bash
# Nexus-AI (work project - use work account)
git remote set-url origin git@github.com-work:chebe24/Nexus-AI.git

# Personal projects
git remote set-url origin git@github.com-personal:username/repo.git
```

## Corporate/Proxy Environments

### Through HTTP Proxy

Add to `~/.ssh/config`:
```
Host github.com
    Hostname github.com
    User git
    ProxyCommand nc -X connect -x proxy.company.com:8080 %h %p
```

### Through SOCKS Proxy

```
Host github.com
    Hostname github.com
    User git
    ProxyCommand nc -X 5 -x socks-proxy.company.com:1080 %h %p
```

### Using corkscrew (HTTP CONNECT)

Install corkscrew, then:
```
Host github.com
    Hostname github.com
    User git
    ProxyCommand corkscrew proxy.company.com 8080 %h %p
```

## Debug Mode

For detailed debugging:

```bash
# Level 1 verbose
ssh -v git@github.com

# Level 2 verbose
ssh -vv git@github.com

# Level 3 verbose (most detailed)
ssh -vvv git@github.com
```

**Key things to look for:**
- "Offering public key" - which key is being tried
- "Server accepts key" - authentication succeeded
- "Permission denied" - key rejected

## Getting Help

If none of these solutions work:

1. Check [GitHub SSH Documentation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
2. Review Nexus-AI [git-workflow-guide.md](git-workflow-guide.md)
3. Contact: Cary Hebert (chebert4@ebrschools.org)

---

**Nexus-AI Note:** This is reference documentation archived from the `git-github-workflow` tutorial repository.
