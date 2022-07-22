#!/bin/bash

USER="fcr-example-user"
BROKER1="fcr-example-broker1"
BROKER2="fcr-example-broker2"
PROVIDER1="fcr-example-provider1"
PROVIDER2="fcr-example-provider2"

# Install vidgen binary
docker exec $PROVIDER1 sh -c "go build -o /go/bin/vidgen /vidgen/cmd/vidgen/*"
docker exec $PROVIDER2 sh -c "go build -o /go/bin/vidgen /vidgen/cmd/vidgen/*"

# Setup wallet
key=$(docker exec $USER fcr wallet generate 1)
docker exec $USER fcr wallet set 1 1 $key
key=$(docker exec $BROKER1 fcr wallet generate 1)
docker exec $BROKER1 fcr wallet set 1 1 $key
key=$(docker exec $BROKER2 fcr wallet generate 1)
docker exec $BROKER2 fcr wallet set 1 1 $key
key=$(docker exec $PROVIDER1 fcr wallet generate 1)
docker exec $PROVIDER1 fcr wallet set 1 1 $key
key=$(docker exec $PROVIDER2 fcr wallet generate 1)
docker exec $PROVIDER2 fcr wallet set 1 1 $key

# Connect network
addr=$(docker exec $USER fcr system addr | cut -d " " -f1 | cut -d "[" -f2)
docker exec $BROKER1 fcr system connect $addr
docker exec $BROKER2 fcr system connect $addr
docker exec $PROVIDER1 fcr system connect $addr
docker exec $PROVIDER2 fcr system connect $addr
docker exec $USER fcr system publish
docker exec $BROKER1 fcr system publish
docker exec $BROKER2 fcr system publish
docker exec $PROVIDER1 fcr system publish
docker exec $PROVIDER2 fcr system publish

# Set policy
docker exec $USER fcr paynet policy settle set 1 default 1000h
docker exec $BROKER1 fcr paynet policy settle set 1 default 1000h
docker exec $BROKER2 fcr paynet policy settle set 1 default 1000h
docker exec $PROVIDER1 fcr paynet policy settle set 1 default 1000h
docker exec $PROVIDER2 fcr paynet policy settle set 1 default 1000h
docker exec $USER fcr paynet policy reserve set 1 default -1
docker exec $BROKER1 fcr paynet policy reserve set 1 default -1
docker exec $BROKER2 fcr paynet policy reserve set 1 default -1
docker exec $PROVIDER1 fcr paynet policy reserve set 1 default -1
docker exec $PROVIDER2 fcr paynet policy reserve set 1 default -1

# Create payment channels
pvd1=$(docker exec $PROVIDER1 fcr wallet get 1 | cut -d " " -f1)
pvd2=$(docker exec $PROVIDER2 fcr wallet get 1 | cut -d " " -f1)
broker1=$(docker exec $BROKER1 fcr wallet get 1 | cut -d " " -f1)
broker2=$(docker exec $BROKER2 fcr wallet get 1 | cut -d " " -f1)
offer=$(docker exec $BROKER1 fcr paynet paych query 1 $pvd1 | tail -1 | cut -d " " -f3)
chAddr=$(docker exec $BROKER1 fcr paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
docker exec $BROKER1 fcr paynet serving serve 1 $pvd1 $chAddr 1 100
offer=$(docker exec $BROKER1 fcr paynet paych query 1 $pvd2 | tail -1 | cut -d " " -f3)
chAddr=$(docker exec $BROKER1 fcr paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
docker exec $BROKER1 fcr paynet serving serve 1 $pvd2 $chAddr 1 100
offer=$(docker exec $BROKER2 fcr paynet paych query 1 $pvd1 | tail -1 | cut -d " " -f3)
chAddr=$(docker exec $BROKER2 fcr paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
docker exec $BROKER2 fcr paynet serving serve 1 $pvd1 $chAddr 1 100
offer=$(docker exec $BROKER2 fcr paynet paych query 1 $pvd2 | tail -1 | cut -d " " -f3)
chAddr=$(docker exec $BROKER2 fcr paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
docker exec $BROKER2 fcr paynet serving serve 1 $pvd2 $chAddr 1 100
offer=$(docker exec $USER fcr paynet paych query 1 $broker1 | tail -1 | cut -d " " -f3)
docker exec $USER fcr paynet paych create $offer 500000000000000000 | tail -1
offer=$(docker exec $USER fcr paynet paych query 1 $broker2 | tail -1 | cut -d " " -f3)
docker exec $USER fcr paynet paych create $offer 250000000000000000 | tail -1
