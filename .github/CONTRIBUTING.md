# Contributing to spokestack.io

### tldr;

- Install dependencies with `npm run bootstrap`.
- Build with `npm run build`, or watch for changes and rebuild on change with `npm start`.
- Update docs by updating type definitions in code then running `npm run docs` to regenerate the README.

Each example has its own README with usage instructions.

**[Supported browsers](https://browserl.ist/?q=%3E0.35%25%2C+not+op_mini+all)**: (basically IE 11, modern desktop and mobile browsers)

Contributions are always welcome. Before contributing please [search the issue tracker](https://github.com/spokestack/node-spokestack/issues); your issue
may have already been discussed or fixed in `develop`. To contribute,
[fork](https://help.github.com/articles/fork-a-repo/) Spokestack, commit your changes,
& [send a pull request](https://help.github.com/articles/using-pull-requests/).

## Feature Requests

Feature requests should be submitted in the
[issue tracker](https://github.com/spokestack/node-spokestack/issues), with a description of
the expected behavior & use case, where they’ll remain closed until sufficient interest,
[e.g. :+1: reactions](https://help.github.com/articles/about-discussions-in-issues-and-pull-requests/),
has been [shown by the community](https://github.com/spokestack/node-spokestack/issues?q=label%3A%22votes+needed%22+sort%3Areactions-%2B1-desc).
Before submitting a request, please search for similar ones in the
[closed issues](https://github.com/spokestack/node-spokestack/issues?q=is%3Aissue+is%3Aclosed+label%3Afeature).

This convention is borrowed from [lodash](https://github.com/lodash/lodash). It helps keep the open issues list uncluttered.

## Pull Requests

For additions or bug fixes you should only need to modify files in `src/`. Include
updated unit tests in the `test` directory. Don’t worry about regenerating the built files.

## Editing documentation

Documentation is automatically generated using [typedoc](https://github.com/TypeStrong/typedoc). You only need to edit the appropriate types and comments in the source files.

Documentation from typedoc is written to the `/docs` folder, which is ignored in git. The custom script in `tasks/docs.js` then concatenates the files and makes them pretty for the README.md.

## Installation

[Fork the repo](https://help.github.com/en/github/getting-started-with-github/fork-a-repo), and [clone](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) to a directory of your choosing.

Then run `npm install` to install dependencies.

## Coding Guidelines

In addition to the following guidelines, please follow the conventions already
established in the code.

- **Spacing**:<br>
  Use two spaces for indentation. No tabs.

- **Naming**:<br>
  Keep variable & method names concise & descriptive.<br>
  Variable names `index`, `array`, & `iteratee` are preferable to
  `i`, `arr`, & `fn`.

- **Quotes**:<br>
  Single-quoted strings are preferred to double-quoted strings; however,
  please use a double-quoted string if the value contains a single-quote
  character to avoid unnecessary escaping.

- **Comments**:<br>
  Comments are kept to a minimum, but are encouraged to explain confusing bits of code.

- **Types**:<br>
  Spokestack is written in TypeScript and documentation is generated from the type annotations.
  Any code additions should be properly typed, with no use of `any`.

Guidelines are enforced using [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/):

```bash
$ npm run lint
```

Some things are fixable automatically.

```bash
$ npm run lint:fix
```

This script is run on commit, which means that the commit may need amending if any changes were made as a result of the commit.

Check the working directory is clean of all changes after committing.

## Commit message guidelines

Commit messages should follow [Conventional Commits Specification](https://www.conventionalcommits.org).

This is also enforced on commit using a commit message hook.

spokestack.io includes a helpful prompt for committing to guide you in the process of writing a valid commit message.

Run the following after staging files:

```bash
$ npm run commit
```
