---
layout: post
title: "Anthology of Effective Techniques in the Employment of Computing Machines"
categories:
---

Don't forget pipes
===
At work, I often need to deal with rather verbose logs that originate on developement hardware and get to my computer via serial ports. Lately, I use `screen` (one of the the more irritatingly named programs I've encountered) to receive the logs initially, then I either scan through the logs by eye or move them in to a text editor. 

Sometimes though, I'm only looking for a particular type of message. For instance, a device I'm working on today periodically outputs the state of a state machine that I'm interested in, via a line that starts with "STATE", but that is mixed in with tons of distracting irrelevant information. In this situation, it can be handy to pipe the output from the device through `grep` (or, more recently, [ripgrep](https://github.com/BurntSushi/ripgrep)), so only lines starting with STATE are displayed. Something like this on one terminal: `$ cat /dev/ttyUSB3 | tee full_log.txt | grep '^STATE'`, then optionally in a different terminal: `$ tail -f full_log.txt`. This captures the entire log to a file, and gives real-ish time output of both the complete log, and the lines that start with STATE.