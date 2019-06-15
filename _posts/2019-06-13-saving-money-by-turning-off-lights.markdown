---
layout: post
title: "Saving Money by Turning Off Lights"
categories:
local-js:
    - "20190613-lighting-calculator.js"
---

Conscientious people turn off the lights when they're the last person to leave a room.
I imagine that back when incandescent lighting was king, that probably made a lot of sense - leaving the lights on when nobody's around would be wasting a substantial amount of money through both electricity usage and bulbs burning out.
But, if the light being turned off is a modestly sized LED one, and especially if an electrician would be hired to replace a worn out light switch, I wonder if the situation is so clear-cut?

Each time the switch is turned *Off*, a small cost is incurred due to the wear and tear on both the switch and the light.
If the switch is left *On*, the cost incurred is a function of time; the light continues to consume electricity, and the light has a finite running lifetime - this is the case that seems to be more commonly considered.

So, the question becomes: how long does it take until the cost of leaving the light *On* exceeds the cost of turning the light *Off*.
It only makes financial sense to turn the light *Off* if it'll stay that way for longer than the break even time.

I've also wondered how hard it would be to insert a javascript calculator in to a blog post (answer: not very).
What a nice coincidence!
Perhaps there'll be more of these in the future, maybe with graphs!

<table>
<tr><td>Power draw of lights</td><td>
<input type="text" id="power" value="13" onchange="update()"></td><td>Watts</td></tr>

<tr><td>Cost of electricity</td><td>
<input type="text" id="power_cost" value="0.24" onchange="update()"></td><td>$/(kW*hr)</td></tr>

<tr><td>Replacement cost of light</td><td>
<input type="text" id="light_cost" value="5" onchange="update()"></td><td>$</td></tr>

<tr><td>Rated hours of light</td><td>
<input type="text" id="light_hours" value="15000" onchange="update()"></td><td>hour</td></tr>

<tr><td>Rated on/off cycles of light</td><td>
<input type="text" id="light_switches" value="50000" onchange="update()"></td><td>switches</td></tr>

<tr><td>Replacement cost of switch</td><td>
<input type="text" id="switch_cost" value="50" onchange="update()"></td><td>$</td></tr>

<tr><td>Lifetime of switch</td><td>
<input type="text" id="switch_switches" value="100000" onchange="update()"></td><td>switches</td></tr>

<tr><td>Break even off time</td><td>
<input type="text" id="result" disabled></td><td id="result_units"/></tr>

<tr><td colspan="3" id="error_row"></td></tr>

</table>
<script>
    update();
</script>
<br />

So, we see that for an LED light, the break even time is indeed about 10 times longer than for an equivalent (in terms of light output) incandescent - the light I'm using in the example is apparently equivalent to a 90W incandescent bulb, those typically have a lifetime of about 1000 hours.
In typical day-to-day light switching consideration, this all shows that it probably does make sense to continue turning off lights when you're the last person out the door.

Notes:
  * There is a slight simplification in the above - it doesn't account for the fact that when a light fails due to on/off cycles, the new bulb won't have any hours on the clock (or vice-versa).

  * In a few minutes of searching, I couldn't find an on/off cycle rating for a typical light switch.
  The light specifications come from a box for an LED light I have handy.
