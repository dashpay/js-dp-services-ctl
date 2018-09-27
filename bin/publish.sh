#!/usr/bin/env bash

set -e

npm run prepublish
npm publish
git push origin master
