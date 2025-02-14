#!/usr/bin/env zsh

# Make sure NAS mounted
# place this file in /Volumes/docker/paycheck-cloud
# chmod +x dockerClone-2-NAS-Setup.sh
# run it to upgdate the mysql_python repo


cd /Volumes/docker/paycheck-cloud/paycheck-cloud

# remove the old repo
rm -rf paycheck

# clone new one in place
git clone https://github.com/UnacceptableBehaviour/paycheck

cd paycheck


# update the docker-compose.yml in Project on NAS from docker-compose-NAS.yml IF NEEDED

# copy 'unmanaged' private config files over - from original repo
# none in this case
#mkdir scratch


# want _persistent_store to persist across rebuilds - so map it to a volume in compose file
#cd ..
#cp /any/necessary/support/files/to/container.txt ./_persistent_store

# This is now stored off container at: /Volumes/docker/paycheck-cloud/paycheck-cloud/_persistent_store
# and that is mapped in the container to
# ??
# shift pay cycle entries are retained in the _persistent_store when the conatiner is rebuilt

# that gets things ready for container manager to build paycheck container

