---
layout: post
title: "scoreboard"
categories: Electronics
---

A small group from [pact](http://www.pactgroup.co.nz/) have been spending an hour or so each week at the [makerspace](http://dspace.org.nz) for the last several weeks, learning to solder and learning a little bit of electronics too. They've finished their first projects, 555-based LED flashers, and are itching to do more! We've had an idea to make a scoreboard for their pickup basketball group as the next project, which seems quite popular. The scoreboard will involve a bit more soldering, plus some thinking about design, some programming, a little woodworking, some cleaning, and who knows what else.

I'll be designing the electronics and doing most of the programming, and would like to document the process and design here. My plan is to update this post as the project progresses, including linking to eventual github repositories for any PCB designs, electronics, etc that go with the project. It'll all be open source, so anyone interested can replicate or iterate our design. For me, this is a nice excuse to take a couple of my favourite pieces of software - [FreeCAD](https://freecadweb.org/) and [KiCad](http://kicad-pcb.org/) - out for a spin, to accomplish a couple peripheral goals, and maybe to help some folks learn some good stuff and have a good time too!

Project Goals
---
First and foremost, we want a project that is easy to solder together, involves some steps that require a bit less fine motor control than soldering, and that will result in something interesting. Secondary to those goals, we want a functioning scoreboard.

Personal Goals
---
I spend a lot of my work time reading embedded and application level code, thinking about electronics, occasionally making things work. So, while in some sense this is just a "toy project", there are a few things I'd like to accomplish with it:

  * For personal projects involving microcontrollers, I've been using AVRs since I moved on from the BASIC Stamp a decade or so ago. I'd like to get my personal toolchain moved over to ARM. While I've used some mid size ARM chips for work projects, and the BeagleBone for hobby projects, the modern ~$1 ARM micros are new to me.
  * Another project could use for a little I2C slave to UART bridge.
  * There's a cool looking KiCad-FreeCAD collaboration tool that I want to play with.

Big Picture Considerations
===
At the moment, this section is a bit of a brain-dump of considerations that I want to incorporate in the final design.

1. I like the idea of driving the finished project through an Arduino Uno compatible board - Paul has been distributing them to kids around Dunedin as part of a kit, and I think this project could provide a good talking point for what's easy to do with Ardunio.
2. Most of the soldering needs to be through-hole, and the PCBs need to have clear silkscreening that's easy to read.
3. Wiring needs to be simple. Given the scale of the display, I imagine that we'll have a PCB per segment, but I think running a pair of wires from each of 28 segments to a central controller would be a bit too tedious. So, my current thinking is to make each digit more-or-less self contained.
4. The finished scoreboard should be reasonably durable.
5. It should run off a rechargeable battery.
6. The 3D printers at makerspace are quite popular, perhaps we could use them for some parts of the project.

If each digit is self contained as in point 3, then that opens up possibilities for other permutations of the same design. For example, a traffic light could be constructed from similar components.

Components
===
The Board
---
A happy coincidence happened with this project last week. D and I had briefly discussed this scoreboard idea before, but hadn't made time to sit down and think about it too much. D and the guys were on the way down to VCW to finish up their 555 projects, but had been waylaid at the last minute.

Concurrently, the [VCW](https://valleyworkspace.org) was having a bit of a clean out, to facilitate some repair work on the building, so I was helping out in the mean time. As we were cleaning up some dirty old pieces of MDF, polycarb, and whatever else from a corner of the building, and found a weird old contraption!

![The former petrol station signs]({{ site.url }}/media/20170409-scoreboard-cleaned.jpg)

Imagine a sheet of translucent plastic maybe 1x1.5m, painted black on one side, except some big 7-segment digits masked out from the paint. On the other side are hinged baffles to cover the digits. At the time, I figured it was an old scoreboard! Perfect. Looking at it a little closer, there are two big numbers, one red and one green, formatted like 8.888, so it's more likely a sign from a petrol station. But, we can use it either way of course.

The main part of the scoreboard is a solid sheet of plastic, and the LEDs will need to be mounted through hole on the PCBs. So, there will need to be some mounting hardware between the plastic and the PCB - I'm currently leaning towards 3D printed washers which might clip on to the PCB and attach to the plastic scoreboard with adhesive.

The [Printed Circuit] Boards
---
[Dirty PCBs](http://dirtypcbs.com/), my go-to supplier of such things, has really good pricing on "proto packs" of approximately 10 10x10cm 2-sided PCBs, so I'd like to keep our design in that envelope. There will be 28 segments required, so if we're lucky, a single protopack might work with ~3x10cm average size per segment.

Power Supply
---
Our scoreboard will need to work from battery power, for a few hours per charge.
