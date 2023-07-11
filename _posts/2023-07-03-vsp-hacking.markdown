---
layout: post
title: "VSP Hacking"
categories:
---
For some unknown and possibly unhealthy reason, I've decided to try hacking in
to a Nissan Leaf VSP computer; this is the brain that provides the reverse beep,
forward (slowish) whistle, the chirps when locking/unlocking/charging, etc.

This project scratches a few itches:
  * My CANbus skills aren't what I'd like them to be
  * I'd like an excuse to try reverse engineering a firmware image
  * Breaking in to locked hardware seems like a good challenge
  * I want my car to sound like the the Jessons' (stretch goal: to "rev the
    engine" while stopped)

## Project Status
Currently, I'm pursuing a "software only" hack - the idea is to work out a way
to reprogram the VSP computer installed in a Leaf, using a device plugged in to
the OBDII diagnostic connector.  If this proves untenable, an alternative is to
make a replacement board for the VSP computer that emulates the original one.

I've set up a small CAN bus on the workbench, connecting only a VSP and a
CANable.  A hacky little program on my laptop talks with the CANable via
SocketCAN, and can play back CANbus recordings from my Leaf, this causes the VSP
to make Leaf sounds.  Well, it did, before I erased the flash in the VSP...

A Renesas EZ-CUBE is wired up to the 78K0R debug interface, which can be driven
from a Windows VM with Renesas' CS+ IDE for the same micros.  CS+ will also be
helpful for generating 78K0R images from known code, which I'll use work out how
to reverse engineer the Nissan firmware if/when it becomes available.

The first time I tried using CS+ and the EZ-CUBE to talk to the VSP micro, it
wound up with a blank flash.  I'm not 100% sure what caused that to happen; it
could have been operator error (CS+ is a bit weird), or it could be that a
security setting in the micro triggered the erase because CS+ supplied the wrong
password.

My next plan is to create a simple blinkenlights firmware for the VSP, then try
to work out what I did to cause the flash to blank, and how to avoid it
happening next time.  In the mean time, I'm sourcing another VSP!

## Theory of Operation
The VSP system is fairly straightforward.  The computer lives just above
the glove box, it's easy to get to and connects to the car wiring harness with
one connector.  Through the wiring harness, the VSP computer connects to power,
the main "car CAN" CANbus, two speakers, a switch to toggle exterior sounds, an
indicator light.  The two speakers are located under the steering wheel, and in
the engine compartment.

In normal operation, the VSP is mainly a listener on the CANbus - depending on
messages on the bus, it generates sounds out the speaker.  The VSP does also
transmit status updates on the bus, and it displays status via the LED on the
sound disable switch.  The Leaf Service Manual describes the criteria that the
VSP uses to generate various sounds, though I don't think it gets in to the
detailed CAN bus protocol.

The VSP is powered by a Renesas RL78K0R/FE3 (16 bit, 24MHz, 192kB code flash,
16kB data flash, 12kB RAM, 2.7-5.5V) which is pretty obscure.  And, obsolete.
The 78K0R connects with a Yamaha YMF827-S audio chip, with an attached flash
chip.  Presumably, this is used to generate some sounds, and play others back
from the flash, all under the command of the 78K0R.

## TODO
  * Fill in documentation gaps
    * Pinout of CN1
  * If "software only" approach isn't feasible, identify a compatible connector
    for CN1
  * Read firmware out of VSP computer
  * How to reverse engineer firmwre blob?
  * Figure out Yamaha audio chip interface/protocol.

## Hardware
The VSP computer I'm using is Nissan part number 285N6-3NF0C, the PCB inside is
labelled BZ-P5091B0E version 2.  The board is a typical 2-layer(?) affair,
there's a blue conformal coating over the IC pins, which seems to be silicone.

IC402 is the main MCU, a Renesas μPD78F1834 aka 78K0R/FE3.  Labelled D78F1834
(A2) 420KM427 .  A bit of searching indicates that there are some suppliers that
have stock of this part - I haven't requested quotes from any, but it's good to
know that it might be possible to buy a fresh micro.

IC201 is the audio chip

CN1 is the connector the car's wiring harness

CN2 is a debug connector for IC402

## Decompiler
Since we aim to reverse-engineer the firmware extracted from the VSP, we'll want
a decompiler to help translate the binary in to human-readable source code. This
aspect of reverse engineering is something I've been curious about, but I have
no previous experience with.

My understanding is that [Ghidra](https://ghidra-sre.org/) is the go-to free
tool in this area, it seems quite powerful but also complicated.  And, it's
unclear whether/how it will work for 78K0R firmware.  My plan is to start by
"reverse engineering" a simple firmware image that I've made for a more modern
architecture which is known to be supported by Ghidra.  Since I'll have the
original source code, it should be easy to tell when the decompilation result
makes sense.  Then, I'll make a similar image for 78K0R and work through
reverse-engineering it.  This way, if I'm sucessful in extracting a VSP image,
I'll not have to start from scratch with a complex firmware and mysterious
process.

## Compiler
Renesas offers an IDE called CS+ (I guess it was formerly called CubeSuite+),
which uses a few different compilers: CA, CX, and CC.  Buried in a document
called "Functions supported by CS+" - we can see that the 78K0R/FE3 is supported
only by the CA compiler.

The download links are labelled as "Upgrade" however at least for verstion 4.08,
they actually contain Windows installers for the full application which appears
to work.

## Debug Probe
Vintage Renesas debug probes/emulators are fairly easy to find on sites like
ebay and AliExpress, but most of the ones I identified are far too expensive for
this project.  There's a discontinued probe called "EZ CUBE", available for
about $40NZD on AliExpress, which is still a lot for what it is, but I bought
one of those.

The EZ-CUBE manual talks about loading firmware in to the probe before first
use, and the probe requires a Windows driver that isn't installed by CS+.  So,
I'd need the firmware and updater program, and Windows drivers.  These two
things took a little searching to find - it turns out that Rensas' English
website has a page for EZ-CUBE which doesn't link to either the driver or the
firmware update stuff, but their Chinese page has a link to [EZ-Cube
Firmware](https://www.renesas.cn/cn/zh/document/swo/ez-cube-firmware).  A
support forum post pointed me at [Windows
drivers](https://www2.renesas.cn/document/swo/usb-device-driver-ez-board-64bit?language=en)
which appear to work!

![Renesas support forum post with link to the EZ-CUBE Windows driver]({{ site.url }}/media/20230711-vsp-ez-cube-driver.png)

A Renesas doc "Functions supported by CS+" indicates that for 78K0R/FE3, either
the ICECUBE/IE850/IE850A, MINICUBE2, or E1/E20 (serial mode) debug emulators can
be used.  Notably, the EZ-CUBE is not listed on the document, however the
EZ-CUBE manual indicates that CS+ v3.00 or higher is required...

With the driver installed, the EZ-CUBE firmware update program QBEXUTL.EXE
loaded the 78K0R firmware no problem.  And, in CS+, selecting "78K0R EZ
Emulator" works with the EZ-CUBE and the VSP micro!

## EZ-CUBE to VSP connection

CN2 on the VSP has the following pinout:

| 1 | VDD (3.3V) |
| 2 | TOOL1 (series 330ohm) |
| 3 | TOOL0 (series 330ohm) |
| 4 | nRESET (series 330ohm, and has 10kOhm pullup) |
| 5 | FLMD0 (series 330ohm) |
| 6 | Ground |

The EZ-CUBE manual describes the connection to 78K0R systems, along with
settings for the DIP switches on the probe noting that "SW-4: Depend on the
target system environment.".  SW-4 has label 'T' in one direction and '5' in the
other, and sets the VDD pin to be either driven by +5V (presumably the USB
positive rail), or powered by the target.  Since the 78K0R in the VSP runs on
3.3V, we use 'T'.

## Debug Interface Security
Microcontrollers usually support some amount of security on their debug
interface, to prevent Bad People from extracting the firmware out of them.
Renesas Application Note R01AN1131EU0101 "78K0, 78K0R, RL78 and V850 Devices -
Flash Protection and Security Setting Guide" has some interesting reading.  In
particular:

 > a 10 bytes password can be chosen which needs to be transmitted before the
 > debugging interface can be used ...snip... On-chip debug option byte setting
 > will determine whether debug operation is enable or disable. This option byte
 > setting can also be set for additional protection to erase flash content in
 > case of authentication fail."

It appears that Nissan used that option...

## CAN Interface
According to the Leaf service manual, the VSP can receive from:
  * Sleep wake up signal
  * Stop lamp switch signal
  * Sound set request signal
  * Sound signal
  * Vehicle speed signal (Meter)
  * Charge sound request signal
  * READY to drive indicator lamp request signal
  * Shift position signal

## Resources
In no particular order, here are some things that might be relevant or useful:

[cangaroo](https://github.com/normaldotcom/cangaroo) - SocketCAN logging
program, can use DBC files to decode traffic on the CAN.

[Leaf DBC files](https://github.com/dalathegreat/leaf_can_bus_messages) - These
describe the format of messages on the CAN.

[CAN DBC files
explained](https://www.csselectronics.com/pages/can-dbc-file-database-intro) -
Good article+video on DBC and CAN.

[Hacking a VW Golf Power Steering ECU](https://icanhack.nl/blog/vw-part1/) -
This series of posts was particularly useful for alerting me to UDS/KWP2000, but
also has some useful info about firmware updates for these sorts of things.

[PS4 Aux Hax 2: Syscon](https://fail0verflow.com/blog/2018/ps4-syscon/) -
Interesting writeup on PlayStation 4 hacking, which seems unrelated, but it
turns out the micro is an RL78 which at some level is a descendant of the 78K0R.
This has a few useful clues regarding the debug port protection features
(interestingly, it indicates that the ROM of that chip does check the "erase
flash if debug probe password is incorrect" bit, but doesn't actually do the
erase if the password is wrong), and good pointers for attacks using glitching
and [differential power analysis](https://en.wikipedia.org/wiki/Power_analysis).

[Reverse engineering Toshiba R100
BIOS](https://hackaday.io/project/723-reverse-engineering-toshiba-r100-bios) - a
series about another 16-bit Renesas micro, which appears to use a password
protection scheme on the debug port like the 78K0R.  In their case the debug
password scheme was vulnerable to a simple timing attack.

[Renesas
R01AN1131EU0101](https://www.renesas.com/us/en/document/apn/78k0-78k0r-rl78-and-v850-devices-flash-protection-and-security-setting-guide-rev101)
\- Application Note describing flash protection and security settings for 78K0R
among others.

[78K0R Flash Leaker](https://github.com/AndrewGBelcher/78K0R_flash_leaker) - a
promising Arduino project to slowly read out from the flash, possibly that debug
password if the timing approach from the Toshiba BIOS series doesn't work.

[Stack Exchange 78K0R disassembly
question](https://reverseengineering.stackexchange.com/questions/2354/are-there-any-free-disassemblers-for-the-nec-78k0r-family-of-processors)
- only a decade old!  Seems to be a way to get assemby out from a firmware binary.

[ghidra-rl78](https://github.com/xyzz/ghidra-rl78) - I'm not sure how similar
the RL78 instruction set is to the 78K0R.
