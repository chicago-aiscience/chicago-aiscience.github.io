# Lessons Summary

**Lesson 1: GitHub Actions and reproducible science**
You built a mental model for GitHub Actions and explored how CI/CD concepts apply to scientific code. By reviewing a complete example, you learned how workflows can connect code changes to automated execution and reproducible results.

**Lesson 2: Defining and running workflows**
You moved from concepts to practice by creating and running your own GitHub Actions workflow. You defined workflow triggers, permissions, and jobs, and added automated linting, formatting, and versioning to a real repository.

**Lesson 3: Job dependencies and releases**
You introduced sequential execution using job dependencies and conditionals, and added a release step to freeze the code at a specific version. This tied versioned code to GitHub releases, providing a reproducible, citable reference for results.

**Lesson 4 (Bonus): Matrix execution and artifacts**
You extended the workflow to run tests across multiple environments using matrix and to share files between jobs using artifacts. These patterns showed how workflows can capture not just code, but also execution outputs such as plots or reports.

Together, these lessons demonstrate how GitHub Actions can support reproducible science by automating execution and tying results to versioned code. The goal is to leave with practical patterns you can reuse, not just syntax to memorize.

# Key takeaways

- GitHub Actions workflows provide a practical way to automate common tasks (linting, testing, versioning, releasing) in scientific codebases.
- A workflow defines when automation runs, jobs define what runs, and steps define how it runs.
    - Workflows are made up of jobs, jobs are made up of steps, and steps run either commands or reusable actions.
- A workflow is a YAML file that defines *when* automation runs and *what* steps are executed.
- Job dependencies and conditional execution allow you to control when tasks run and prevent incomplete or invalid releases.
- Versioning and releases provide a clear way to tie specific states of the codebase to results used in publications.
- **Reproducible releases turn automation into a stable reference point, linking code, environment, and results so analyses can be rerun and cited.**

# References

***Linked in this workshop***

- **About code scanning**
    [https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)
    Overview of GitHub’s code scanning feature and how security analysis is integrated into workflows.

- **About releases**
    [https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
    Explains GitHub releases and how they are used to package and distribute specific versions of a repository.

- **Billing for GitHub Actions**
    [https://docs.github.com/en/billing/concepts/product-billing/github-actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
    Describes how GitHub Actions usage is billed and what limits apply to different repository types.

- **Events that trigger workflows**
    [https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
    Lists the events (such as `push`, `pull_request`, and `workflow_dispatch`) that can start a workflow.

- **Git basics – tagging**
    [https://git-scm.com/book/en/v2/Git-Basics-Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
    Explains Git tags and how they are used to mark specific points in a repository’s history.

- **GitHub-hosted runners**
    [https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)
    Describes the virtual machines provided by GitHub to run workflows and the environments they support.

- **GitHub Pages**
    [https://docs.github.com/en/pages](https://docs.github.com/en/pages)
    Documentation for publishing static sites directly from a GitHub repository.

- **HEP Software Foundation (HSF) CI/CD with GitHub Actions – Understanding YAML**
    [https://hsf-training.github.io/hsf-training-cicd-github/04-understanding-yaml/](https://hsf-training.github.io/hsf-training-cicd-github/04-understanding-yaml/)
    Introduces YAML syntax and structure in the context of CI/CD workflows.

- **HEP Software Foundation (HSF) CI/CD with GitHub Actions – Understanding YAML and CI**
    [https://hsf-training.github.io/hsf-training-cicd-github/05-understanding-yaml-and-ci/](https://hsf-training.github.io/hsf-training-cicd-github/05-understanding-yaml-and-ci/)
    Builds on YAML basics and connects them to continuous integration concepts using GitHub Actions.

- **Managing personal access tokens (PATs)**
    [https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
    Explains how to create and manage personal access tokens for authentication in GitHub workflows.

- **Using secrets in GitHub Actions**
    [https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
    Describes how to store and use sensitive values securely in GitHub Actions workflows.

- **Using a matrix strategy**
    [https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
    Explains how to run the same job across multiple configurations, such as different Python versions.

***Further reading***

- **Docker Build and Push GitHub Action**
    [https://github.com/docker/build-push-action](https://github.com/docker/build-push-action)
    Reference documentation for building and publishing Docker images within GitHub Actions workflows.

- **GitHub Actions documentation (overview)**
    [https://docs.github.com/actions](https://docs.github.com/actions)
    The main entry point for GitHub Actions documentation, covering workflows, jobs, and actions.

- **GitHub Actions permissions and `GITHUB_TOKEN`**
    [https://docs.github.com/en/actions/security-guides/automatic-token-authentication](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
    Explains how permissions are scoped for workflows and how the `GITHUB_TOKEN` is used securely.

- **GitHub Packages and GitHub Container Registry (GHCR)**
    [https://docs.github.com/packages](https://docs.github.com/packages)
    Documentation for publishing and managing packages and container images on GitHub.

- **Reusable workflows in GitHub Actions**
    https://docs.github.com/actions/using-workflows/reusing-workflows
    Describes how to create workflows that can be called by other workflows to reduce duplication.

- **`pyproject.toml` specification (PEP 621)**
    [https://peps.python.org/pep-0621/](https://peps.python.org/pep-0621/)
    Defines standardized project metadata used by modern Python tooling.

- **The Carpentries**
    [https://carpentries.org/](https://carpentries.org/)
    Guidance on evidence-based teaching practices and lesson design used throughout the workshop.

- **`uv` Python package manager**
    [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)
    Documentation for the dependency and version management tool used in the workshop.