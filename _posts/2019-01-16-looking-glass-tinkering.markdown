---
layout: post
title: "Looking Glass Tinkering"
categories:
---

Last July, I backed a neat looking 3D display project called on [kickstarter](https://www.kickstarter.com/), to get a standard-size [Looking Glass](https://lookingglassfactory.com/).
Mine arrived early January, and I've quite enjoyed tinkering with it so far.
Currently, it's only supported via a Unity SDK in Windows and MacOS, but it presents to the host computer as a regular 2D HDMI-connected display plus a USB device (of primary interest is an EEPROM available via abuse of the HID protocol) and so hasn't been much trouble to get going from Linux.

The effect created by the display is really impressive!
Once I got mine going, I must've spent an hour or two just watching a few ~20-second [clips from vimeo](https://vimeo.com/lookingglassfactory) in 3D.

I'm not sure what I want to actually use it for yet, but am thinking it would be neat to get [FreeCAD](https://freecadweb.org/) models to display in it.
It's also got me to thinking about making a game; odd for me, as I've never really identified as a gamer, and can't remember playing video games at all since high school...

I haven't dug too much in to the details of how the display is actually manufactured, but gather that it has a rather high pixel density 2D display attached to an array of lenses made in the acrylic block.
In some sense, it works like those "3D" postcards and such, which I've recently learned are called [lenticular prints](https://en.wikipedia.org/wiki/Lenticular_printing); in the case of the Looking Glass, there are 45 distinct views presented.
To get the 3D effect, the different views are presented to the pixels under the right lenses, so each viewer's eye see only the set of pixels that's meant to be seen at that perspective.
The data sent to the 2D display then, is an interlaced set of the 45 different views.
However, the precise alignment between the lenses and the display varies between Looking Glasses, so the interlacing has to be done per-Looking-Glass.
The relevant calibration information is stored in each device, and that is made available through a little Rust library I made last weekend, [pluton](https://crates.io/crates/pluton).

The videos linked above are distribted as "quilts", with the different views in a grid arrangement, which allows the videos to be distributed in a way that mostly isn't hurt by video compression and allows for a postprocessing stage to apply the per-device calibration before the frames are sent out to the Looking Glass.
For example:

![Screen capture of video frame in quilt format]({{ site.url }}/media/20190116-quilt.png)

gets turned in to something like:

![Screen capture of video frame interlaced]({{ site.url }}/media/20190116-interlaced.png)

To do that conversion, I'm running a command like `mpv --screen=1 --fs-screen=1 --fs --opengl-shader=quiltshader.glsl --no-keepaspect -loop KeijiroWig_tx05ty09qw4096qh4096_001.mp4`, where [quiltshader.glsl]({{ site.url }}/media/20190116-quiltshader.glsl) is an OpenGL shader program containing the calibration values for my Looking Glass, based on work at [https://github.com/lonetech/LookingGlass](https://github.com/lonetech/LookingGlass).