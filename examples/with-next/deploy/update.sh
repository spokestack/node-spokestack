#!/bin/bash

#----------------------------------------------------------------------------
# service upgrade script
# . build the docker image
# . push the image up to the aws ecr with the environment tag
# . bounce the service
#----------------------------------------------------------------------------

set -e

environment=$1
if [ -z "$environment" ]; then
    echo "usage: update.sh <environment>"
    exit 1
fi

ECR_TAG=507792887860.dkr.ecr.us-east-1.amazonaws.com/demo.spokestack.io:$environment

echo "updating $ECR_TAG"
docker build -t $ECR_TAG .
eval "$(aws ecr get-login | sed -e 's/-e none//g')"
docker push $ECR_TAG

exec $(dirname $0)/bounce.sh $environment
