---
layout: post
title: "Programming Rust for KaiOS"
categories:
---

In little fits and spurts, I've been tinkering with development targeting a KaiOS phone, a Nokia 8110 4G, with the aim of building Rust apps to run on it.
Here's how to get started, as of December 2019.

Background, current state
---

My early impression was that the phone ran a new enough Firefox to run WebAssembly. On deeper investigation though, the current KaiOS runs apps in Firefox 48 (see notes at the bottom), where support for WebAssembly starts at 52 according to [Mozilla's docs](https://developer.mozilla.org/en-US/docs/WebAssembly#Browser_compatibility).
While WebAssembly won't run on a current KaiOS phone, Rust can target Emscripten's asm.js, and asm.js will run on Firefox 48.

I found that getting started with Emscripten, and loading code on to the phone, were both a bit of a pain...
For reasons I still don't understand, the Emscripten I first installed didn't work right, builds kept crashing with what looked like a link error.
The KaiOS [official guide](https://developer.kaiostech.com/getting-started/env-setup/os-env-setup) suggests using WebIDE, the blog posts I found said the same.
The problem is that Firefox dropped WebIDE several versions back; I use Firefox as my main browser and had to go through all sorts of convolutions to get WebIDE running in an old version of Firefox.

To get around the WebIDE issues, I grabbed some logs of the TCP traffic between WebIDE and adb while doing some basic operations like loading an app on to the phone.
Then, I started work on a Python tool to load apps via just that tool and adb.
While I was working on the Python tool, I asked on the #8110 channel if there were any other features that would be good to support, and [Fabrice](https://github.com/fabricedesre) pointed me to his [b2gclitool](https://github.com/fabricedesre/b2gclitool), which does exactly what I was looking for!
b2gclitool works much better than the WebIDE solution I had landed on: using Pale Moon 28.6.1, an old version as they also dropped WebIDE a few months ago with v28.7.0...

So, here's a recipe for making a "Hello World" in Rust and loading on a KaiOS phone, from an Ubuntu host.

App Structure
---

There may be other ways to accomplish this, but the example from kaiosrt is simple enough.  The app is contained in a directory like so:

```
➜  hello tree
.
├── app.js
├── icons
│   ├── icon128x128.png
│   ├── icon16x16.png
│   ├── icon48x48.png
│   └── icon60x60.png
├── index.html
└── manifest.webapp

1 directory, 7 files
```

manifest.webapp specifies the initial HTML file, the icons, and a few other fields. index.html in turn loads app.js - it works just like in a regular browser. I've packed up the above example and [attached it here]({{ site.url }}/media/2019-11-04-hello-js.tar.bz2).


Loading Code
---

You'll first need some TLAs:

```
# apt install adb npm git
```

Use git to fetch a copy of Fabrice's [b2gclitool](https://github.com/fabricedesre/b2gclitool), then have npm fetch its dependencies:

```
$ git clone https://github.com/fabricedesre/b2gclitool.git
$ cd b2gclitool
$ npm install
```

At this stage, hopefully you can connect your KaiOS phone to your computer via USB, put it in debug mode by dialing \*#\*#DEBUG#\*#\* (aka \*#\*#33284#\*#\*), and detect it with adb:

```
$ adb devices
List of devices attached
* daemon not running; starting now at tcp:5037
* daemon started successfully
2293f405    device
```

Once you're at that stage, set up adb to listen on TCP port 6000 and forward that to your phone - I believe port 6000 is hard-coded in b2gclitool:

```
$ adb forward tcp:6000 localfilesystem:/data/local/debugger-socket
```

Then, use b2gclitool to load the app to your phone:
```
$ path/to/b2gclitool/b2g.js install app/directory/path
```

Ideally, the phone will launch your app, and you'll see the useragent string of the app environment - currently on my phone, that is "Mozilla/5.0 (Mobile; Nokia_8110_4G; rv:48.0) Gecko/48.0 Firefox/48.0 KAIOS/2.5.1".

Building a Rust app
---

At this stage, I've only ventured as far as making a Rust function that's callable from JS; it's likely possible to do much fancier things with this tooling.
Note the crash handling in my example isn't great, to see this keep pressing the up arrow until the 40-something'th term...

First, grab [a slightly fancier example app]({{ site.url }}/media/2019-11-04-hello-rust.tar.bz2) (in this file I have included compiled Rust code from below, so it should run "out of the box").
The two relevant changes in JS are the inclusion of rust.js from index.html, and a call to `_fibonacci()` from app.js - pretty straightforward!

Rust source code; save this as rust.rs:
```
/// rustc needs us to have a main()
fn main() {}

/// Returns n'th fibonacci number
#[no_mangle]
pub extern fn fibonacci(n: usize) -> usize {
    let mut n_2 = 1;
    let mut n_1 = 1;
    for _ in 1..n {
        let total = n_2 + n_1;
        n_2 = n_1;
        n_1 = total;
    }

    n_1
}
```

The main trick here has to do with building Emscripten; in theory, it seems like this should all be possible with a simple `rustup target add asmjs-unknown-emscripten`, then installing Emscripten as described on [on their site](https://emscripten.org/docs/getting_started/downloads.html), however I couldn't get a good compile via that route.
It might be worth trying the above, before following the steps below, in case I ran in to a bug which has been fixed since...

First, fetch and build Emscripten - this is just like their docs, except replace the "latest" with "sdk-incoming-64bit". I think the operative change may simply be that this forces a local compile on your machine (warning: it might take a while) but I haven't investigated too far.

```
$ git clone https://github.com/emscripten-core/emsdk.git
$ cd emsdk
$ ./emsdk install sdk-incoming-64bit
$ ./emsdk activate sdk-incoming-64bit

Note: Do this for each shell you'll use emscripten in, or
add add an equivalent to your shell startup script.
$ source ./emsdk_env.sh
```

Once `emcc --version` gives reasonable looking output (I'm using 1.39.2 currently), set up Rust to target asmjs via emscripten:

```
$ rustup target add asmjs-unknown-emscripten
```

Finally, you should now be able to use rustc to compile the rust.rs from above, in to JavaScript code that will run on your KaiOS phone!
cd in to the directory where you've saved rust.rs, and do:

```
$ rustc --target=asmjs-unknown-emscripten rust.rs
```

This should generate a file rust.js, which is relatively huge due to containing all sorts of boilerplate, comments, and an execution environment. I believe it's possible to strip the vast majority of that out, but that's a project for another day.

Debugging
---
`$ adb logcat` is your friend, though it does dump quite a lot of information.
To filter output, something like `$ adb logcat | grep 'your-app-name'` works well.

Next steps
---

  * If KaiOS continues to be a thing, then hopefully there will be an update to the Firefox used for running apps on it.
When this happens, I'd hope that WebAssembly will be supported, and so the above info about asm.js will become obsolete and we'll have a more efficient and widely-supported tool.

  * The end goal I had in mind when starting on this is to make a [Signal](https://www.signal.org) client for KaiOS.
I haven't gone too far down this road yet, but there is a [Signal Protcol library for JS](https://github.com/signalapp/libsignal-protocol-javascript).
So, I guess the next step is seeing whether the dependencies of that are met in the KaiOS environment.

  * I started out writing a little Python program to load apps on to the phone, before learning about b2gcliool.
While b2gclitool does exactly what I need for now, I might follow through with that Python tool mainly as a fun project, but also because npm spits out several deprication warnings when grabbing dependencies for it.
Plus, I wouldn't otherwise need npm on my system.


Footnotes, futher reading
---

  * An excellent [blog post by Nolan](https://nolanlawson.com/2019/09/22/the-joy-and-challenge-of-developing-for-kaios/) goes in to a bit more detail about the app execution environment.

  * [BananaHackers.net](https://bananahackers.net) is a sort of hub for hacking on these KaiOS phones

  * There's a #8110 on freenode where a few KaiOS tinkerers hang out (kids: that's [IRC](https://en.wikipedia.org/wiki/Internet_Relay_Chat)).

  * [Minimal Rust WebAssembly](https://www.hellorust.com/demos/add/index.html)

  * [GerdaOS](https://gerda.tech/) looks like a cool alternative KaiOS build, I haven't tried it yet.