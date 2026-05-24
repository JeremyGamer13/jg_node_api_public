# WARNINGS, PRECAUTIONS, ETC
This is purely my raw creation, dumped for others to tinker with. You may use and modify it, but do not expect me to provide support or merge pull requests.

**This is not a perfectly constructed application that will work anywhere on any device.** There is no guarantee that I will provide support, bugfixes, or updates to this program.
Thanks to my licensing, you are free to fork this project, share and create your own "perfect version", and even sell it if you are interested in doing so. I don't want to stop you from doing that.

**DO NOT EXPOSE THIS API TO THE INTERNET IF YOU DO NOT TRUST MY SOFTWARE. I will give no guarantee that this program is free of known security vulnerabilities at any time.** I have done my best to avoid introducing security vulnerabilities, but do not expose the API to the open internet if you are cautious of the capabilities that this program allows.

**This software is licensed, but not recommended for commercial use.** Due to the nature of the project, I cannot in good faith recommend any use of this program in its current state in a commercial setting. Under the licensing you are entirely free to take snippets or chunks of code for use in commercial work.

JeremyGamer13 does not assume responsibility for any issues, damages, or consequences arising from the use of this program.

JeremyGamer13 is not liable for any direct, indirect, incidental, consequential, or special damages, including but not limited to loss of data, revenue, or profits.

Despite any implemented security measures, users must acknowledge that they are using jg_node_api at their own risk. JeremyGamer13 is not responsible for any harm, loss, or damage to users' devices, data, or any other property.

JeremyGamer13 makes no warranties, express or implied, regarding the accuracy, reliability, or availability of the program or its content.

# LICENSING
My code (all code for jg_node_api) is under the MIT license. Refer to the LICENSE file for details.

The `assets` folder is **not** under the MIT license. 
Please make an issue or otherwise notify me if you want your content removed from this project or edited in some form.
I may add attribution to assets that are otherwise missing it if it is easy to do so. Unfortunately it was not one of the priorities during development.

See below for licensing info.

This repository contains third-party assets (e.g., video files, graphics, audio) for which the copyright status is unknown or held by external parties. These assets are not licensed under the MIT License and are included in this repository solely for the purpose of demonstrating the program's functionality.

Users are responsible for ensuring they have the appropriate rights, licenses, or permissions for any assets used if they deploy this software in a public or commercial environment. The author claims no ownership or rights to these third-party assets and assumes no liability for their unauthorized use.

# jg_node_api
jg_node_api. My own API with silly capabilities and features.

This program can run in two states:
- api mode: functions purely as an API silently running in the background
- electron mode: will create windows, taskbar items, play audio, show content on your screen, etc. Meant for stream overlays (ie, discord screenshare or actual livestreams.)

You may want to connect this API to [Jeremy Stream Bot](https://github.com/JeremyGamer13/PenguinBot-Forks/tree/jeremy-stream-bot) for an easier interface of more API features.
More features may be added to the built-in electron UI at some point.

**Exposing this API to the outer internet with ALL permissions enabled may jeopradize your system.** Nothing genuinely/permanently harmful *should* be possible, but people can overload your system with stream overlays and other features if you are not careful. I would recommend not using electron mode if you are going to enable all permissions.

Some endpoints may temporarily download content to your device. Some content can be as large as gigabytes, but generally the API will refuse obscenely large downloads when possible. Some large downloads or temporary files may leak through on rare occasions (ex, shutting down before a download process finishes, JS errors, etc). You may want to routinely clean up the `temp` and `cache` if you notice that those folders are getting too large.

## Related Repos
[jg_node_utils](https://github.com/JeremyGamer13/jg_node_utils)
[Jeremy Stream Bot](https://github.com/JeremyGamer13/PenguinBot-Forks/tree/jeremy-stream-bot)

## Setup (to my knowledge)
> [!IMPORTANT]
> I HAVE ONLY MINIMALLY RAN THIS SOFTWARE ON UBUNTU/LINUX! Linux support will only get better once (if) I eventually move to using it full-time.

**Please CLONE this repository properly with Git, do not download it as a ZIP.**
If you do not do this, future features relating to managing the GitHub repository will cause undefined behavior.

### Core setup
1. Install Node.js, preferably v18 or v20. **Newer versions of Node may not be compatible out of the box with Canvas or other modules yet.**
2. Install Git
3. Create a `cache` and `temp` folder in the root folder for jg_node_api.
4. Install all of the node modules with `npm ci` or `npm i`
    - If you have `nvm` installed to switch between Node installations, you may need to rebuild canvas when switching versions by using `npm rebuild canvas`
5. Duplicate `.env.template` and rename it to `.env`, then fill any of the information you can.
    - Certain keys are used only when the api is ran for electron
6. Run the API
    - `npm run electron`: Electron mode (you probably want this if you want the overlays & API GUI)
    - `npm start`: API mode

> [!IMPORTANT]
> On linux, Make sure to install/run `sudo apt-get install imagemagick` for screenshots to work

### Additional setup (more features)
- To add more overlays
    - Make sure to clone [jg_node_utils](https://github.com/JeremyGamer13/jg_node_utils)
    - then find `link-jg-node-utils.js` in jg_node_api, configure it to point to your jg_node_utils,
    - then run it with Node
    - Modify jg_node_utils to create your overlays & add assets in jg_node_api for the overlays to actually use
- Install [`espeak-ng`](https://github.com/espeak-ng/espeak-ng) to path for espeak-ng TTS voices
    - you can edit .env if you dont want to add it to path (`|` characters separate CLI arguments)
- Install [Balabolka's CLI application `balcon`](https://www.cross-plus-a.com/bconsole.htm) to path for SAPI4/5 TTS voices
    - you can edit .env if you dont want to add it to path (`|` characters separate CLI arguments)
    - Some jg_node_api preset voices (the ones with `x-` like `x-BonziBUDDY`) rely on other voices to be installed to your system
        - At this time i don't have the links to the installers for getting TruVoice voices like Adult Male #2 but you may find them online quite easily
        - Installation of Cepstral voices may be difficult due to their licensing requirements. Downloading the free versions may work, but your speakers have a chance to *live output* `"This voice is not licensed. Please visit www.cepstral.com to purchase a license."` upon each TTS generation.
    - The nature of Balabolka makes me assume that it will likely be harder to get working on Linux, you may want to make your own implementation of this or disable it entirely (set the .env value to nothing)
- Install [`ffmpeg`](https://ffmpeg.org/download.html) to path
- Install [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) to path for YouTube audio downloads