#!/bin/bash
while true; do
    cat target.md | claude --allow-dangerously-skip-permissions
done
