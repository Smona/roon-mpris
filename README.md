This is a fork of [brucejcooper/roon-mpris](https://github.com/brucejcooper/roon-mpris) with updated dependencies, improved logging, and decentralized zone configuration. It resolves all the issues I ran into trying to use the original repo.

# Description

Want to control [Roon](https://roonlabs.com/) from your keyboard on linux?  You can run [Roon on Wine](https://github.com/RoPieee/roon-on-wine) which allows you to select albums to play or whatever, but this does not hook up to the standard media control buttons (PLAY, PAUSE, NEXT, PREV) that are often integrated via [MPRIS](https://www.freedesktop.org/wiki/Specifications/mpris-spec/) (`playerctl`).

This little script provides a way to have MPRIS control Roon's basic functions, like Play, Pause, Next and Previous. It also exposes the playing track's artist, title, playback progress, and album art to MPRIS.

# Installation

1. Install this software. You can either install it with NPM:
    ```bash
    npm install -g github:Smona/roon-mpris
    ```
    
    Or if you use Nix, use the included `flake.nix` or `default.nix`:
    ```nix
    # flake.nix
    inputs = {
      roon-mpris = {
        url = "github:Smona/roon-mpris";
        inputs.nixpkgs.follows = "nixpkgs";
      };
    }
    
    # configuration.nix
    environment.systemPackages = [ inputs.roon-mpris.packages.${pkgs.system}.default ]
    ```
1. run the script from any directory. Note that this will create a configuration file in `${HOME}/.config/roon-mpris`. 

   Once you have a command that works, you'll probably want to set it up to run on login using your desktop environment, window manager, or a systemd service.
    ```bash
    # auto-discover Core
    # --zone is required, and specifies the name of the zone that 
    # should be displayed & controlled from your device.

    roon-mpris --zone <zone name>
    
    # specify Core location (try this if auto-discovery doesn't work quickly).
    # --port should be a TCP port between 9100 and 9330 (defaults to 9100).

    roon-mpris --host <IP address> --port <port> --zone <zone name>
    ```
1. In your existing Roon application (phone or desktop) Go to `Roon` -> `Settings` -> `Extensions`.  You should see the "MPRIS adapter". Click "Enable" to permanently allow the extension to connect to the Core.
1. Use your keyboard to control playback.  Supported keys are PLAY, PAUSE, PLAY/PAUSE, STOP (which appears to just pause), NEXT and PREV

## Troubleshooting
the Roon API uses UDP multicast packets to discover Roon cores on the same subnetwork.  Some computers/networks block these packets, requiring you to connect directly to the host running the core.  Run ```roon-mpris --help``` to see the options that allow you to do this.

You can also specify a log level (try `all`) that the API uses to report what is going on.  That might help.

I had a couple of situations where I thought it was broken, but it turned out I just hadn't enabled and configured my plugin in roon.  Make sure you do that.

# Credits

Original credit to [@brucejcooper](https://github.com/brucejcooper) for getting this extension so close to ready! Go see his credits on the original repo.

