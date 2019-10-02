---
layout: post
title: "Book Review, Pulse Generator, and Probing"
categories:
---

Over the last month or two, I've been reading Johnson and Graham's _High Speed Digital Design_; it's a classic book on topics that might normally be thought of as "analog", but are important in designing digital electronics.
Very good read as far as electronics books go!

It's an old book, but the vast majority of it is still relevant.
There are some references to technologies \[almost\] nobody uses anymore; DIP chips, DIN connectors, etc., but the discussions around them are still relevant - for instance ground bounce can still be an issue with modern SMT parts, due to higher speeds.
About the only thing missing is a discussion of some SMT-specific issues like selecting appropriate packages for decoupling capacitors, (the token references to SMT are almost all to 1206 size parts) or routing for BGAs.

Anyway, I've learned a few things from the book that will be applied to future projects (and would've been useful for prior ones), and definitely recommend it to anyone who designs PCBs involving fast digital signals or EMC requirements.

---

All this thinking about PCB design reminded me about project that's been on the TODO list for some time - the "Jim Williams Pulser", so named because it was popularised by [AN47](http://www.linear.com/docs/4138) - also a great read.
It's a really simple circuit that cleverly drives a bipolar transistor in to avalanche breakdown, to produce incredibly fast (few hundred picosecond, tens of volts) rising edges.

One of the main applications of the circuit, indeed the reason it was included in AN47, is for measuring the system bandwidth of an oscilloscope + probe combination.
I'm more interested in measuring small inductances and capacitances of traces on circuit boards, using techniques detailed in _High Speed Digital Design_.

![Home made pulse generator - transistor and passives are "dead-bug" assembled in the back of PCB mount BNC connector]({{ site.url }}/media/20170204-avalanche_pulser.jpg)

A few weeks ago, I made one of these avalanche pulsers, using a generic SMT BJT - supposedly a 2n2222, it needed about 220V before it would avalanche!
While I was tinkering with the pulser, I made a series of scope captures to illustrate some things about probing fast changing (read: digital) signals.
The time scale is the same in all these, 5ns per division, but the first one has a much smaller voltage scale.

First, to illustrate the utility in building a pulse generator, here's the fastest and highest voltage pulse that my signal generator (a Siglent SDG2042X, software upgraded to 120MHz) can make.
The Siglent is designed to be an arbitrary waveform generator, and does a great job for my typical use, but it is not ideal as a pulse generator.
I did use the Siglent to drive the power supply for the avalanche pulser, but otherwise the cost of my pulser is almost definitely under a dollar.

![Fastest pulse from SDG2042X - 10V in 8.8ns]({{ site.url }}/media/20170204-fastest_from_sdg2042x.png)

This is the avalanche pulser connected to the scope via a piece of 50Ω coax and an inline terminator.
The scope indicates a measly rise time of 1.2ns to 40V, so ~30 billion volts per second.
Realistically, we shouldn't take that number very seriously, because the real signal is well faster than my 100MHz scope is capable of measuring.
Note the two reflections 10ns and 20ns after the main pulse - these are a result of the impedance mismatch where the inline terminator goes in to the scope.
It's an echo, the signal is bouncing end-to-end through the BNC cable (the polarity is reversed by the bounce off the source end).
Some scopes have internal 50Ω terminators, which would reduce or eliminate that echo, and I'd guess would make this the best of the results.

![Avalanche pulser output 40V in 1.2ns]({{ site.url }}/media/20170204-pulser_direct_connection.png)

This is the setup, and resulting scope capture, for the best probing method I tried - using one of the 10x passive probes that came with the scope.
The pulse generator is connected to the inline terminator; that 50Ω termination is important (as is the insulation around the power supply connections)!
Note how the tip of the probe is right inside the BNC connector and the probe ground is connected as directly as possible.
The probe is set to 10x - to be honest I don't think these probes should even have the switch for 1x...

![Photo of test setup described above]({{ site.url }}/media/20170204-photo_probe_with_spring_clip.jpg)

![Scope capture from setup described above]({{ site.url }}/media/20170204-scope_probe_with_ground_spring.png)

...And here's why you don't want to use that 1x switch.
The setup is like the last one except with the 1/10x switch in the 1x position.
The impedance mismatch going in to the scope results in absolutely terrible fidelity (see V scale!).
The 1x switch is really only useful for measuring quite low amplitude, but also low impedance, and also not very fast, signals.
Just use a piece of coax with a BNC on the end instead!

![Scope capture from setup described above - only ~18V peak, with 15ns of pronounced rolloff]({{ site.url }}/media/20170204-scope_probe_with_ground_spring_1x.png)

Finally, here we are at the main takeaway from this rambly post - for good fidelity, don't use that convenient ground lead!
The issue is that the piece of wire adds significant inductance at these scales:

![Probe connected to pulse generator like above, except a short wire ground lead is used instead of the direct clip]({{ site.url }}/media/20170204-photo_probe_with_ground_lead.jpg)

![Scope capture from that setup - 1.8ns rise time indicated, several periods of 200MHz ringing decaying from ~10V]({{ site.url }}/media/20170204-scope_probe_with_ground_lead.png)
