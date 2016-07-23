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

Seems like a pain.

Buffer Drivers
---

TODO: Section on buffer drivers; how to change between the two current ones, and thoughts on making a single driver that can be switched between two modes via a jumper.

JTAG Pinouts
---
In my limited experience, it seems like there are two broad types of USB JTAG adapters (aka emulators, if you still call them that); vendor specific ones (eg the Atmel AVR JTAGICE) and general purpose ones (eg Segger J-Link or the Bus Blaster).  Vendor specific JTAG adapters often seem to have 10- or 14-pin connectors, each vendor with a different pinout, where the general purpose ones often use a more-or-less standard 20-pin connector.  The electrical signals used seem to be generally compatible, or at least easily adaptable, between different JTAG implementations.  But, the pinouts are anything but standardised...

This all means that in order to use a JTAG adapter like the Bus Blaster, it's usually necessary to make up an adapter that's appropriate for each type of board being programmed.  That seems a bit of a pain, for no good reason.

### Adapting the adapter

Around the same time I ordered the Bus Blaster, I set out to make the [One True JTAG Adapter Board](https://github.com/ianrrees/busblaster-adapter).  My plan was to have a PCB with two dual-row headers, and a bunch of jumper positions in the middle.  This board would sit between the Bus Blaster and the cable to the target.  The board would fit within the 5x5cm limits of the really cheap 2-layer "Protopack" from [DirtyPCBs](http://dirtypcbs.com/), so I'd have roughly 10 identical boards, which would be customised by setting appropriate solder jumpers for each of the few different JTAG pinouts that I'm interested in using:

![JTAG Adapter Front]({{ site.url }}/media/20160723-jtag_adapter_front.png)
![JTAG Adapter Back]({{ site.url }}/media/20160723-jtag_adapter_back.png)

While creating the PCB layout was obviously more work than using protoboard to make up a few adapters for different JTAG connectors, I figured that the finished design would be easier to employ than making custom adapters.

It's an ugly problem and this seemed like a reasonable compromise, even if the idea doesn't scale well.  I was planning on tidying up the layout and ordering a few the other day, when a friend suggested adding the MSP430 JTAG pinout and I realised that was going to require a lot of rearranging.  I gave up on that plan...

The Bus Blaster v4 has a CPLD between the USB chip and the connector - why not change the CPLD code to have it re-map the JTAG connector to match whatever board is being worked on?

  1. The most obvious reason is that 9 of the 20 pins on the Bus Blaster are hard wired to ground, and two other pins are wired together.

  2. There is a limit to the number of times the CPLD can be reprogrammed, but it's specified at 1000 (for a $4 part on a $45 board).  But, that's only about 4.5 cents per configuration change if the whole board is trashed when it stops working.  And, it should be possible to verify the programming to flag any problems when they appear.

  3. An additional consideration is that the Bus Blaster v4 does some clever stuff with the target voltage sensing, so the current design restricts the VTG pin to be in one of two physical positions.  That should be easy to design around with an inexpensive diode-OR scheme (eg using 20x BAT54S), or simply a jumper and regulator to manually select the target voltage.

Those items all seem to be quite solvable.  As a sort of test case, I intend to get more familiar with the CPLD to see how much sense it would make to make a new version of the Bus Blaster, where the pinout is software selectable.
