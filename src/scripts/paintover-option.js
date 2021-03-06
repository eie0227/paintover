angular.module('paintover', ['ngRoute', 'colorpicker.module'])
    .config(function ($routeProvider, $locationProvider) {
        $routeProvider.
            when('/', {
                redirectTo: '/vocareg'
            }).
            when('/vocareg', {
                templateUrl: chrome.extension.getURL('../views/vocaReg.html'),
                controller: 'vocaRegCtrl'
            }).
            when('/etcreg', {
                templateUrl: chrome.extension.getURL('../views/etcReg.html'),
                controller: 'etcRegCtrl'
            });
    })
    .constant('DEFAULT_COMPLETE_VALUE', 5)
    .factory("vocaSvc", ['$rootScope', '$q', function ($rootScope, $q) {
        function _addVoca(voca) {
            if (!voca) {
                return;
            }
            var defer = $q.defer();

            chrome.storage.sync.set(voca, function () {
                $rootScope.$apply(function () {
                    defer.resolve();
                });
            });

            return defer.promise;
        }

        function _removeVoca(key, func) {
            chrome.storage.sync.remove(key, function () {
                $rootScope.$apply(function () {
                    if (func) func.apply({}, []);
                })
            });
        }

        function _getVocaList() {
            var defer = $q.defer();

            chrome.storage.sync.get(function (item) {
                $rootScope.$apply(function () {
                    defer.resolve(item);
                })
            });

            return defer.promise;
        }

        return {
            addVoca: _addVoca,
            removeVoca: _removeVoca,
            getVocaList: _getVocaList
        }
    }])
    .controller('mainCtrl', function ($scope, $location) {
        console.log($location.$$path);
        $scope.isActive = function (path) {
            return {
                active: ($location.$$path == path)
            }
        };
    })
    .controller('vocaRegCtrl', function ($scope, vocaSvc, DEFAULT_COMPLETE_VALUE) {
        $scope.voca = {
            text: ""
        };

        $scope.loadVocaList = function () {
            vocaSvc.getVocaList()
                .then(function (items) {
                    $scope.vocaListReged = items;
                    $scope.vocalListLength = Object.keys(items).length;
                });
        };

        $scope.addVoca = function (voca) {
            if (voca.text === "") {
                return;
            }
            var vocaToSave = {};

            vocaToSave[voca.text] = {
                'text': voca.text,
                'complete': DEFAULT_COMPLETE_VALUE
            };
            vocaSvc.addVoca(vocaToSave)
                .then(function () {
                    $scope.loadVocaList();
                });

            $scope.voca.text = "";
        };

        $scope.removeVoca = function (key) {
            vocaSvc.removeVoca(key, function () {
                $scope.loadVocaList();
            });
        };

        $scope.loadVocaList();
    })
    .controller('etcRegCtrl', function ($scope) {
        $scope.setOptions = function () {
            chrome.storage.sync.set({"$$option": $scope.options}, function () {
            });
        };

        $scope.setMaxCompleteOpt = function (event) {
            $scope.options["maxComplete"] = event.value;
            $scope.setOptions();
        };

        $scope.onCheckedNoti = function (checked) {
            $scope.setOptions();
            $scope.restartAlarm();
        }

        $scope.setNotiPeriodOpt = function (event) {
            $scope.options["notiPeriod"] = event.value;
            $scope.setOptions();
            $scope.restartAlarm();
        };

        $scope.restartAlarm = function() {
            chrome.extension.sendRequest({
                    method: "notification",
                    key: "alarm"
                }, function (response) {
                }
            );
        };

        loadOptions($scope);
        setNotiPeriod($scope)
    });

function loadOptions($scope) {
    chrome.storage.sync.get("$$option", function (obj) {
        $scope.$apply(function () {
            // default color
            $scope.options = {
                maxComplete: 5,
                bgColor: "#ffff00",
                fgColor: "#ff0000",
                notiChecked: false,
                notiPeriod: 30
            };

            if (obj.$$option) {
                var bgColor = obj.$$option["bgColor"];
                if (bgColor) {
                    $scope.options["bgColor"] = bgColor;
                }

                var fgColor = obj.$$option["fgColor"];
                if (fgColor) {
                    $scope.options["fgColor"] = fgColor;
                }

                var maxComplete = obj.$$option["maxComplete"];
                if (maxComplete) {
                    $scope.options["maxComplete"] = maxComplete;
                    setMaxCompleteSlider($scope, maxComplete);
                }

                var notiChecked = obj.$$option["notiChecked"];
                if (notiChecked) {
                    $scope.options["notiChecked"] = notiChecked;
                }

                var notiPeriod = obj.$$option["notiPeriod"];
                if (notiPeriod) {
                    $scope.options["notiPeriod"] = notiPeriod;
                    setNotiPeriod($scope, notiPeriod);
                }
            }
        });
    });
}

function setMaxCompleteSlider($scope, maxComplete) {
    var sliderOpts = {
        min: 5,
        max: 10,
        orientation: "horizontal",
        tooltip: "show",
        handle: "round",
        selection: "before"
    }

    var slider = $(".completeMaxSlider").slider(sliderOpts);
    slider.on('slide', $scope.setMaxCompleteOpt);
    slider.slider('setValue', maxComplete);
}

function setNotiPeriod($scope, period) {
    var sliderOpts = {
        min: 1,
        max: 30,
        orientation: "horizontal",
        tooltip: "show",
        handle: "round",
        selection: "before"
    }

    var slider = $(".notiPeriodSlider").slider(sliderOpts);
    slider.on('slide', $scope.setNotiPeriodOpt);
    slider.slider('setValue', period);
}
