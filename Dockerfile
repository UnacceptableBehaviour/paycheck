#FROM alpine
FROM python:3.9-alpine

WORKDIR /

RUN apk update
RUN apk add nano git
# add libpq to support psychopg2
#RUN apk add --no-cache postgresql-libs
#RUN apk add postgresql-dev gcc python3-dev musl-dev 
RUN apk add --no-cache py3-pip

# Install Ruby and necessary dependencies
#RUN apk add --no-cache build-base ruby ruby-bundler ruby-dev ruby-irb ruby-rake ruby-io-console ruby-bigdecimal ruby-json libstdc++ tzdata postgresql-dev
#RUN echo 'export RUBYLIB=/mysql_python/scratch/_ruby_scripts' >> ~/.shrc

# Specify Ruby version
#RUN echo 'ruby 2.7.2' > .ruby-version   # looks liek using 3.1.0 not sure this does anything! 

WORKDIR /paycheck
COPY . .


# run like this so that the venv is activated when requirements are installed - all on same layer of container
RUN python3 -m venv venv2 && . venv2/bin/activate && pip install -r requirements.txt



EXPOSE 50030
ENTRYPOINT ["./docker-entrypoint.sh"]

# build
# cd repos
# git clone https://github.com/UnacceptableBehaviour/paycheck
# cd paycheck
# docker build . -t paycheck-container

# run with (network not quite right yet)
# docker run -e DATABASE_URL="postgresql://simon:@Simons-MBP:5432/cs50_recipes" \
# -e FLASK_ENV=development -e FLASK_APP=hello.py \
# --name dtk \
# --network=host \
# -p50030:50030 \
# --mount type=bind,source="/Users/simon/a_syllabus/lang/python/paycheck/scratch/scratch",target=/paycheck/scratch \
# --mount type=bind,source="/Users/simon/Desktop/supperclub/foodlab/_MENUS/_courses_components/y949_tracker_archive",target=/paycheck/scratch/archive \
# paycheck-container

# log into unstarted container
# docker run -it --entrypoint /bin/sh paycheck-container