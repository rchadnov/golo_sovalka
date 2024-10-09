let cities = []; 
let points = {};
let imageFiles = []; 

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
        console.log('NSFW enabled:', nsfwEnabled);  
        generateComparison();
    });
        
    // Use Promise.all to load both data.json and files.json
    Promise.all([
        $.getJSON('data.json'),
        $.getJSON('files.json')
    ]).then(function([cityData, fileData]) {
        console.log('Data loaded:', cityData);
        cities = cityData.cities;
        console.log('Cities array:', cities);
        
        imageFiles = fileData;
        console.log('Image files loaded:', imageFiles);
        
        initialize();
    }).catch(function(error) {
        console.error('Failed to load data:', error);
        alert('Failed to load necessary data.');
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


        setTimeout(() => {
            generateComparison();
            buildPointsList();
            updateValidationMessage();

            // Force a reflow to trigger image loading
            $('.comparison-pane').each(function() {
                this.offsetHeight;
            });

            setTimeout(loadBackgroundImages, 500);  // Delay loading images
        }, 500);  // Delay initialization

        const nsfwCheckbox = $(`
            <div class="nsfw-container">
                <label for="nsfw-checkbox">
                    <input type="checkbox" id="nsfw-checkbox">
                    Enable NSFW content
                </label>
            </div>
        `);
        $('.points-pane').append(nsfwCheckbox);

            // Attach the event listener after adding the checkbox to the DOM
    $('#nsfw-checkbox').on('change', function() {
        nsfwEnabled = this.checked;
        console.log('NSFW enabled:', nsfwEnabled);  
        generateComparison();
    });
        
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

    // Check if total points is 180
    if (totalPoints !== 180) {
        isValid = false;
        message = `Total points distributed: ${totalPoints} (should be 180)`;
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
        console.log('Available categories:', availableCategories);  // Add this line for debugging
        const category = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        console.log('Selected category:', category);  // Add this line for debugging

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
        //loadBackgroundImages();
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

    //updateBackgroundImage(side, city.city, category);
}

       function loadBackgroundImages() {
        updateBackgroundImage('left', currentComparison.leftCity, currentComparison.category);
        updateBackgroundImage('right', currentComparison.rightCity, currentComparison.category);

                 // Force a reflow after setting background images
        $('.comparison-pane').each(function() {
            this.offsetHeight;
        });
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
        console.log('Updating background image:', side, cityName, category, 'NSFW:', nsfwEnabled);  // Add this line for debugging
        const cityFolder = cityName.replace(/[\s\/]+/g, '').toLowerCase();
        let validImages = imageFiles.filter(file => 
            file.startsWith(`${cityFolder}_`)
        );

        console.log('All valid images:', validImages);  // Add this line for debugging

        if (category === "AdultEntertainment") {
            if (nsfwEnabled) {
                validImages = validImages.filter(file => file.includes('nsfw'));
            } else {
                setBackgroundImage(`#${side}-pane`, 'default.jpeg');
                return;
            }
        } else {
            validImages = validImages.filter(file => !file.includes('nsfw'));
        }

        console.log('Filtered valid images:', validImages);  // Add this line for debugging

        if (validImages.length === 0) {
            console.log('No valid images found, using default');  // Add this line for debugging
            setBackgroundImage(`#${side}-pane`, 'default.jpeg');
            return;
        }

        const randomImage = validImages[Math.floor(Math.random() * validImages.length)];
        console.log('Selected image:', randomImage);  // Add this line for debugging
        setBackgroundImage(`#${side}-pane`, `images/${randomImage}`);
                $(`#${side}-pane`)[0].offsetHeight;

    }

    function setBackgroundImage(selector, imagePath) {
        const pane = $(selector);
        pane.find('.animate__animated').removeClass('animate__fadeIn');
        
        $('<img/>').attr('src', imagePath).on('load', function() {
            $(this).remove();
            pane.css('background-image', 'none');  // Clear any existing background on the main element
            pane.attr('style', `--bg-image: url(${imagePath})`);
            
            // Delay adding the fade-in class
            setTimeout(() => {
                pane.find('.animate__animated').addClass('animate__fadeIn');
            }, 100);

            // Force a reflow
            pane[0].offsetHeight;
        }).on('error', function() {
            console.error('Failed to load image:', imagePath);
            // Set a default background if the image fails to load
            pane.css('background-image', 'url(default.jpeg)');
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


        $(document).keydown(function(e) {
        switch(e.which) {
            case 37: // left arrow key
                vote('left');
                break;
            case 39: // right arrow key
                vote('right');
                break;
            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });
    
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

        setTimeout(generateComparison, 100);  // Delay generating new comparison
        setTimeout(loadBackgroundImages, 500);  // Delay loading new images
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
