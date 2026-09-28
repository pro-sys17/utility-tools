# Contributing to UtilityHub

Thank you for your interest in contributing to UtilityHub!

## Code of Conduct
We are committed to providing a welcoming and inclusive environment for everyone. Please be respectful and constructive in all interactions.

## How to Contribute
1. **Find an issue** or propose a new tool using the issue template.
2. **Fork the repository** and create a feature branch (`git checkout -b feature/new-tool-name`).
3. Follow the [Adding a Tool Guide](docs/adding-a-tool.md).
4. Ensure all checks pass:
   ```bash
   npm test
   npm run typecheck
   npm run lint
   npm run build
   ```
5. Submit a pull request with a descriptive title and fill out the PR checklist.

## Development Rules
- **Local-first only:** Utilities must NOT transmit user files to servers unless fundamentally required and pre-approved.
- **Strict TypeScript:** No arbitrary `any` types.
- **Unit test coverage:** Add test coverage for any new parser, formatter, or calculation logic.
- **Semantic components:** Use shared design system components (`Button`, `Card`, `FileDropzone`, `Input`, `ToolShell`).
