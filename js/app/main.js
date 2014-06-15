/**
 * LeafNote Namespace
 */
var LeafNote = {

    // Holds the DB instance
    db: (typeof(PouchDB('leafNote')) === "undefined") ? new PouchDB('leafNote') : PouchDB('leafNote'),

    // Stores the current theme
    currentTheme: '',

    /**
     * Sets up the Local DB
     */
    getDb: function () {
        if (!this.db) {
            return new PouchDB('leafNote');
        } else {
            return this.db;
        }
    },

    /**
     * Applies the currently selected theme
     * @param {string} themeId The theme id selected
     */
    applyTheme: function (themeId) {
        var self = this,
            newTheme = themeId || 'theme1',
            $themeHolderEl = $('#currentTheme'),
            themeClasses;

        // Update the selected theme in localDb
        this.db.get('theme').then(function (theme) {
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
    },

    /**
     * Gets the current Theme
     */
    getCurrentTheme: function () {
        return this.currentTheme;
    }
};

// Setup the DB
LeafNote.getDb().then(function () {
    // Apply the Current theme
    LeafNote.applyTheme();
});