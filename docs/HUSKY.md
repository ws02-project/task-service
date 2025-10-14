# Husky Pre-commit Hook

This project uses Husky and lint-staged to automatically format and lint code before each commit.

## What happens on commit?

When you run `git commit`, the following happens automatically:

1. **ESLint** runs on all staged `.ts` files and auto-fixes issues
2. **Prettier** formats all staged `.ts` files
3. **Prettier** also formats `.json`, `.md`, `.yml`, and `.yaml` files

## Configuration

- **Husky**: Configured in `.husky/pre-commit`
- **lint-staged**: Configured in `package.json` under `lint-staged`

## Skip pre-commit hook (not recommended)

If you absolutely need to skip the pre-commit hook:

```bash
git commit --no-verify -m "your message"
```

## Benefits

- ✅ Ensures code quality and consistency
- ✅ Catches linting errors before they reach the repository
- ✅ Automatic code formatting
- ✅ Prevents committing poorly formatted code
