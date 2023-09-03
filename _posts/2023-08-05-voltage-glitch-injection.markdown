---
layout: post
title: "Voltage Glitch Injection"
categories:
---

As a part of my [VSP hacking project]({{ site.url
}}/2023/07/03/vsp-hacking.html), I've been building a system to read firmware
out of Renesas 78K0R microcontrollers, despite it being protected, using voltage
glitch injection. Specificially, the system and attack are both described in
[_Shaping the
Glitch_](https://tches.iacr.org/index.php/TCHES/article/view/7390/6562).

Previously in the VSP project, I had a look at an existing implementation of the
same attack, [78K0R Flash
Leaker](https://github.com/AndrewGBelcher/78K0R_flash_leaker), but decided to
try rolling my own.  There are a few reasons for this: I've got a pretty good
arbitrary waveform generator, but not a board that the 78K0R Flash Leaker
firmware would run on without modification.  I'm also not clear on how much
78K0R firmware I'll need to read out via this system, and it would be
frustrating to spend a fair bit of hobby time on reading out the first few bytes
(debug security settings) only to discover that the rest of the flash needs to
be read through an incredibly slow process (rather than just a normally-slow
process), so that building the faster system was necessary anyway.

Probably most importantly, this is a hobby project and I quite like the idea of
the system tuning parameters of the glitch attack to suit the situation.  This
could be fun to play with, beyond the VSP project!

## Status/Plan

![Animated gif of 78K0R Glitch attack hardware with LEDs blinking]({{ site.url
}}/media/20230815-glitch-setup.gif)

On my workbench is a more-or-less set up voltage fault injection system, but
there's a bit of software work still to do.  There are basically 3 chunks of
code that I've been working on, and the combination of them is just now able to
talk with the 78K0R's flash programming interface.  From the top, the pieces are:
  1. An application that runs on a regular computer, to control the rest of the
     system.  This communicates with the waveform generator (a Siglent SDG2122X)
     and with the glitch coordinating hardware (Adafruit Metro M4 Express).
  2. A library for interfacing with electronics test equipment, currently just
     the waveform generator, over a wired network, but I may add USB support as
     I've had some problems with the network interface on this particular piece
     of gear.  This is separate from 1, because I've got a few other pieces of
     gear that would be nice to be able to write programs to deal with.
  3. Firmware for the glitch coordinating hardware.  In order to precisely time
     the glitch, I want to generate a trigger pulse for the signal generator at
     a precisely controllable amount of time after the writing a command to the
     78K0R.  This works under USB control of the application on the regular
     computer, and will handle the basic 78K0R flash interface so that flash
     readout can be run as fast as the target MCU will allow.

Here's a "Hello World!" screenshot - the TOOL0 interface line is a bidirectional
UART, but the glitching hardware has a typical separate RX and TX line, so I
currently have those diode-ORed together for simplicity.  But, a nice benefit of
this scheme is that the analog RX trace makes it clear where TOOL0 is being
driven by the glitching hardware (about 0.5V minimum) or the 78K0R (0V minimum):

![Logic analyzer readout showing received data from 78K0R]({{ site.url
}}/media/20230809-rx-from-flasher.png)

The 78K0R that I've been tinkering with has been moved from the Leaf VSP board,
on to a PCB that I've designed for this purpose, and I have enough software in
place that the basics of the attack seem to work.  But, so far, I've not managed
to get the 78K0R to leak any information.

One issue is to do with the op-amp buffer on the custom board; I didn't spend
much time on choosing the op-amp, and think I may have accidentally bought one
that isn't a good match for the rest of the circuit.  However, my signal
generator seems like it should be adequate without a buffer, so for now I've
bypassed the op-amp.  Can always come back to that later if needed!

When the glitch system is ready, I'll load some test firmware in this 78K0R
(which I've already erased the stock firmware from), then try reading it out
with this technique.  If that works, I'll repeat the process on a micro that
still has the stock firmware that I want to modify!

## Background
78K0R supports a feature which optionally enables debugger access via a 10-byte
code, but erases the flash if a debugger is connected and supplied with an
incorrect password.  Both the security settings and the password are stored in
the same flash as the firmware. Debugger access would make it easy to read out
the entire flash quickly and accurately, but reading flash via the glitch attack
will be very slow if it works at all. So, I'll attempt to read the password via
the glitch attack, before moving on to the rest of the firmware if necessary.

Having read [_Shaping the
Glitch_](https://tches.iacr.org/index.php/TCHES/article/view/7390/6562), and
quickly skimmed over [78K0R Flash
Leaker](https://github.com/AndrewGBelcher/78K0R_flash_leaker) source code that
implements an attack from that paper, it's now clear that the flash dumping
operation could be a bit more complicated than "lift a pin, solder in a
transistor, program Arduino, retrieve password" which is admittedly what I'd
assumed.  The paper describes using an aribitrary waveform generator to inject
glitches, rather than a simple transitor to ground. Wrapped around the glitch
injection hardware and the target, is a genetic algorithm that tunes the glitch
waveform parameters.  But, that algorithm isn't described in much detail -
perhaps my ignorance of genetic algorithms is showing, and if necessary I'll
study more closely.  The authors use this overall technique, which they call
AGW, to discover vulnerabilities in the 78K0R, and identify a few approaches to
read out data using these vulnerabilities. "SequentialDump" is the most
straightforward approach, though slowest, and all are substantially faster to
exploit using AGW compared to traditional transistor-based glitch injection.

The Flash Leaker tool seems to implement SequentialDump as described in the
paper, but using simple transistor based(?) glitch injection hardware, rather
than a genetic-algorithm-optimised arbitrary waveform, so it is much slower than
the paper's approach. Using AGW, I'd expect extracting the complete VSP flash
contents (192kB of code and 16kB of data, in the specific part I'm interested
in) via SequentialDump could take about a week. That increases to over 3 weeks
with a simple glitch injector.  These are fairly crude estimates; there will be
some amount of blank flash, which will be much faster to read out than the other
information.  But, of course, I don't know in advance how much of the flash
isn't blank!

## Design

### Hardware

![Screenshot of KiCad PCB design for the new PCB]({{ site.url
}}/media/20230717-78K0R-board-design.png)

The hardware provides a simple unity gain buffer, between the signal generator
and the MCU power supply.  The buffer is based around a fairly high performance
rail-to-rail op-amp, MAX4012.  Otherwise, it's just a simple breakout board for
the 78K0R with headers for the programming interface, a few LEDs, and power
connections.

I didn't spend much time on the buffer design, and would do it differently next
time.  For one; I'd use a current feedback op-amp, as that would be better
suited for this application.  Secondly, I didn't pay enough attention to the
power supply requirements; although the MAX4012 is happy enough operating from a
single 3.3V supply, the input common mode voltage range only goes up to
Vcc-2.25V, and with the unity gain amplifier wanting to output 3.3V that creates
a problem...  Happily, it's not too hard to re-work the PCB so I can power the
buffer from a higher voltage than the rest of the board, but it's a bit of an
unnecessary hassle.

A couple scope captures illustrate the problem, first one showing an input
(yellow) and output (blue) signal, with the buffer powered by 3.3V:

![Oscilloscope capture showing triangle wave input, distorted output]({{
site.url }}/media/20230903-supply_3v3.png)

Turning the buffer supply up to about 6V produces a much better transfer result:

![Oscilloscope capture showing triangle wave input and output]({{
site.url }}/media/20230903-supply_6v.png)

Running the buffer off a higher voltage supply also reveals another design
fault: the input to the buffer is floating unless driven by the signal
generator.  This means that the output of the buffer can flail around between
ground and the roughly 6V rail it now runs on - it turns out that running the
buffer at about 6V, given the wide operating supply range of ye olde 78K0R, is
OK.  But, that would fry modern chips, just to be safe I've gone ahead and added
a 10kOhm resistor from the buffer input to ground.

I've also found that the buffer doesn't sink enough current to get the 78K0R
supply lower than about 1.25V, on a ~10ns timescale.  While this isn't great,
I've found that making the glitches a bit longer in duration does result in the
78K0R falling over, so perhaps it's good enough to work as-is.  In any case, the
next step is in software, so I've made a couple measurements to get an idea of
what would be required to take the voltage lower if an electronics revision is
needed.  Yellow is input from the arbitrary waveform generator, blue is output
of buffer to the 78K0R:

![Oscilloscope capture showing input from signal generator and output to 78K0R -
input makes smooth sinus dip to 0V, output has floor about 1.25V for about
15ns]({{ site.url }}/media/20230903-buffered-glitch.png)

So, as a bullet-point list:
  * Board should take ~6V input, provide variable regulated lower voltage supply
    for target chip.
  * Put some gain in the buffer circuit, to both reduce common-mode voltage
    requirements, and sharpen edges of glitch.
  * Add input termination resistor (50Ohm matching?).
  * Limit leakage current through control signals (reset, FLMD0, UART, etc).
  * Higher current buffer.

## Resources

[PS4 Aux Hax 2: Syscon](https://fail0verflow.com/blog/2018/ps4-syscon/) -
Interesting writeup on PlayStation 4 hacking, which might seem unrelated, but it
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

[78K0R Flash Leaker](https://github.com/AndrewGBelcher/78K0R_flash_leaker) -
Arduino project to (very slowly, per docs) read out from the flash, possibly
that debug password if the timing approach from the Toshiba BIOS series doesn't
work.  My implementation was heavily influenced by this one.

[78k0-flash-utility](https://github.com/mnh-jansson/78k0-flash-utility) - Python
implementation of some of the 78k0 flash interface.  Had a few good clues, in
particular around holding FLMD0 high to enter flash programming mode.
