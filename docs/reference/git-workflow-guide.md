# Git/GitHub Workflow Reference

**Purpose:** Quick reference for Nexus-AI Git operations  
**Source:** Archived from tutorial repository `git-github-workflow`

---

## GitHub Flow (Recommended for Nexus-AI)

Simple branching workflow for frequent deployments:

### Core Workflow

```bash
# 1. Create feature branch
git checkout -b feat/add-trilingual-vocab

# 2. Make changes and commit
git add src/vocab_generator.py
git commit -m "feat: Add trilingual vocabulary generator"

# 3. Push to GitHub
git push -u origin feat/add-trilingual-vocab

# 4. Open pull request on GitHub
# (Review → Merge → Delete branch)
```

### Nexus-AI Standard Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: Add new AI agent template`
- `fix: Resolve OCR encoding issue`
- `docs: Update installation guide`
- `refactor: Improve database query performance`
- `test: Add unit tests for RAG embeddings`

---

## SSH Setup (One-Time)

### Generate SSH Key

```bash
# Generate key (use your work email)
ssh-keygen -t ed25519 -C "chebert4@ebrschools.org"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519
```

### Add to GitHub

```bash
# Copy public key (macOS)
pbcopy < ~/.ssh/id_ed25519.pub
```

1. Go to [GitHub SSH Settings](https://github.com/settings/keys)
2. Click "New SSH key"
3. Paste and save

### Test Connection

```bash
ssh -T git@github.com
# Expected: "Hi chebe24! You've successfully authenticated..."
```

---

## Nexus-AI Remote Setup

```bash
# Navigate to project
cd ~/Projects/Nexus-AI

# Add GitHub remote (if not already set)
git remote add origin git@github.com:chebe24/Nexus-AI.git

# Verify
git remote -v
```

---

## Daily Workflow

### Pushing Changes

```bash
# Check status
git status

# Stage files
git add .

# Commit with message
git commit -m "feat: Add French verb conjugation module"

# Push to GitHub
git push
```

### Pulling Latest Changes

```bash
# Pull from main branch
git pull origin main

# Or pull with rebase (cleaner history)
git pull origin main --rebase
```

---

## Common Issues

See [ssh-troubleshooting.md](ssh-troubleshooting.md) for detailed SSH debugging.

### Quick Fixes

**Permission denied (publickey)**
```bash
ssh-add -l  # Check loaded keys
ssh-add ~/.ssh/id_ed25519  # Add if missing
```

**Remote origin already exists**
```bash
git remote remove origin
git remote add origin git@github.com:chebe24/Nexus-AI.git
```

**Push rejected (non-fast-forward)**
```bash
git pull origin main --rebase
git push
```

---

## Branch Management

### Create Branch

```bash
git checkout -b feat/new-feature
```

### Switch Branches

```bash
git checkout main
git checkout feat/other-feature
```

### Delete Branch

```bash
# Delete local branch
git branch -d feat/completed-feature

# Delete remote branch
git push origin --delete feat/completed-feature
```

---

## Nexus-AI Project Standards

### Branch Naming

- `feat/description` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions

### Commit Frequency

- Commit after each logical change
- Don't commit broken code to main
- Use feature branches for work-in-progress

### Before Pushing

```bash
# 1. Check what's changed
git status
git diff

# 2. Verify no sensitive data
cat .gitignore  # Ensure .env, credentials excluded

# 3. Run tests (if applicable)
# python -m pytest tests/

# 4. Push
git push
```

---

**Related Documentation:**
- [ssh-troubleshooting.md](ssh-troubleshooting.md) - Advanced SSH debugging
- [GitHub Flow](https://githubflow.github.io/) - Official documentation

**Nexus-AI Workflow Owner:** Cary Hebert (chebert4@ebrschools.org)
