# Rocket.Chat apps: Golinks

Automatically converts golinks (`go/some-thing`) in any message sent in any Rocket.Chat into links to a custom-defined URL-shortener service.

![logo](icon.png)

## Usage

Before the golinks app rewrites `go/` links, make sure to configure the full URL to your
shortlink provider in the settings (`Apps` > `Installed` > `Golinks` > `Settings`), e.g.:

* `https://golinks.rocket.chat/`

**Note: `https://` and the trailing slash `/` is required.**
