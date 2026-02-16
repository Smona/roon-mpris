#!/usr/bin/env node
"use strict";

const RoonApi = require("node-roon-api");
const RoonApiSettings  = require("node-roon-api-settings");
const RoonApiTransport = require('node-roon-api-transport');
const Player = require('mpris-service');
const yargs = require('yargs');
const os = require('os');
const fs = require('fs');


const argv = yargs
    .option('host', {
        alias: 'h',
        description: 'Hostname to connect to, rather than using Roon discovery',
        type: 'string'
    })
    .option('port', {
        alias: 'p',
        description: 'The port to connect to when connecting directly to a host',
        type: 'number',
        default: 9100
    })
    .option('config', {
        alias: 'c',
        description: "Where the app's configuration will be stored.  This directory will be created if it does not exist",
        type: 'string',
        default: `${os.homedir()}/.config/roon-mpris`
    })
    .option('log', {
        alias: 'l',
        description: 'The amount of Roon logging to output',
        type: 'string',
        default: 'none'
    })
    .option('zone', {
        alias: 'z',
        description: 'Display name of the zone mapped to this machine',
        type: 'string',
    })
    .help()
    .argv;

var core;
var zone;

function zoneChanged(new_zone) {
    zone = new_zone;
    var url = core.moo.transport.ws._url.substring(5);
    var now_playing = zone.now_playing;

    if (now_playing) {
        mpris.metadata = {
            'mpris:length': now_playing.length ? now_playing.length * 1000 * 1000 : 0, // In microseconds
            'mpris:artUrl': `http://${url}/image/${now_playing.image_key}`,
            'xesam:title': now_playing.three_line.line1,
            'xesam:album': now_playing.three_line.line3,
            'xesam:artist': now_playing.three_line.line2.split(/\s+\/\s+/),
        }    
    }
    mpris.playbackStatus = zone.state.charAt(0).toUpperCase() + zone.state.slice(1); 
    mpris.canGoNext = zone.is_next_allowed;
    mpris.canGoPrevious = zone.is_next_allowed;
    // mpris.canPlay = zone.is_play_allowed; // the ubuntu dock widget disappears if this is set to false (while playing)
    mpris.canPause = zone.is_pause_allowed;
    mpris.canSeek = zone.is_seek_allowed;
}

function setSeek(seek) {
    // The zone object is automatically updated as the events come in, so there's no need to update it.
    // console.log(zone);
    mpris.position = seek * 1000 * 1000;
}

const working_directory = `${os.homedir()}/.config/roon-mpris`
fs.mkdirSync(working_directory, { recursive: true });
process.chdir( working_directory )

const roon = new RoonApi({
    extension_id:        'com.smona.roon-mpris',
    display_name:        "MPRIS adapter",
    display_version:     "1.0.0",
    log_level:           argv.log,
    publisher:           'Mel Bourgeois',
    email:               'mason.bourgeois@gmail.com',
    website:             'https://github.com/Smona/roon-mpris',
    core_paired: function(core_) {
      console.log('paired with core:', core_.display_name)
      core = core_;

      let transport = core.services.RoonApiTransport;
      transport.subscribe_zones(function(cmd, data) {
        if (!data) {
            console.warn("Received unexpected message with no data: ", cmd);
            return;
        }

        // When we connect, we receive a zones event.  When a zone chages, we receive a zones_changed.
        // They are the same type, and we treat them the same.
        var zones = data.zones_changed || data.zones;
        if (zones) {
            for (var candidate of zones) {
                // We only want to respond to our configured zone.
                if (argv.zone && candidate.display_name === argv.zone) {
                    zoneChanged(candidate);
                }
            }
        } else if (data.zones_seek_changed) {
            for (var change of data.zones_seek_changed) {
                if (zone && change.zone_id === zone.zone_id) {
                    setSeek(change);
                }
            }
        } else {
            console.log(core.core_id,
                core.display_name,
                core.display_version,
                "-",
                cmd,
                JSON.stringify(data, null, '  ')
              );      
        }
  
      });
    },
    core_unpaired: function(core_) {
      core = core_;
      console.log(core.core_id,
        core.display_name,
        core.display_version,
        "-",
        "LOST"
      );
      core = undefined;
      // attempt to re-connect
      connect_to_core()
    },
});


var mysettings = roon.load_config("settings") || {
    zone: null,
};


function makelayout(settings) {
    var l = {
        values:    settings,
        layout:    [],
        has_error: false
    };
  
    l.layout.push({
        type:    "zone",
        title:   "Zone",
        setting: "zone",
    });  
    return l;
}
  

const svc_settings = new RoonApiSettings(roon, {
    get_settings: function(cb) {
      cb(makelayout(mysettings));
    },
    save_settings: function(req, isdryrun, settings) {
      let l = makelayout(settings.values);
      req.send_complete(l.has_error ? "NotValid" : "Success", { settings: l });
  
      if (!isdryrun && !l.has_error) {
        mysettings = l.values;
        svc_settings.update_settings(l);
        roon.save_config("settings", mysettings);
      }
    }
});
  
roon.init_services({
  required_services: [RoonApiTransport],
});
  

// My Work laptop blocks UDP by default, so we use the direct connect method
function connect_to_core() {
    if (argv.host) {
        console.log(`Connecting to Core at ws://${argv.host}:${argv.port}`)
        roon.ws_connect({ host: argv.host, port: argv.port});
    } else {
        console.log("Autodiscovery of Core")
        roon.start_discovery();
    }
}
connect_to_core();


var mpris = Player({
	name: 'roon',
	identity: 'Roon',
	supportedUriSchemes: ['file'],
	supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
	supportedInterfaces: ['player']
});

mpris.getPosition = function() {
  // return the position of your player
  return zone ? zone.now_playing.seek_position * 1000 * 1000 : 0;
}

// Events
var events = ['raise', 'quit', 'pause', 'play', 'seek', 'position', 'open', 'volume', 'loopStatus', 'shuffle'];
events.forEach(function (eventName) {
	mpris.on(eventName, function () {
		console.log('Event:', eventName, arguments);
	});
});

['playpause', 'stop', 'next', 'pause', 'play', 'previous'].forEach(function (eventName) {
    mpris.on(eventName,  () => {
        console.log("Executing event", eventName);
        if (zone) core.services.RoonApiTransport.control(zone, eventName)
    });
});


mpris.on('quit', function () {
	process.exit();
});
