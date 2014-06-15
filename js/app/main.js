/**
 * LeafNote Namespace
 */
var LeafNote = {
    // Create the Local leafNote DB Instance, if none exists
    db: (typeof(PouchDB('leafNote')) === "undefined") ? new PouchDB('leafNote') : PouchDB('leafNote'),

    // Stores the current theme
    currentTheme: '',

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
                return true;
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

// Apply the Current theme
LeafNote.applyTheme();

/**
 * Load the MIDI Plugin and Create a Load up the Application
 */
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