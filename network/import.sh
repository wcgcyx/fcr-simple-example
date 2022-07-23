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
    docker exec $PROVIDER1 /scripts/import_video.sh
    docker exec $PROVIDER1 rm -rf /tmp/temp /tmp/temp.mp4
    # Provider 2
    docker cp $var $PROVIDER2:/tmp/temp.mp4
    cid=$(docker exec $PROVIDER2 vidgen -c $VIDEO_CHUNK -o /tmp/temp gen /tmp/temp.mp4 | cut -d " " -f8)
    docker exec $PROVIDER2 /scripts/import_video.sh
    docker exec $PROVIDER2 rm -rf /tmp/temp /tmp/temp.mp4
    echo "Provider 1 and 2 imported and served video:" $cid
done