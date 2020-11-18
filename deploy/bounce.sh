#!/bin/bash

#----------------------------------------------------------------------------
# service rolling restart script
# . tell ecs to force a new deployment, which causes it to perform a rolling
#   restart of the tasks/containers associated with the service
# . restarts are rolling, so that at most one instance is out of service,
#   and no client requests will fail as long as there is sufficient capacity
#   for the current load
# . if anything goes wrong, at most one instance will remain out of service
#   until an operator fixes the problem
#----------------------------------------------------------------------------

set -e

environment=$1
if [ -z "$environment" ]; then
    echo "usage: bounce.sh <environment>"
    exit 1
fi

CLUSTER=$environment-spoke-demo-node
SERVICE=$environment-spoke-demo-node

aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment
