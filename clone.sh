#! /usr/bin/env bash

git clone --depth 1 https://github.com/shopware/platform.git

npm run gen --target="$(pwd)/platform"
