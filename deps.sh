#! /usr/bin/env bash

find $1 -name "*.php" -print -exec cat {} \; | awk -f ./get-uses.awk
