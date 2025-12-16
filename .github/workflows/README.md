# Task Service CI/CD

This workflow builds and pushes the Task Service Docker image to AWS ECR using OIDC authentication with **automatic semantic versioning** via Release Please.

## Semantic Versioning

This project uses [Release Please](https://github.com/googleapis/release-please) for automatic versioning based on [Conventional Commits](https://www.conventionalcommits.org/).

### How It Works

1. **Push commits** to `main` with conventional commit messages
2. **Release Please** automatically creates/updates a "Release PR"
3. **Merge the Release PR** when ready to release
4. **CI builds** the Docker image with the semantic version tag

### Commit Message Format

| Commit Message       | Version Bump  | Example                             |
| -------------------- | ------------- | ----------------------------------- |
| `fix: description`   | Patch (0.0.X) | `fix: resolve date parsing bug`     |
| `feat: description`  | Minor (0.X.0) | `feat: add task filtering`          |
| `feat!: description` | Major (X.0.0) | `feat!: change API response format` |
| `chore: description` | No release    | `chore: update dependencies`        |
| `docs: description`  | No release    | `docs: update README`               |

### Examples

```bash
# Bug fix → v0.1.0 → v0.1.1
git commit -m "fix: handle null values in task list"

# New feature → v0.1.1 → v0.2.0
git commit -m "feat: add task priority field"

# Breaking change → v0.2.0 → v1.0.0
git commit -m "feat!: rename status field to state"
```

## Configuration

1. **Add Repository Variable**:
   - Repository → Settings → Secrets and variables → Actions → Variables
   - Add variable: `AWS_ROLE_ARN` = `arn:aws:iam::158670175038:role/ecr-registry-github-actions-role`

2. **Enable Permissions**:
   - Settings → Actions → General
   - Workflow permissions: "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests: ✅

## What It Does

- ✅ Runs tests and linter
- ✅ Automatic semantic versioning (Release Please)
- ✅ Builds Docker image
- ✅ Security scanning with Trivy
- ✅ Pushes to ECR with semantic version tag
- ✅ Triggers deployment update to staging

## Image Tags

| Trigger                    | Tag Format            | Example               |
| -------------------------- | --------------------- | --------------------- |
| Release (merge Release PR) | `v{version}`          | `v0.2.0`              |
| Proto update               | `proto-{sha}`         | `proto-a1b2c3d4`      |
| PR / Dev build             | `dev-{sha}`           | `dev-a1b2c3d4`        |
| Latest                     | `task-service-latest` | `task-service-latest` |

## Release Workflow

```
1. Push commits with conventional messages
   ↓
2. Release Please creates "Release PR" (automatic)
   ↓
3. Review & merge Release PR when ready
   ↓
4. CI builds image with tag v0.2.0
   ↓
5. Deployment repo updated automatically
   ↓
6. ArgoCD deploys to staging
```

## Rollback

To rollback to a previous version:

1. Check deployment history: `deployments/k8s/.deployment-history/staging.yaml`
2. Update `values-staging.yaml` with previous version tag
3. Commit and push to trigger ArgoCD sync
