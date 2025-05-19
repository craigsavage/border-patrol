# Contributing to Border Patrol

Thank you for your interest in contributing to Border Patrol! This project is a free and open-source Chrome extension, and contributions from the community are incredibly valuable and help make it a better tool for everyone.

By contributing, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md) and that your contributions will be licensed under the project's [Apache-2.0 License](https://github.com/craigsavage/border-patrol/blob/main/LICENSE).

Please take a moment to review these guidelines before submitting bug reports, feature requests, or pull requests.

## 🤝 How to Contribute

There are several ways you can contribute to the Border Patrol project:

### 🐛 Reporting Bugs

If you encounter a bug or unexpected behavior, please help us by submitting a clear and concise issue in the [GitHub repository Issues page](https://github.com/craigsavage/border-patrol/issues).

When reporting a bug, please include as much detail as possible, such as:

- A clear and concise description of the bug.
- Detailed steps to reproduce the behavior.
- The expected behavior.
- The actual behavior.
- Screenshots or screen recordings illustrating the issue.
- Your browser version (e.g., Chrome 125.0) and operating system.
- The version of Border Patrol you are using (if applicable. Displays on the extension managemnet page: `chrome://extensions/`).
- The URL of the page where the bug occurred (if it's publicly accessible).

### ✨ Suggesting Enhancements

Have an idea for a new feature, an improvement to existing functionality, or a better way to do something? We'd love to hear your suggestions!

Please submit your enhancement suggestion as an issue in the [GitHub repository Issues page](https://github.com/craigsavage/border-patrol/issues).

When suggesting an enhancement, please include:

- A clear and concise description of the proposed enhancement.
- Explain the problem it solves or the value it adds to the extension.
- Describe how the enhancement would work from a user's perspective.
- (Optional) Any technical considerations or ideas you have for implementation.

### 💻 Code Contributions

Code contributions are very welcome! If you'd like to contribute code, please follow these steps:

1.  **Fork the Repository:** Fork the [Border Patrol repository](https://github.com/craigsavage/border-patrol) to your personal GitHub account.
2.  **Clone Your Fork:** Clone your forked repository to your local machine.
    ```bash
    git clone https://github.com/YOUR_GITHUB_USERNAME/border-patrol.git
    cd border-patrol
    ```
    Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.
3.  **Set Up Upstream:** Add the original repository as an upstream remote to keep your fork updated.
    ```bash
    git remote add upstream https://github.com/craigsavage/border-patrol.git
    ```
4.  **Sync with Upstream:** Before starting work, sync your `dev` branch with the latest changes from the main repository's `dev` branch.
    ```bash
    git fetch upstream
    git checkout dev
    git merge upstream/dev
    ```
5.  **Create a New Branch:** Create a new branch for your contribution based on the `dev` branch. Use a descriptive name related to your work.
    ```bash
    git checkout -b your-contribution-branch-name dev
    ```
6.  **Set up the Development Environment:**
    - Open Google Chrome.
    - Go to `chrome://extensions/`.
    - Enable "Developer mode" using the toggle switch in the top right.
    - Click the "Load unpackaged" button in the top left.
    - Select the root directory of your cloned Border Patrol repository on your local machine.
    - The extension should now load in Chrome. You can test your changes locally. Click the refresh icon under the extension on `chrome://extensions/` to reload it after making code modifications.
7.  **Implement Your Changes:** Write your code, fix the bug, or implement the feature in your new branch.
8.  **Test Your Changes:** Thoroughly test your changes in the Chrome development environment to ensure they work correctly, address the intended issue or feature, and do not introduce new bugs. Test across different websites if relevant.
9.  **Commit Your Changes:** Commit your changes with clear, descriptive commit messages. Aim for concise summaries in the first line and more detail in the body if needed.
    ```bash
    git add .
    git commit -m "feat: Briefly describe your feature or fix"
    ```
10. **Push Your Branch:** Push your branch to your fork on GitHub.
    ```bash
    git push origin your-contribution-branch-name
    ```
11. **Open a Pull Request (PR):** Go to the original [Border Patrol repository](https://github.com/craigsavage/border-patrol) on GitHub. You should see a prompt to compare & create a pull request from your new branch.
    - **Ensure the pull request is targeting the `dev` branch** of the main repository.
    - Provide a clear title and description for your pull request, explaining the changes you've made. Reference any related issues by number (e.g., `Closes #42`, `Fixes #123`).

#### Code Style

Please try to follow the existing code style and patterns used within the repository to maintain consistency.

## ✨ Code of Conduct

This project is committed to providing a welcoming and inclusive environment for everyone. Please review our [Code of Conduct](CODE_OF_CONDUCT.md) to understand the expected behavior within this community. All participants are expected to abide by it.

## 📄 Licensing

By contributing to Border Patrol, you agree that your contributions will be licensed under the project's [Apache-2.0 License](https://github.com/craigsavage/border-patrol/blob/main/LICENSE).

---

Thank you again for considering contributing to Border Patrol! Your efforts are greatly appreciated.
