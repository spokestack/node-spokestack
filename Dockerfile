FROM node:14.16.0

WORKDIR /usr/src/app
COPY . /usr/src/app

EXPOSE 80
ENV PORT=80
ENV GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json

WORKDIR /usr/src/app/examples/with-next
CMD echo $GOOGLE_SPEECH_API_KEY > $GOOGLE_APPLICATION_CREDENTIALS ; exec npm start
