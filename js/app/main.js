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
LeafNote.checkForClientSupport = function () {
    var agent = navigator.userAgent;

    // Look for the Default Android Browser - It doesn't like WebSQL so it won't support the App
    if (agent.indexOf("like Gecko) Version") >= 0) {
        var version = parseFloat(agent.slice(agent.indexOf("like Gecko) Version") + 20));

        if (version <= 4.0) {
            alert('You are using an Android browser which is currently not supported. We hope to support it in the near future. In the meantime, we recommend using the Google Chrome app for Android.');
        }
    }
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
        return new PouchDB(LeafNote.getDbName());
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

// Check for Browser Support
LeafNote.checkForClientSupport();

// Get the DB Instance, then Apply the Theme to startup the App
LeafNote.getDb().then(function () {
    // Apply the Current theme
    LeafNote.applyTheme();
});