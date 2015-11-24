# drive2map

Turn your Google Drive Spreadsheet into an interactive map.

## Dependencies

 - node v0.10.x
 - npm v2.6.x

## Installation

```sh
$ sudo npm install -g grunt-cli bower
$ git clone https://github.com/codigourbano/drive2map.git
$ cd drive2map
$ npm install && bower install
$ grunt build
```

## Running app

App files are located at `dist/`, which can be copied to an apache/nginx server.

For development run you can start a simple python server:

```sh
$ cd dist
$ python -m SimpleHTTPServer
```

Access http://localhost:8000

## [Github Pages](https://pages.github.com/) deploy

With a fork you can do an automatic deploy on [Github Pages](https://pages.github.com/):

```sh
$ grunt deploy
```

Access http://[usuario].github.io/drive2map/
