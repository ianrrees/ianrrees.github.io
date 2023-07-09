---
layout: post
title: "Electric Car"
categories:
---

For a couple years, I've owned a 2014 Nissan Leaf (2nd generation).  In that time I've found some useful resources, and had a few projects/ideas related to it.

# EVSE

## Why?
Electric cars need to be charged up from somewhere, and the device used to connect the car with a source of electricity is properly called "Electric Vehicle Supply Equipment" aka EVSE.  The battery in the car is a DC creature, but at present most of us use AC for bulk electricity; my Leaf, like most electric cars today, has two connectors for charging from either AC or DC supplies.  The DC charging connector (a CHAdeMO type) is used for "fast charging" and more-or-less directly connects to the battery in the car - at this point I have never actually used it despite several DC fast chargers being available in our area.  The AC charging connector (J1772 type 1) powers a charger that's built in the car, the one in my car is capable of roughly 3.5kW, which is a bit small compared to newer cars.  Usually an in-line EVSE is included with purchase of an electric car, it's a smallish box with two cables attached - one has a connector for the car and the other has a standard household plug.  From what I've observed, most Leaf owners in NZ just use that in-line EVSE, and we did too for the first several months.

Several reasons pushed me to install a stationary EVSE, the most direct one was simply that parking the car right next to my house is a pain and the in-line EVSE isn't suitable for the better parking spot.  A stationary EVSE would also allow the car to charge faster, since the in-line that came with my Leaf EVSE maxes out at 8A.  Normal AC outlets here in Aotearoa are only good for 10A at 240V, so 2.4kW which is substantially less than even my older Leaf can draw.  From a car usage standpoint, I just about never actually care about the amount of time the car takes to charge, so long as it is less than "overnight".  But, there is a financial incentive to support faster charging!

The supply and demand of electricity changes continually, and that is reflected in the electricity billing here in NZ.  The details are out of scope, except to say that I currently pay for electricity based on the current spot price which changes every half hour, and can vary quite a lot.  Faster charging makes it easier to take advantage of cheaper power.  It is true that charging batteries faster can reduce their lifetimes, but those effects are closely related to battery temperature and only become significant at much higher charge rates - my stationary EVSE maxes out at about 7.5kW, where typical DC fast chargers around here are 25kW or 50kW and aren't considered particularly damaging to a Leaf battery at least in our temperate climate.

## What?
I have an [OpenEVSE](https://www.openevse.com/), which is wired and configured to provide 240V AC up to 32A to the car, and is connected to a home network via ethernet.

## How?

## Home Assistant Integration

## Ethernet r/t WiFi

# Towing with the Leaf
At present in Dunedin, there's a common belief that electric vehicles aren't good for towing, that somehow an electric drivetrain means towing a trailer is somehow more risky.  As far as I can tell this is a complete fabrication, and EVs are just fine towing vehicles.  The typical Kiwi solution when your car needs a towbar is to take it down to the towbard place, give them a few hundred dollars, and pick up your towing-enabled car a few hours later.  But, show up with a Leaf anywhere in Dunedin, and you get a towbar that's 0-rated for towing, only legally allowed to carry something like a bike rack.

[Towsafe](https://www.towsafe.co.nz/) in Christchurch manufactures trailer-rated towbar kits for Leafs, and will happily install one on your car, but they won't sell just the kit directly to the public.  [Blue Cars](https://bluecars.nz/) in Auckland also installs Towsafe towbars, and were willing to sell me one of the Towsafe kits.  It arrived within one or two business days of making payment, directly drop shipped from Christchurch...

I will say that the price I paid for that tow bar kit was quite a bit higher than I anticipated - with shipping (but just Christchurch to Dunedin) included, it cost about 50% more than I would expect to pay for parts+installation of a towbar on a similar size petrol-powered vehicle locally.  And, it turned out that the towbar had been bent either in manufacturing or shipping, and I had to bend it back - for that I used a really chunky old sash clamp to get plenty leverage.  If I had to do it again, I'd more seriously consider a road trip up to Christchurch, but with my Leaf (which I bought with a worn-out battery to begin with) that would probably be a mission.

The kit does require a bit of light metal work to install - mainly drilling a few 12mm holes up through the floor of the luggage area.  For me, the biggest hassle initially was to get enough of the plastic trim out of the way.  It's easy to find youtube videos of Leaf tow bar installs, but they seemed to be for differently-attached towbars from this one, which didn't require drilling in to the luggage area.

It's not too hard to find Nissan service manuals online, I'd encourage looking through those to at least be aware of the recommend assembly/disassembly of the plastic parts.  In particular, I noticed that some videos on youtube showed people mangling things for no obvious reason.  Understand how to remove the push-clip thing Nissan uses, most of the plastic is attached with these.

From memory, the sequence was something like:

## Mechanical
* Remove plastic cover under the rear of the car, and behind the rear wheels.
* Remove the rear bumper (see youtube, easier than it looks).
* Remove the recovery hook eye.
* Remove enough plastics to be able to detach the left hand "wall" of the luggage area.  I actually left that in the car, to avoid removing the back seat, and just gently held it out of the way, but in hindsight that was probably more trouble than removing it would have been.
* There's a triangular brace inside the car where the left hand side bumper attaches - you'll need to drill a hole through that brace, so I removed it at this stage and later used a drill press.  That said, it's probably OK to drill through it in situ.
* Position tow bar, attaching with provided bolts where the recovery hook eye was (be careful not to cross thread these!).
* Mark where the new bolt holes need to go on the left side.
* Being very careful to keep drill square, drill the rearmost and middle of those three holes from the bottom.
* Mark out and drill from the top where the forward hole should go, to ensure it lines up with the 2-holed backing plate/washer thing in the kit.
* Bolt it in place!  Use washers and lockwashers in the sensible places.  Note that the kit comes with new bolts for the threaded holes on the right hand side.
* Carefully mark out where the bumper and lower cover need to be cut out to go around the receiver, I cut mine with regular tin snips.  First make a coarse cut several mm inside of the final line, then a more careful clean cut to finish.  I drilled the corners first, for a nice stress relief, but that's probably not necessary.

* Reassemble.

## Wiring 
* There is a rubber drain plug to the right of centre in the luggage area, the cable can go through a hole in that.  Cut a notch in to the lower cover where it overlaps the bumper, for the cable to go through.  You wouldn't want the cable to go though a hole cut in the bumper or lower cover, because it would make installing/removing things more difficult.
* I definitely do not recommend removing the tail lights.  They're attached with very fragile clips, and don't afford any better access to wiring than from the inside of the luggage area.
* Pinout of rear light connector:

```
View from car wiring harness:

-----------------
| 2 |       | 1 |
-----------------
| 6 | 5 | 4 | 3 |
-----------------

1 - Green - Reverse
2 - Red (manual says yellow) - Stop
3 - Not Connected
4 - White - Turn
5 - Black - Ground/Earth
6 - Violet - Parking/running
```