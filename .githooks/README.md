# Git hooks

To block Cursor `Co-authored-by` trailers on future commits:

```bash
git config core.hooksPath .githooks
```

On Windows (Git Bash), make the hook executable if needed:

```bash
chmod +x .githooks/prepare-commit-msg
```

History was cleaned with `scripts/strip-cursor-coauthor-msg.ps1` via `git filter-branch`.
