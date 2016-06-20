/**
 * App : root of application
 * @returns {{start: start, stop: stop, setTiming: setTiming}}
 * @constructor
 */
var App = function (domCounterId) {
    var grid,
        timing = 100,
        tileSize = tileSize || 12,
        timeInterval = false,
        domCounter = document.getElementById(domCounterId) || false;

    function init() {
        // -- init configuration balance
        Configuration.getInstance().setIsMoving(false);
        Configuration.getInstance().setCanMove(true);
        Configuration.getInstance().setCountDomElement(domCounter);
        // -- instanciation element
        grid = new Grid(tileSize);
        grid.addSvgContainer();
        grid.randomize();

    }

    function start() {
        if (timeInterval === false)
            Configuration.getInstance().setIsMoving(true);
        timeInterval = setInterval(grid.run, timing);
    }

    function stop() {
        clearInterval(timeInterval);
        timeInterval = false;
        Configuration.getInstance().setIsMoving(false);
    }

    function setTiming(newTiming) {
        timing = newTiming;
        stop();
        start();
    }

    function setTileSize(newTileSize) {
        tileSize = newTileSize;
    }

    function getNbrMove() {
        return ant.getMoveNbr();
    }

    function reset(tileSize) {
        setTileSize(tileSize);
        stop();
        grid.clear();

        grid = null;

        init();

    }

    init();

    return {
        getNbrMove: getNbrMove,
        start: start,
        stop: stop,
        setTiming: setTiming,
        reset: reset,
        setTileSize: setTileSize
    }
};
/**
 * Tile Class
 * @param x
 * @param y
 * @param size
 * @returns {{getDomElement: getDomElement, getDirection: getDirection, toggleColor: toggleColor}}
 * @constructor
 */
var Tile = function (x, y, size) {

    var domElement;


    function init() {
        domElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        domElement.setAttribute("x", x * size);
        domElement.setAttribute("y", y * size);
        domElement.setAttribute("stroke", "#555");
        domElement.setAttribute("width", size);
        domElement.setAttribute("height", size);
        domElement.setAttribute("class", 'tile white');
        domElement.setAttribute("id", x + '-' + y);

        domElement.setAttribute("data-row", y);
        domElement.setAttribute("data-col", x);

        domElement.addEventListener("click", clickOnTile);
    }

    function getDomElement() {
        return domElement;
    }

    function clickOnTile(event) {
        if (Configuration.getInstance().getIsMoving())
            return;

        toggleColor();
    }


    function isAlive() {
        return domElement.classList.contains("black") ? true : false;
    }

    function setAlive() {
        if (!isAlive()) {
            toggleColor();
        }
    }

    function setDeath() {
        if (isAlive()) {
            toggleColor();
        }
    }


    function toggleColor() {
        domElement.classList.toggle("white");
        domElement.classList.toggle("black");
    }

    function getDirection() {
        if (domElement.classList.contains('white')) {
            // right
            return -Math.PI / 2;
        } else if (domElement.classList.contains('black')) {
            // left
            return Math.PI / 2;
        }
    }


    init();

    return {
        getDomElement: getDomElement,
        getDirection: getDirection,
        toggleColor: toggleColor,
        isAlive: isAlive,
        setAlive: setAlive,
        setDeath: setDeath
    }
};
/**
 * Grid
 * @param tileSizeDef
 * @param containerDom optional : container for grid
 * @returns {{tileSize: (*|number), container: *, getTileWithPixel: getTileWithPixel, addSvgContainer: addSvgContainer, getCenteredTile: getCenteredTile}}
 * @constructor
 */
var Grid = function (tileSizeDef, containerDom) {
    var container = containerDom || document.getElementsByTagName("body")[0];
    var svgTag;
    var tileSize = tileSizeDef || 20;
    var arrayTile = [];
    var tilesHeight = Math.ceil(document.documentElement.clientHeight / tileSize);
    var tilesWidth = Math.ceil(document.documentElement.clientWidth / tileSize);
    var nbrMove = 0;
    /*
     Create sgv container
     */
    function addSvgContainer() {
        svgTag = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgTag.setAttribute("width", document.documentElement.clientWidth);
        svgTag.setAttribute("height", document.documentElement.clientHeight);

        for (var i = 0; i < tilesHeight; i++) {
            arrayTile[i] = [];
            for (var j = 0; j < tilesWidth; j++) {
                arrayTile[i][j] = new Tile(j, i, tileSize);

                svgTag.appendChild(arrayTile[i][j].getDomElement());
            }
        }
        container.appendChild(svgTag);
    }

    function getCenteredTile() {
        return getTileWithPosInArray(Math.round(tilesHeight / 2), Math.round(tilesWidth / 2));

    }

    function randomize() {
        for (var i = 0; i < tilesHeight; i++) {
            for (var j = 0; j < tilesWidth; j++) {
                Math.round((Math.random()*2)) > 1 ? arrayTile[i][j].toggleColor() : null;
            }
        }
    }

    function getTileWithPixel(x, y) {
        var i = Math.floor(y / tileSize);
        var j = Math.floor(x / tileSize);
        if (arrayTile[i] == undefined || arrayTile[i][j] == undefined) {

            return false;
        }
        return arrayTile[i][j];
    }

    function getTileWithPosInArray(rowIndex, colIndex) {

        if (arrayTile[rowIndex] == undefined || arrayTile[rowIndex][colIndex] == undefined) {
            return false;
        }
        return arrayTile[rowIndex][colIndex];
    }

    function countAliveCellsAround(row, col) {
        var nbr = 0;
        for (var i = row - 1; i <= row + 1; i++) {
            if (arrayTile[i] == undefined) {
                continue;
            }
            for (var j = col - 1; j <= col + 1; j++) {
                if (i == row && j == col) {
                    continue;
                } else if (arrayTile[i][j] == undefined) {
                    continue;
                }
                nbr += arrayTile[i][j].isAlive() ? 1 : 0;
            }
        }
        return nbr;
    }

    function updateCounter(nbr) {
        Configuration.getInstance().getCountDomElement() !== false ? Configuration.getInstance().getCountDomElement().innerHTML = nbr : "";
    }

    function run() {
        var arrayToggle = [];
        for (var i = 0; i < tilesHeight; i++) {
            for (var j = 0; j < tilesWidth; j++) {
                var isAlive = arrayTile[i][j].isAlive();
                var aliveNeighbours = countAliveCellsAround(i, j);
                if (!isAlive && aliveNeighbours == 3) {
                    arrayToggle.push(arrayTile[i][j]);
                    //  arrayTile[i][j].setAlive();

                } else if (isAlive && (aliveNeighbours < 2 || aliveNeighbours > 3)) {
                    // arrayTile[i][j].setDeath();
                    arrayToggle.push(arrayTile[i][j]);
                }
            }
        }

        for (var i = 0; i < arrayToggle.length; i++) {
            arrayToggle[i].toggleColor();
        }
        nbrMove++;
        updateCounter(nbrMove);

    }


    function clear() {
        svgTag.remove();
        arrayTile = [];
    }


    return {
        clear: clear,
        tileSize: tileSize,
        container: container,
        getTileWithPixel: getTileWithPixel,
        getTileWithPosInArray: getTileWithPosInArray,
        addSvgContainer: addSvgContainer,
        getCenteredTile: getCenteredTile,
        run: run,
        randomize : randomize
    }

};

/**
 * App Configuratoin with a Singleton pattern
 * @type {{getInstance}}
 */
var Configuration = (function () {
    var instance;

    var canMove = true;

    function setCanMove(bool) {
        canMove = bool;
    }

    function getCanMove() {
        return canMove;
    }

    var isMoving = false;

    function setIsMoving(bool) {
        isMoving = bool;
    }

    function getIsMoving() {
        return isMoving;
    }

    var countDomElement = false;

    function setCountDomElement(domElement) {
        countDomElement = domElement;
    }

    function getCountDomElement() {
        return countDomElement;
    }


    function createInstance() {
        return {
            setCanMove: setCanMove,
            getCanMove: getCanMove,
            setIsMoving: setIsMoving,
            getIsMoving: getIsMoving,
            getCountDomElement: getCountDomElement,
            setCountDomElement: setCountDomElement
        };
    }


    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }

    };
})();

