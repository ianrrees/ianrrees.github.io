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

On my workbench is a more-or-less set up voltage fault injection system, but
there's a bit of software work still to do. The 78K0R that I've been tinkering
with is still mounted on a Leaf VSP board, which isn't ideal for a couple
reasons: connecting wiring for the attack requires very carefully bending pins
on the chip, which could easily go wrong when attempted on a more-valuable chip
that still has the original firmware, secondly the injected glitch comes
directly from my waveform generator rather than going through a buffer.  I've
designed and ordered a PCB that should help with both of those - I'll be able to
simply transplant the chip from a fresh VSP on to the new board, and that board
has a high performance op-amp to buffer the glitch from the signal generator.

When the glitch system is ready, I'll load some test firmware in a 78K0R that
I've already erased, then try reading it out with this technique.  If that
works, I'll repeat the technique on a micro that still has the stock firmware
that I want to modify.

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
