angular.module("map-navigator", []).directive("mapNavigator", ["$timeout", function($timeout) {
    // longueur moyenne d'un koala: 72.8cm
    // #source S.Charron (voir avec lui en cas de conflit)
    return {
        transclude: true,
        scope: {
            'options': '&options',
            'zones': '&zones',
            'data': '&data',
            'highlight': '&highlight'
        },
        restrict: 'E',
        link: function($scope, element, attr) {
            $scope.init = function() {
                var opt = $.extend(true, {}, $scope.options());
                $scope.mapNavigator = new MapNavigator(element, opt);

            };
            $scope.redraw = function() {
                element.empty();
                var z = [];
                // keep only zones that have a path
                for(var tmp = $scope.zones(), i = 0, l = tmp.length ; i < l ; i++) {
                    if(tmp[i].path)
                        z.push(tmp[i]);
                }
                var d = $scope.data();
                if($scope.mapNavigator && z && d) {
                    $scope.mapNavigator.draw(z, d);
                    $scope.mapNavigator.unhighlight();
                    $scope.mapNavigator.highlight($scope.highlight() || []);
                }
            };
            $scope.$watch($scope.zones, function() {
                $scope.redraw();
            }, true);
            $scope.$watch($scope.options, function() {
                $scope.init();
                $scope.redraw();
            }, true);
            $scope.$watch($scope.highlight, function(newValue, oldValue) {
                if(!$scope.mapNavigator)
                    return;
                $scope.mapNavigator.unhighlight();
                $scope.mapNavigator.highlight($scope.highlight() || []);
            }, true);
            $scope.init();
            $(window).resize(function() {
                if(this.resizeTO) clearTimeout(this.resizeTO);
                this.resizeTO = setTimeout(function() {
                    $(this).trigger('resizeEnd');
                }, 500);
            });
            $(window).bind('resizeEnd', function() {
                $scope.$apply(function() {
                    $scope.redraw();
                });
            });
        }
    };
}]);
