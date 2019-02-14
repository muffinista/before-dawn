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

    # \
    # libx11-dev \
    # icnsutils \
    # graphicsmagick \
    # libappindicator1

RUN mkdir -p /app
WORKDIR /app
COPY . /app

RUN yarn
