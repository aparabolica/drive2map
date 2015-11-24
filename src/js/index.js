(function(_, angular, L, undefined) {

  var app = angular.module('drive2map', [
    'ui.router'
  ]);

  app.config([
    '$stateProvider',
    '$urlRouterProvider',
    '$locationProvider',
    '$httpProvider',
    function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

      $locationProvider.html5Mode({
        enabled: false,
        requireBase: false
      });
      $locationProvider.hashPrefix('!');

      $stateProvider
      .state('home', {
        url: '/',
        controller: [
          '$scope',
          '$state',
          function($scope, $state) {
            $scope.driveId = '';
            $scope.loadDrive = function() {
              $state.go('home.map', { driveId: $scope.driveId });
            };
            $scope.$on('$stateChangeSuccess', function(ev, toState) {
              if(toState.name == 'home.map') {
                $scope.isMap = true;
              }
            });
          }
        ],
      })
      .state('home.map', {
        url: ':driveId/',
        template: '<map id="map" markers="parsed = (data | parseDrive)"></map><list items="parsed"></list>',
        controller: [
          '$scope',
          'Data',
          function($scope, Data) {
            $scope.search = '';
            $scope.data = Data.data;
          }
        ],
        resolve: {
          Data: [
            '$stateParams',
            'd2mService',
            function($stateParams, Service) {
              return Service.get($stateParams.driveId);
            }
          ]
        }
      });

      /*
      * Trailing slash rule
      */
      $urlRouterProvider.rule(function($injector, $location) {
      	var path = $location.path(),
      	search = $location.search(),
      	params;

      	// check to see if the path already ends in '/'
      	if (path[path.length - 1] === '/') {
      		return;
      	}

      	// If there was no search string / query params, return with a `/`
      	if (Object.keys(search).length === 0) {
      		return path + '/';
      	}

      	// Otherwise build the search string and return a `/?` prefix
      	params = [];
      	angular.forEach(search, function(v, k){
      		params.push(k + '=' + v);
      	});

      	return path + '/?' + params.join('&');
      });

    }
  ]);

  app.factory('d2mService', [
    '$http',
    function($http) {
      return {
        get: function(id) {
          return $http.get('https://spreadsheets.google.com/feeds/list/' + id + '/od6/public/values?alt=json');
        }
      }
    }
  ]);

  app.filter('parseDrive', [
    function() {
      return _.memoize(function(input) {

    		var parsed = [];

        if(typeof input == 'object' && input.feed) {

          var entries = input.feed.entry;
      		var gdocsBase = 'gsx$';

      		entries.forEach(function(entry) {

            var item = {};

            Object.keys(entry).forEach(function(key) {
              if (key.indexOf('gsx$') !== -1) {
                item[key.replace('gsx$', '')] = entry[key]['$t'];
              }
            });

            if (item.lat && item.lon) parsed.push(item);

          });

        }

        return parsed;

      }, function() {
        return JSON.stringify(arguments);
      });
    }
  ]);

  app.directive('list', [
    function() {
      return {
        restrict: 'E',
        templateUrl: 'list.html',
        scope: {
          'items': '='
        }
      }
    }
  ]);

  app.directive('map', [
    function() {
      return {
        restrict: 'E',
        scope: {
          'markers': '='
        },
        link: function(scope, element, attrs) {

          angular.element(element)
            .append('<div id="' + attrs.id + '"></div>')
            .attr('id', '');

          var map = L.map(attrs.id, {
            center: [0,0],
            zoom: 2,
            maxZoom: 18
          });

          L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          	maxZoom: 18
          }).addTo(map);

          var markerLayer = L.markerClusterGroup({
            zIndex: 100,
            maxClusterRadius: 40,
            polygonOptions: {
              fillColor: '#000',
              color: '#000',
              opacity: .3,
              weight: 2
            },
            spiderLegPolylineOptions: {
              weight: 1,
              color: '#222',
              opacity: 0.4
            }
          });

          markerLayer.addTo(map);

          function getPopup(item) {
            var table = '<table><tbody>';
            for(key in item) {
              if(key.indexOf('$') != 0 && key !== 'lat' && key !== 'lon')
                table += '<tr><th>' + key + '</th><td>' + item[key] + '</td></tr>';
            }
            table += '</tbody></table>';
            return table;
          };

          var markers = [];

          scope.$watch('markers', _.debounce(function(data) {

            markers.forEach(function(marker) {
              markerLayer.removeLayer(marker);
            });

            markers = [];

            data.forEach(function(item) {

              var marker = L.marker([item.lat,item.lon]);

              marker
                .bindPopup(getPopup(item))
                .addTo(markerLayer);

              markers.push(marker);

            });

            map.fitBounds(markerLayer.getBounds());

          }, 300), true);

        }
      }
    }

  ]);

  angular.element(document).ready(function() {
    angular.bootstrap(document, ['drive2map']);
  });

})(window._, window.angular, window.L);
