#!/bin/sh

pieces=$(ls /tmp/temp)
for piece in $pieces
do
    id=$(fcr cidnet piece import /tmp/temp/$piece | cut -d " " -f2)
    fcr cidnet serving serve $id 1 1
done