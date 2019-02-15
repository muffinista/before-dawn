FROM ubuntu:latest

RUN apt-get update && \
  apt-get -y install \
    libgtkextra-dev \
    libgconf2-dev \
    libnss3 \
    libasound2 \
    libxtst-dev \
    libxss1 \
    libxss-dev \
    software-properties-common \
    build-essential \
    xvfb \
    curl \
    libgtk-3-0 \
    unzip

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -

RUN apt-get update && \
  apt-get -y install yarn nodejs

RUN mkdir -p /app
WORKDIR /app
COPY . /app

# we could run yarn to compile everything, but the
# test lib does that too so don't bother
RUN yarn

# docker build -t before-dawn . && docker run -it -v $PWD:/app before-dawn bash
# docker run -it before-dawn yarn test
# tail -f ~/.config/Electron/log.log