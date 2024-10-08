$(document).ready(function() {
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

    // Fetch data from data.json
    $.getJSON('data.json', function(data) {
        let cities = data.cities;
        initialize(cities);
    }).fail(function() {
        alert('Failed to load city data.');
    });

    function initialize(cities) {
        // Initialize points from local storage or set to 10
        if (localStorage.getItem('points')) {
            points = JSON.parse(localStorage.getItem('points'));
        } else {
            cities.forEach(city => {
                points[city.city] = 10;
            });
        }

        // Load current comparison from local storage or generate a new one
        if (localStorage.getItem('currentComparison')) {
            currentComparison = JSON.parse(localStorage.getItem('currentComparison'));
            restoreComparison(cities);
        } else {
            generateComparison(cities);
        }

        buildPointsList(cities);
        updateValidationMessage();
    }

    function buildPointsList(cities) {
        const pointsList = $('#points-list');
        pointsList.empty();

        let citiesWithPoints = cities.map(city => ({
            city: city.city,
            points: points[city.city]
        }));

        citiesWithPoints.sort((a, b) => b.points - a.points);

        citiesWithPoints.forEach(cityData => {
            const cityDiv = $(`
                <div class="city-points">
                    <span>${cityData.city}</span>
                    <div>
                        <button onclick="adjustPoints('${cityData.city}', 1)">▲</button>
                        <span id="points-${cityData.city}">${cityData.points}</span>
                        <button onclick="adjustPoints('${cityData.city}', -1)">▼</button>
                    </div>
                </div>
            `);
            pointsList.append(cityDiv);
        });
    }

    // Adjust Points Manually
    window.adjustPoints = function(cityName, change) {
        points[cityName] += change;
        if (points[cityName] < 0) points[cityName] = 0;
        updatePointsDisplay(cityName);
        updateValidationMessage();
        buildPointsList(cities);
        saveState();
    }

    function updatePointsDisplay(cityName) {
        $(`#points-${cityName}`).text(points[cityName]);
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

    function generateComparison(cities) {
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

        $('#left-city-name').text(leftCity.city).addClass('animate__fadeInLeft');
        $('#left-category').text(categoryName).addClass('animate__fadeInLeft');
        $('#left-text').text(leftCity.categories[category]).addClass('animate__fadeInLeft');

        $('#right-city-name').text(rightCity.city).addClass('animate__fadeInRight');
        $('#right-category').text(categoryName).addClass('animate__fadeInRight');
        $('#right-text').text(rightCity.categories[category]).addClass('animate__fadeInRight');

        // Update Images
        updateBackgroundImage('left', leftCity.city, category);
        updateBackgroundImage('right', rightCity.city, category);

        // Initialize Parallax
        $('.parallax-container').each(function() {
            if (!$(this).data('plugin_parallax')) {
                new Parallax(this);
            }
        });

        // Store Current Comparison
        currentComparison = {
            category: category,
            leftCity: leftCity.city,
            rightCity: rightCity.city
        };

        // Save state
        saveState();
    }

    function restoreComparison(cities) {
        const leftCity = cities.find(city => city.city === currentComparison.leftCity);
        const rightCity = cities.find(city => city.city === currentComparison.rightCity);
        const category = currentComparison.category;
        const categoryName = category.replace(/([A-Z])/g, ' $1').trim();

        $('#left-city-name').text(leftCity.city).addClass('animate__fadeInLeft');
        $('#left-category').text(categoryName).addClass('animate__fadeInLeft');
        $('#left-text').text(leftCity.categories[category]).addClass('animate__fadeInLeft');

        $('#right-city-name').text(rightCity.city).addClass('animate__fadeInRight');
        $('#right-category').text(categoryName).addClass('animate__fadeInRight');
        $('#right-text').text(rightCity.categories[category]).addClass('animate__fadeInRight');

        // Update Images
        updateBackgroundImage('left', leftCity.city, category);
        updateBackgroundImage('right', rightCity.city, category);

        // Initialize Parallax
        $('.parallax-container').each(function() {
            if (!$(this).data('plugin_parallax')) {
                new Parallax(this);
            }
        });
    }

    function updateBackgroundImage(side, cityName, category) {
        const cityFolder = cityName.replace(/[\s\/]+/g, '').toLowerCase();
        const categoryFolder = category;
        const numImages = 5; // Adjust based on actual number of images
        const imageNumber = Math.floor(Math.random() * numImages) + 1;
        const imagePath = `images/${cityFolder}/${categoryFolder}/${imageNumber}.jpg`;
        $(`#${side}-pane .parallax-container`).attr('data-image-src', imagePath);
    }

    // Handle Voting
    window.vote = function(side) {
        const winner = side === 'left' ? currentComparison.leftCity : currentComparison.rightCity;
        const loser = side === 'left' ? currentComparison.rightCity : currentComparison.leftCity;

        // Adjust Points
        if (points[loser] > 0) {
            points[winner]++;
            points[loser]--;
            updatePointsDisplay(winner);
            updatePointsDisplay(loser);
            updateValidationMessage();
            buildPointsList(cities);
            saveState();
        }

        // Generate Next Comparison
        generateComparison(cities);
    }

    // Save State to Local Storage
    function saveState() {
        localStorage.setItem('points', JSON.stringify(points));
        localStorage.setItem('currentComparison', JSON.stringify(currentComparison));
    }

    // Reset Points and Clear Local Storage
    window.resetPoints = function() {
        if (confirm('Are you sure you want to reset all points?')) {
            localStorage.clear();
            points = {};
            currentComparison = {};
            initialize(cities);
        }
    }

    // Copy Results to Clipboard
    window.copyResults = function() {
        let resultsArray = [];

        // Sort cities before copying
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
});
