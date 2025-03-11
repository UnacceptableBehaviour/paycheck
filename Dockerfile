#FROM alpine
FROM python:3.9-alpine

WORKDIR /

RUN apk update
RUN apk add nano git
RUN apk add --no-cache py3-pip

WORKDIR /paycheck
COPY . .

# run like this so that the venv is activated when requirements are installed - all on same layer of container
RUN python3 -m venv venv2 && . venv2/bin/activate && pip install -r requirements.txt

EXPOSE 50030
ENTRYPOINT ["./docker-entrypoint.sh"]

# This file is called from the compose file

# build by hand
# cd repos
# git clone https://github.com/UnacceptableBehaviour/paycheck
# cd paycheck
# docker build . -t paycheck-container

# log into unstarted container
# docker run -it --entrypoint /bin/sh paycheck-container