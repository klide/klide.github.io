/**
 * LeafNote Namespace
 */
var LeafNote = {};

/**
 * Keeps track of the current theme
 */
LeafNote.currentTheme = '';

/**
 * The leafNote DB name
 */
LeafNote.databaseName = 'leafNote';

/**
 * Checks for browser support
 */
LeafNote.isSupportedBrowser = function () {
    var agent = navigator.userAgent,
        blockedAgents = [{
            name: 'Internet Explorer',
            supportedVersion: 10,
            agentString: 'MSIE'
        }, {
            name: 'Android browser',
            supportedVersion: 4.0,
            agentString: 'like Gecko) Version'
        }, {
            name: 'Opera browser',
            supportedVersion: 21,
            agentString: 'Opera'
        }];

    // Display unsupported browser message
    for (var i=0; i<blockedAgents.length; i++) {
        if (agent.indexOf(blockedAgents[i].agentString) >= 0) {
            var versionIndex = agent.lastIndexOf(blockedAgents[i].agentString) + blockedAgents[i].agentString.length + 1,
                version = parseFloat(agent.slice(versionIndex));

            if (version <= blockedAgents[i].supportedVersion) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Holds the DB instance
 */
LeafNote.db = (typeof(PouchDB(LeafNote.databaseName)) === "undefined") ? new PouchDB(LeafNote.databaseName) : PouchDB(LeafNote.databaseName);

/**
 * Sets up the Local DB
 */
LeafNote.getDb = function () {
    if (!LeafNote.db) {
        return new PouchDB(LeafNote.databaseName);
    } else {
        return LeafNote.db;
    }
};

/**
 * Applies the currently selected theme
 * @param {string} themeId The theme id selected
 */
LeafNote.applyTheme = function (themeId) {
    var self = LeafNote,
        newTheme = themeId || 'theme1',
        $themeHolderEl = $('#currentTheme'),
        themeClasses;

    // Update the selected theme in localDb
    LeafNote.db.get('theme').then(function (theme) {
        // If no theme was provided, use the theme from localDb
        if (!themeId) {
            newTheme = theme.currentTheme;
            return $.Deferred().resolve(newTheme).promise();
        }
        return self.db.put({'currentTheme': newTheme}, 'theme', theme._rev);
    }).then(function () {
        // After saving the selected theme, apply it
        switch (newTheme) {
            case 'theme1':
                themeClasses = 'theme1';
                break;
            case 'theme2':
                themeClasses = 'theme1 theme2';
                break;
            case 'theme3':
                themeClasses = 'theme1 theme3';
                break;
            default:
                break;
        }
        self.currentTheme = newTheme;
        $themeHolderEl.attr('class', themeClasses);
        $themeHolderEl.find('body').fadeIn('fast');
    }, function (err) {
        // If the theme wasn't found, create the theme and use 'theme1' as a default theme
        if (err.status == 404) {
            self.db.put({
                _id: 'theme',
                currentTheme: newTheme
            }).then(function () {
                self.applyTheme(newTheme);
            }, function (err) {
                alert(err.message);
            });
        } else {
            alert('There was a problem applying the selected theme');
        }
    });
};

/**
 * Gets the current Theme
 */
LeafNote.getCurrentTheme = function () {
    return LeafNote.currentTheme;
};

// Check for Supported Browsers. If supported, get the DB Instance, then Apply the Theme and startup the App
if (LeafNote.isSupportedBrowser()) {
    LeafNote.getDb().then(function () {
        // Apply the Current theme
        LeafNote.applyTheme();

        // Load up the MIDI Plugin and then Load the App
        MIDI.loadPlugin({
            USE_XHR: false,
            soundfontUrl: './js/assets/soundfont/',
            // Commented out Instruments for now... Causes bad Lag in FireFox when it tries to preload
            // instruments: ['acoustic_grand_piano', 'accordion', 'acoustic_guitar_nylon', 'acoustic_guitar_steel', 'alto_sax', 'overdriven_guitar', 'music_box', 'synth_strings_1', 'violin'],
            callback: function () {
                // Create a new instance of LeafNote() and call init()
                var keyboard = new LeafNote.Keyboard();
                keyboard.init();
            }
        });
    });
}
// If browser isn't supported, display an 'Unsuppported Browser' message
else {
    var unsupportedContent = $('<div/>', {
        html:
            '<div class="simple-logo"></div>' +
            '<div class="background">' +
                '<div><p>You are using a browser which is currently not supported. We hope to support ' +
                'it in the near future, but in the meantime, we recommend using the latest ' +
                'version of Google Chrome or FireFox.</p></div>' +
            '</div>',
        'class': 'unsupported-browser'
    });
    $('html').removeClass('noTheme').attr('class', 'noSupport').find('body').html(unsupportedContent).show();
}