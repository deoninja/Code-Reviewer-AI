# Contributing to Code Reviewer AI

First off, thank you for considering contributing to Code Reviewer AI! It’s people like you that make the open source community such a great place.

Before getting started, please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/deoninja/Code-Reviewer-AI/issues/new/choose)! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

If you have a general question, feel free to [ask it](https://github.com/deoninja/Code-Reviewer-AI/discussions/new).

## Fork & create a branch

If this is something you think you can fix, then [fork Code Reviewer AI](https://github.com/deoninja/Code-Reviewer-AI/fork) and create a branch with a descriptive name.

A good branch name would be (where issue #38 is the ticket you're working on):

```bash
git checkout -b 38-add-awesome-new-feature
```

## Get the style right

Your code should follow the same style as the existing code in the project. We use [Prettier](https://prettier.io/) to format our code, so please make sure your code is formatted before submitting a pull request.

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with Code Reviewer AI's master branch:

```bash
git remote add upstream git@github.com:deoninja/Code-Reviewer-AI.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```bash
git checkout 38-add-awesome-new-feature
git rebase master
git push --force-with-lease origin 38-add-awesome-new-feature
```

Finally, go to GitHub and [make a Pull Request](https://github.com/deoninja/Code-Reviewer-AI/compare) :D

## Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing and merging, check out [this guide](https://www.atlassian.com/git/tutorials/merging-vs-rebasing).
