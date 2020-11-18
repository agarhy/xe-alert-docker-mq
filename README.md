# xe-alert-docker-mq
## Setup steps
1. Clone the app from github repository
2. Install NPM packages 
3. Build the docker image
4. Create .env from .sample.env file 
5. Update .env values
6. Update each MQ service file config inside directory “app/services/..”

## Run the container Locally
1. Set the Worker type in the .env file
2. Run $ docker-compos up

## Run the container on IronWroker 
1. Set the Worker type & MQ platform in the .env file 
2. Deploy the container following the previous Article steps 
