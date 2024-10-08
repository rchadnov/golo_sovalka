let cities = []; // Global declaration
let points = {};
const categories = [
    "CulinaryScene",
    "EscapeRooms",
    "NightlifeAndEntertainment",
    "OutdoorActivitiesAndNature",
    "ClimateAndWeather",
    "AdultEntertainment"
];
let currentComparison = {};

$(document).ready(function() {
    console.log('Document ready');
    console.log('Comparison panes:', $('.comparison-pane').length);
    console.log('Descriptions:', $('.description').length);
    
    $('.comparison-pane').each(function(index) {
        console.log(`Comparison pane ${index} dimensions:`, 
            $(this).width(), 'x', $(this).height());
    });

    document.fonts.ready.then(function () {
        console.log('Fonts are loaded');
        
        // Check if Lobster font is applied
        var cityName = $('#left-city-name');
        console.log('City name font:', cityName.css('font-family'));
        console.log('City name font size:', cityName.css('font-size'));
        
        // Check if Roboto font is applied
        var category = $('#left-category');
        console.log('Category font:', category.css('font-family'));
        console.log('Category font size:', category.css('font-size'));
    });
    
    $.getJSON('data.json', function(data) {
        console.log('Data loaded:', data);
        cities = data.cities;
        console.log('Cities array:', cities);
        initialize();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load city data:', textStatus, errorThrown);
        alert('Failed to load city data.');
    });

    function initialize() {
        console.log('Initializing...');
        
        if (localStorage.getItem('points')) {
            console.log('Points found in localStorage');
            points = JSON.parse(localStorage.getItem('points'));
        } else {
            console.log('Setting default points');
            cities.forEach(city => {
                points[city.city] = 10;
            });
        }
        console.log('Points after initialization:', points);

        if (localStorage.getItem('currentComparison')) {
            console.log('currentComparison found in localStorage');
            currentComparison = JSON.parse(localStorage.getItem('currentComparison'));
            console.log('Restoring comparison...');
            restoreComparison();
        } else {
            console.log('Generating new comparison...');
            generateComparison();
        }

        buildPointsList();
        updateValidationMessage();
        console.log('Initialization complete');
    }

    function buildPointsList() {
        const pointsList = $('#points-list');
        pointsList.empty();

        let citiesWithPoints = cities.map(city => ({
            city: city.city,
            points: points[city.city]
        }));

        citiesWithPoints.sort((a, b) => b.points - a.points);

        citiesWithPoints.forEach(cityData => {
            const cityId = cityData.city.replace(/[^a-zA-Z0-9]/g, '_');
            const cityDiv = $(`
                <div class="city-points">
                    <span>${cityData.city}</span>
                    <div>
                        <button onclick="adjustPoints('${cityData.city}', 1)">▲</button>
                        <span id="points-${cityId}">${cityData.points}</span>
                        <button onclick="adjustPoints('${cityData.city}', -1)">▼</button>
                    </div>
                </div>
            `);
            pointsList.append(cityDiv);
        });
    }

    function updatePointsDisplay(cityName) {
        const cityId = cityName.replace(/[^a-zA-Z0-9]/g, '_');
        $(`#points-${cityId}`).text(points[cityName]);
    }

    function updateValidationMessage() {
        const totalPoints = Object.values(points).reduce((a, b) => a + b, 0);
        const validationMessage = $('#validation-message');
        if (totalPoints === 170) {
            validationMessage.text('Valid distribution').removeClass('invalid').addClass('valid');
        } else {
            validationMessage.text(`Total points distributed: ${totalPoints}`).removeClass('valid').addClass('invalid');
        }
    }

    function generateComparison() {
        const category = categories[Math.floor(Math.random() * categories.length)];
        let cityIndices = [];
        while (cityIndices.length < 2) {
            let index = Math.floor(Math.random() * cities.length);
            if (!cityIndices.includes(index)) {
                cityIndices.push(index);
            }
        }
        const leftCity = cities[cityIndices[0]];
        const rightCity = cities[cityIndices[1]];

        const categoryName = category.replace(/([A-Z])/g, ' $1').trim();

        updateComparisonPane('left', leftCity, category, categoryName);
        updateComparisonPane('right', rightCity, category, categoryName);

        currentComparison = {
            category: category,
            leftCity: leftCity.city,
            rightCity: rightCity.city
        };

        saveState();
    }

    function updateComparisonPane(side, city, category, categoryName) {
        $(`#${side}-city-name`).text(city.city).removeClass().addClass('animate__animated animate__fadeIn');
        $(`#${side}-category`).text(categoryName).removeClass().addClass('animate__animated animate__fadeIn');
        $(`#${side}-text`).text(city.categories[category]).removeClass().addClass('animate__animated animate__fadeIn');

        updateBackgroundImage(side, city.city, category);
    }

    function restoreComparison() {
        const leftCity = cities.find(city => city.city === currentComparison.leftCity);
        const rightCity = cities.find(city => city.city === currentComparison.rightCity);
        const category = currentComparison.category;
        const categoryName = category.replace(/([A-Z])/g, ' $1').trim();

        updateComparisonPane('left', leftCity, category, categoryName);
        updateComparisonPane('right', rightCity, category, categoryName);
    }

    function updateBackgroundImage(side, cityName, category) {
        const cityFolder = cityName.replace(/[\s\/]+/g, '').toLowerCase();
        const categoryFolder = category;
        const numImages = 5;
        const imageNumber = Math.floor(Math.random() * numImages) + 1;
        const imagePath = `${cityFolder}/${categoryFolder}/${imageNumber}.jpg`;

        $.ajax({
            url: imagePath,
            type: 'HEAD',
            error: function() {
                console.log(`Image not found: ${imagePath}`);
                setBackgroundImage(`#${side}-pane`, 'default.jpeg');
            },
            success: function() {
                console.log(`Image found: ${imagePath}`);
                setBackgroundImage(`#${side}-pane`, imagePath);
            }
        });
    }

    function setBackgroundImage(selector, imagePath) {
        $(selector).css({
            'background-image': `url(${imagePath})`,
            'background-size': 'cover',
            'background-position': 'center'
        });
    }

    function saveState() {
        localStorage.setItem('points', JSON.stringify(points));
        localStorage.setItem('currentComparison', JSON.stringify(currentComparison));
    }

    window.adjustPoints = function(cityName, change) {
        points[cityName] += change;
        if (points[cityName] < 0) points[cityName] = 0;
        updatePointsDisplay(cityName);
        updateValidationMessage();
        buildPointsList();
        saveState();
    }

    window.vote = function(side) {
        const winner = side === 'left' ? currentComparison.leftCity : currentComparison.rightCity;
        const loser = side === 'left' ? currentComparison.rightCity : currentComparison.leftCity;

        if (points[loser] > 0) {
            points[winner]++;
            points[loser]--;
            updatePointsDisplay(winner);
            updatePointsDisplay(loser);
            updateValidationMessage();
            buildPointsList();
            saveState();
        }

        generateComparison();
    }

    window.copyResults = function() {
        let resultsArray = [];
        let sortedCities = Object.keys(points).sort((a, b) => points[b] - points[a]);

        sortedCities.forEach(cityName => {
            resultsArray.push(`${cityName}: ${points[cityName]}`);
        });

        let results = resultsArray.join('\n');

        navigator.clipboard.writeText(results).then(() => {
            alert('Results copied to clipboard!');
        }, () => {
            alert('Failed to copy results.');
        });
    }

    window.resetPoints = function() {
        if (confirm('Are you sure you want to reset all points?')) {
            localStorage.clear();
            points = {};
            cities.forEach(city => {
                points[city.city] = 10;
            });
            currentComparison = {};
            buildPointsList();
            updateValidationMessage();
            generateComparison();
            saveState();
        }
    }
});
