FROM node:14.15.1

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

EXPOSE 80
ENV PORT=80
ENV GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json

RUN cd examples/with-next
CMD echo $GOOGLE_SPEECH_API_KEY > $GOOGLE_APPLICATION_CREDENTIALS ; exec npm start
