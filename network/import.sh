#!/bin/bash

PROVIDER1_PORT=9427
PROVIDER2_PORT=9428
PROVIDER1_TOKEN="./fcr-provider1/token"
PROVIDER2_TOKEN="./fcr-provider2/token"

for var in "$@"
do
    cid=$(./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT cidnet piece import $var | cut -d " " -f2)
    ./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT cidnet serving serve $cid 1 1
    cid=$(./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT cidnet piece import $var | cut -d " " -f2)
    ./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT cidnet serving serve $cid 1 1
done