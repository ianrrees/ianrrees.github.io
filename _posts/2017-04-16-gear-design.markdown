---
layout: post
title: "Gear Design"
categories:
---

Notes on CAD of gears.

!["Gear Geometry and Applied Theory" and "Practical Gear Design" on the coffee table]({{ site.url }}/media/20170416-gear-books.jpg)

For some time, I've had a passive interest in gear design; it's a field that I've hardly had anything to do with, but which appears to involve a neat intersection between math, materials, and practicality. Gears are used in all sorts of day-to-day things, and vary quite a lot, but the design of them still seems a bit mysterious.

In 2014, when I started getting involved with [FreeCAD](https://freecadweb.org/), I was intrigued by the basic tool it includes for generating involute spur gears, and started thinking about extending it in various ways. Around the same time, looooo started making a [gear workbench](https://github.com/looooo/freecad.gears), which has progressed nicely and covers many more scenarios including cycloid, bevel, helical, and rack gearing. However, there's a rather interesting and commonly used type of gear, which is not included in looooo's or any open-source CAD tool that I'm aware of: hypoid gearing (the [wikipedia page](https://en.wikipedia.org/wiki/Spiral_bevel_gear) isn't great currently, it confuses spiral bevels with hypoids...).

So I've had a simmering idea of making a FreeCAD workbench that's capable of designing hypoid gearing, and have been slowly accumulating information in that direction.

My first gearing-related purchase was __Dudley's Handbook of Practical Gear Design and Manufacture__, a 1st edition copy from 1954. Obviously, this copy is bit dated, but it was a cheap way to get a peek at what seems to be one of the standards on gear design, and hypoids aren't a new concept. I've read through most of the book, and found it to be fairly easy reading (for such a technical topic) and quite informative. In particular, the vintage typesetting and illustrations are quite cool. As the book describes, hypoids are usually made on gear cutting machines for spiral bevel gears, and so the practical design of them doesn't require explicitly designing tooth profiles and such. The entirety of discussion about hypoid gearing in this 1st edition of _Dudley's_ is less than a page - the meat of it is:
> The calculations to design a set of hypoid gears are quite long. A calculation sheet of about 150 items must be calculated to get all the answers needed. About 45 items on the sheet must be worked through on a trial basis and then repeated two or three times until assumed and calculated values check.
>  In view of the large amount of material needed to explain hypoid-gear calculations, it is not possible to present the method here.

So _Dudley's_, or at least the 1st edition of it, isn't too helpful in this direction. __Gear Geometry and Applied Theory__ by Litvin and Fuentes was the next candidate, due to it being both less expensive than the current edition of _Dudley's_ and apparently more on-topic. As a treat to myself, I recently bought a hardback copy of _Gear Geometry_. It is a full-on textbook with references, equations, problems, and a really dry style; all about making gears using computers - perfect! There's an entire chapter on hypoids, about 20 pages but references concepts and equations from earlier in the book. So, I guess the next step is a bit of studying up, then some coding.

### Other resources

ISO 23509 "Bevel and hypoid gear geometry" - might be an alternative source to _Gear Geometry_, but based on prior experience with technical standards I figured the _Gear Geometry_ textbook would be more directly applicable.

"A Mathematical Model for the Tooth Geometry of Hypoid Gears" C.-B. Tsay and J.-Y. Lin - A full 12-page pdf is available online. It more-or-less models the geometry of a Gleason cutting tool, I had a hard time seeing how to take their description of the process, and follow through to a an algorithm to model the resulting gear.
