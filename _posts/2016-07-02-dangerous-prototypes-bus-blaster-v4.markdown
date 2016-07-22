---
layout: post
title: "Dangerous Prototypes Bus Blaster v4"
categories:
---

I've recently become the proud owner of a [Dangerous Prototypes](http://dangerousprototypes.com/) Bus Blaster v4 (as ordered June 2016, received a PCB labelled v4.1a).
These are just some notes on using the Bus Blaster, specifically with a MacOS host.

[OpenOCD](http://openocd.net/) seems like the go-to tool for JTAG:

    $ brew install openocd

It comes with configuration files for the Bus Blaster (installed at /usr/local/share/openocd/scripts/interface/busblaster.cfg by default), but when trying to use those at first, I've got an error (and a warning, perhaps more on that later):

    $ openocd -f interface/busblaster.cfg
    Open On-Chip Debugger 0.9.0 (2015-11-15-05:39)
    Licensed under GNU GPL v2
    For bug reports, read
	         http://openocd.org/doc/doxygen/bugs.html
    Info : only one transport option; autoselect 'jtag'
    Warn : Using DEPRECATED interface driver 'ft2232'
    Info : Consider using the 'ftdi' interface driver, with configuration files in interface/ftdi/...
    Error: unable to open ftdi device: unable to claim usb device. Make sure the default FTDI driver is not in use

The issue is that there's an Apple driver included with MacOS (or in my case, that I installed from FTDI) that's grabbing a handle on the FTDI interface chip in the Bus Blaster.  There's a post on [Alvaro Prieto's blog](http://alvarop.com/2014/01/using-busblaster-openocd-on-osx-mavericks) that explains in more detail, but is a little dated and recommends some things that don't work for me in MacOS 10.11 (aka El Capitan)...

Unfortunately, it seems like the new signing infrastructure in 10.11 precludes Alvaro's suggestion to modify the kext plist so that the official driver doesn't load for one specific VID/PID.  We can still manually unload/load the official driver though; either `com.apple.driver.AppleUSBFTDI` for the Apple one, or `com.FTDI.driver.FTDIUSBSerialDriver` for the FTDI one:

  1. Unload the driver: `$sudo kextunload -bundle-id name.of.the.driver.bundle`
  2. Do some stuff in OpenOCD: `$openocd -f path/to/some/openocd/driver -f and/perhaps/another`
  3. Reload the driver to restore normal operation: `$sudo kextload -bundle-id name.of.the.driver.bundle`

Seems like a pain.  Think I'll move on to the other board that came in today from China, a BeagleBone Green WiFi :).
