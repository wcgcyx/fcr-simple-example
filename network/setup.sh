#!/bin/bash

USER_PORT=9424
BROKER1_PORT=9425
BROKER2_PORT=9426
PROVIDER1_PORT=9427
PROVIDER2_PORT=9428
USER_TOKEN="./fcr-user/token"
BROKER1_TOKEN="./fcr-broker1/token"
BROKER2_TOKEN="./fcr-broker2/token"
PROVIDER1_TOKEN="./fcr-provider1/token"
PROVIDER2_TOKEN="./fcr-provider2/token"

# Setup wallet
key=$(./binary/fcr -a $USER_TOKEN -p $USER_PORT wallet generate 1)
./binary/fcr -a $USER_TOKEN -p $USER_PORT wallet set 1 1 $key
key=$(./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT wallet generate 1)
./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT wallet set 1 1 $key
key=$(./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT wallet generate 1)
./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT wallet set 1 1 $key
key=$(./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT wallet generate 1)
./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT wallet set 1 1 $key
key=$(./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT wallet generate 1)
./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT wallet set 1 1 $key

# Connect network
id=$(./binary/fcr -a $USER_TOKEN -p $USER_PORT system addr | cut -d "/" -f7)
port=$(./binary/fcr -a $USER_TOKEN -p $USER_PORT system addr | cut -d "/" -f5)
addr="/ip4/127.0.0.1/tcp/$port/p2p/$id"
./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT system connect $addr
./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT system connect $addr
./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT system connect $addr
./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT system connect $addr
./binary/fcr -a $USER_TOKEN -p $USER_PORT system publish
./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT system publish
./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT system publish
./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT system publish
./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT system publish

# Set policy
./binary/fcr -a $USER_TOKEN -p $USER_PORT paynet policy settle set 1 default 1000h
./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet policy settle set 1 default 1000h
./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet policy settle set 1 default 1000h
./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT paynet policy settle set 1 default 1000h
./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT paynet policy settle set 1 default 1000h
./binary/fcr -a $USER_TOKEN -p $USER_PORT paynet policy reserve set 1 default -1
./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet policy reserve set 1 default -1
./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet policy reserve set 1 default -1
./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT paynet policy reserve set 1 default -1
./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT paynet policy reserve set 1 default -1

# Create payment channels
pvd1=$(./binary/fcr -a $PROVIDER1_TOKEN -p $PROVIDER1_PORT wallet get 1 | cut -d " " -f1)
pvd2=$(./binary/fcr -a $PROVIDER2_TOKEN -p $PROVIDER2_PORT wallet get 1 | cut -d " " -f1)
broker1=$(./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT wallet get 1 | cut -d " " -f1)
broker2=$(./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT wallet get 1 | cut -d " " -f1)
offer=$(./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet paych query 1 $pvd1 | tail -1 | cut -d " " -f3)
chAddr=$(./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet serving serve 1 $pvd1 $chAddr 1 100
offer=$(./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet paych query 1 $pvd2 | tail -1 | cut -d " " -f3)
chAddr=$(./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
./binary/fcr -a $BROKER1_TOKEN -p $BROKER1_PORT paynet serving serve 1 $pvd2 $chAddr 1 100
offer=$(./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet paych query 1 $pvd1 | tail -1 | cut -d " " -f3)
chAddr=$(./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet serving serve 1 $pvd1 $chAddr 1 100
offer=$(./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet paych query 1 $pvd2 | tail -1 | cut -d " " -f3)
chAddr=$(./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet paych create $offer 1000000000000000000 | head -2 | tail -1)
./binary/fcr -a $BROKER2_TOKEN -p $BROKER2_PORT paynet serving serve 1 $pvd2 $chAddr 1 100
offer=$(./binary/fcr -a $USER_TOKEN -p $USER_PORT paynet paych query 1 $broker1 | tail -1 | cut -d " " -f3)
./binary/fcr -a $USER_TOKEN -p $USER_PORT paynet paych create $offer 500000000000000000 | tail -1
offer=$(./binary/fcr -a $USER_TOKEN -p $USER_PORT paynet paych query 1 $broker2 | tail -1 | cut -d " " -f3)
./binary/fcr -a $USER_TOKEN -p $USER_PORT paynet paych create $offer 250000000000000000 | tail -1
