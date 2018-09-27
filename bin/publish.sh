#!/usr/bin/env bash

set -e

npm config set git-tag-version true
npm version from-git
npm run prepublish
npm publish
git push origin master
