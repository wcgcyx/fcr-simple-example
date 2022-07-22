#!/bin/bash

# The size of the video chunk (in KB, for large video, consider a bigger chunk)
VIDEO_CHUNK=100
PROVIDER1="fcr-example-provider1"
PROVIDER2="fcr-example-provider2"

for var in "$@"
do
    # Provider 1
    docker cp $var $PROVIDER1:/tmp/temp.mp4
    cid=$(docker exec $PROVIDER1 vidgen -c $VIDEO_CHUNK -o /tmp/temp gen /tmp/temp.mp4 | cut -d " " -f8)
    pieces=$(docker exec $PROVIDER1 ls /tmp/temp)
    for piece in $pieces
    do
        id=$(docker exec $PROVIDER1 fcr cidnet piece import /tmp/temp/$piece | cut -d " " -f2)
        docker exec $PROVIDER1 fcr cidnet serving serve $id 1 1
    done
    docker exec $PROVIDER1 rm -rf /tmp/temp /tmp/temp.mp4
    # Provider 2
    docker cp $var $PROVIDER2:/tmp/temp.mp4
    cid=$(docker exec $PROVIDER2 vidgen -c $VIDEO_CHUNK -o /tmp/temp gen /tmp/temp.mp4 | cut -d " " -f8)
    pieces=$(docker exec $PROVIDER2 ls /tmp/temp)
    for piece in $pieces
    do
        id=$(docker exec $PROVIDER2 fcr cidnet piece import /tmp/temp/$piece | cut -d " " -f2)
        docker exec $PROVIDER2 fcr cidnet serving serve $id 1 1
    done
    docker exec $PROVIDER2 rm -rf /tmp/temp /tmp/temp.mp4
    echo "Provider 1 and 2 imported and served video:" $cid
done