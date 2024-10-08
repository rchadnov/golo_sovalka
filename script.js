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
let nsfwEnabled = false;

$(document).ready(function() {
    $('#nsfw-checkbox').change(function() {
        nsfwEnabled = this.checked;
        generateComparison();
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

    $.getJSON('files.json', function(data) {
        imageFiles = data;
        console.log('Image files loaded:', imageFiles);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load image files list:', textStatus, errorThrown);
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

        const nsfwCheckbox = $(`
            <div class="nsfw-container">
                <label for="nsfw-checkbox">
                    <input type="checkbox" id="nsfw-checkbox">
                    Enable NSFW content
                </label>
            </div>
        `);
        $('.points-pane').append(nsfwCheckbox);
        
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
    const maxPointsPerCity = 40;
    
    let isValid = true;
    let message = '';

    // Check if total points is 170
    if (totalPoints !== 170) {
        isValid = false;
        message = `Total points distributed: ${totalPoints} (should be 170)`;
    }

    // Check if any city has more than 40 points
    for (let city in points) {
        if (points[city] > maxPointsPerCity) {
            isValid = false;
            message += message ? ' and ' : '';
            message += `${city} has ${points[city]} points (max ${maxPointsPerCity})`;
        }
    }

    if (isValid) {
        validationMessage.text('Valid distribution').removeClass('invalid').addClass('valid');
    } else {
        validationMessage.text(message).removeClass('valid').addClass('invalid');
    }
}

    function generateComparison() {
        let availableCategories = nsfwEnabled ? categories : categories.filter(cat => cat !== "AdultEntertainment");
        const category = availableCategories[Math.floor(Math.random() * availableCategories.length)];

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
    $(`#${side}-city-name`)
        .text(city.city)
        .addClass('animate__animated animate__fadeIn');
    $(`#${side}-category`)
        .text(categoryName)
        .addClass('animate__animated animate__fadeIn');
    $(`#${side}-text`)
        .text(city.categories[category])
        .addClass('animate__animated animate__fadeIn');

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
        let validImages = imageFiles.filter(file => 
            file.startsWith(`${cityFolder}_`) && 
            (nsfwEnabled || !file.includes('nsfw'))
        );

        if (category === "AdultEntertainment") {
            if (nsfwEnabled) {
                validImages = validImages.filter(file => file.includes('nsfw'));
            } else {
                setBackgroundImage(`#${side}-pane`, 'images/default.jpeg');
                return;
            }
        } else {
            validImages = validImages.filter(file => !file.includes('nsfw'));
        }

        if (validImages.length === 0) {
            setBackgroundImage(`#${side}-pane`, 'images/default.jpeg');
            return;
        }

        const randomImage = validImages[Math.floor(Math.random() * validImages.length)];
        setBackgroundImage(`#${side}-pane`, `images/${randomImage}`);
    }

    function setBackgroundImage(selector, imagePath) {
        const pane = $(selector);
        pane.find('.animate__animated').removeClass('animate__fadeIn');
        
        $('<img/>').attr('src', imagePath).on('load', function() {
            $(this).remove();
            pane.css('background-image', 'none');  // Clear any existing background on the main element
            pane.attr('style', `--bg-image: url(${imagePath})`);
            pane.find('.animate__animated').addClass('animate__fadeIn');
        }).on('error', function() {
            console.error('Failed to load image:', imagePath);
            // Set a default background if the image fails to load
            pane.css('background-image', 'url(images/default.jpeg)');
        });
    }

    function saveState() {
        localStorage.setItem('points', JSON.stringify(points));
        localStorage.setItem('currentComparison', JSON.stringify(currentComparison));
    }

// Update the adjustPoints function to prevent exceeding 40 points
window.adjustPoints = function(cityName, change) {
    const newPoints = points[cityName] + change;
    if (newPoints >= 0 && newPoints <= 40) {
        points[cityName] = newPoints;
        updatePointsDisplay(cityName);
        updateValidationMessage();
        buildPointsList();
        saveState();
    } else {
        alert(`Points for ${cityName} must be between 0 and 40.`);
    }
}

// Update the vote function to prevent exceeding 40 points
window.vote = function(side) {
    const winner = side === 'left' ? currentComparison.leftCity : currentComparison.rightCity;
    const loser = side === 'left' ? currentComparison.rightCity : currentComparison.leftCity;

    if (points[loser] > 0 && points[winner] < 40) {
        points[winner]++;
        points[loser]--;
        updatePointsDisplay(winner);
        updatePointsDisplay(loser);
        updateValidationMessage();
        buildPointsList();
        saveState();
    } else if (points[winner] >= 40) {
        alert(`${winner} already has the maximum of 40 points.`);
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
