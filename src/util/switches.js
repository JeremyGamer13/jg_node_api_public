class Switches {
    static values = Object.create(null);
}

// Your switches go here
// NOTE: Switches that match /[^a-z0-9]/i cannot be set by users
Switches.values.testSwitch = true;

module.exports = Switches;
